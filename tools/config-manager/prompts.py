"""
Interactive prompts for the config manager CLI.
"""

import os
import subprocess
import tempfile

import questionary
import yaml
from pydantic import ValidationError
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from models import (
    CompanyConfig,
    ModelFamily,
    Model,
    ModelAttributes,
    HardwareConfig,
    VersionConfig,
    NamedConfiguration,
    ConfigAttributes,
    EngineConfig,
)

console = Console()


def print_header(title: str) -> None:
    """Print a styled header"""
    console.print(Panel(title, style="bold blue"))


def print_success(message: str) -> None:
    """Print a success message"""
    console.print(f"[green]{message}[/green]")


def print_error(message: str) -> None:
    """Print an error message"""
    console.print(f"[red]{message}[/red]")


def print_info(message: str) -> None:
    """Print an info message"""
    console.print(f"[cyan]{message}[/cyan]")


# ============ Editor-Based Editing ============

def _safe_unlink(path: str) -> None:
    """Safely delete a file, ignoring errors."""
    try:
        if path and os.path.exists(path):
            os.unlink(path)
    except OSError:
        pass


def _get_editor() -> str | None:
    """Get and validate the editor to use.

    Returns the editor command if valid, None otherwise.
    """
    import shutil

    editor = os.environ.get('EDITOR', 'vim')

    # Handle editors with arguments (e.g., "code --wait")
    editor_cmd = editor.split()[0]

    # Check if editor exists in PATH
    editor_path = shutil.which(editor_cmd)
    if not editor_path:
        print_error(f"Editor '{editor_cmd}' not found in PATH")
        print_info("Set the EDITOR environment variable to a valid editor")
        return None

    return editor


def edit_in_editor(config: NamedConfiguration) -> NamedConfiguration | None:
    """
    Open configuration in user's editor (vim by default) for editing.

    The configuration is serialized to YAML with helpful comments.
    After editing, the result is parsed and validated. If validation fails,
    user is prompted to re-edit in a retry loop.

    Args:
        config: The configuration to edit

    Returns:
        Updated configuration if valid and saved, None if cancelled by user
        or on editor error.

    Note:
        Uses $EDITOR environment variable (defaults to 'vim').
        Creates a temporary file that is cleaned up on exit.
    """
    # Validate editor first
    editor = _get_editor()
    if not editor:
        return None

    # 1. Serialize config to YAML
    config_dict = config.model_dump(exclude_none=False)
    try:
        yaml_content = yaml.dump(
            config_dict,
            default_flow_style=False,
            sort_keys=False,
            allow_unicode=True,
            width=120
        )
    except yaml.YAMLError as e:
        print_error(f"Failed to serialize configuration: {e}")
        return None

    # 2. Add helpful comments at the top
    header = """# Edit this configuration. Save and exit to apply changes.
# To cancel: close without saving (vim: :q!) or delete all content and save.
#
# IMPORTANT: Mutual exclusivity rule:
#   - Use EITHER 'engine' alone (unified config)
#   - OR use BOTH 'prefill' AND 'decode' together (phase-specific config)
#   - You CANNOT have both 'engine' and 'prefill'/'decode' at the same time
#   - Set unwanted sections to null (e.g., engine: null)
#
# Valid values:
#   nodes: "single" | "multi"
#   optimization: "balanced" | "low-latency" | "high-throughput"
#   quantization: "fp8" | "int4" | "bf16" | "fp4" (required)
#   tp: positive integer (required in engine)
#   dp, ep: positive integers or null
#   enable_dp_attention: true | false | null
#   env_vars: key-value pairs or empty {}
#   extra_args: list of strings or empty []
#   prefill/decode: same structure as engine (tp required, others optional)
#
# ─────────────────────────────────────────────────────────────────
"""
    full_content = header + yaml_content

    # 3. Write to temp file
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.yaml',
            prefix='config_',
            delete=False,
            encoding='utf-8'
        ) as f:
            f.write(full_content)
            temp_path = f.name
    except IOError as e:
        print_error(f"Failed to create temporary file: {e}")
        return None

    try:
        while True:
            # 4. Open in editor
            try:
                result = subprocess.run(
                    editor.split() + [temp_path],
                    timeout=7200  # 2 hour timeout
                )
            except subprocess.TimeoutExpired:
                print_error("Editor session timed out (2 hour limit)")
                return None

            if result.returncode != 0:
                print_error(f"Editor exited with code {result.returncode}")
                return None

            # 5. Check file exists before reading
            if not os.path.exists(temp_path):
                print_error("Temporary file was deleted")
                return None

            # 6. Read back and parse
            try:
                with open(temp_path, 'r', encoding='utf-8') as f:
                    edited_content = f.read()
            except (FileNotFoundError, PermissionError, IOError) as e:
                print_error(f"Failed to read edited file: {e}")
                return None

            try:
                # Parse YAML (comments are automatically ignored)
                edited_data = yaml.safe_load(edited_content)

                if edited_data is None:
                    print_error("Empty configuration")
                    if not questionary.confirm("Re-edit?", default=True).ask():
                        return None
                    continue

                # 7. Validate with Pydantic
                return NamedConfiguration(**edited_data)

            except yaml.YAMLError as e:
                print_error(f"Invalid YAML syntax (check for unquoted special characters):\n{e}")
                if not questionary.confirm("Re-edit?", default=True).ask():
                    return None
                # Continue to re-edit with the same (invalid) content

            except ValidationError as e:
                # Format validation errors nicely
                error_msgs = []
                for err in e.errors():
                    loc = " -> ".join(str(x) for x in err["loc"])
                    error_msgs.append(f"  {loc}: {err['msg']}")
                print_error(f"Validation errors:\n" + "\n".join(error_msgs))
                if not questionary.confirm("Re-edit?", default=True).ask():
                    return None
                # Continue to re-edit - user's edits are preserved in the temp file

    except KeyboardInterrupt:
        print_info("\nEdit cancelled")
        return None

    finally:
        # 8. Clean up temp file
        _safe_unlink(temp_path)


# ============ Company Prompts ============

def prompt_add_company() -> CompanyConfig | None:
    """Prompt to add a new company"""
    print_header("Add New Company")

    company_name = questionary.text(
        "Company/organization name (e.g., deepseek-ai):",
        validate=lambda x: len(x.strip()) > 0
    ).ask()

    if not company_name:
        return None

    return CompanyConfig(company=company_name.strip(), families=[])


# ============ Family Prompts ============

def prompt_add_family() -> ModelFamily | None:
    """Prompt to add a new model family"""
    print_header("Add New Model Family")

    name = questionary.text(
        "Family name (e.g., DeepSeek-V3.2):",
        validate=lambda x: len(x.strip()) > 0
    ).ask()

    if not name:
        return None

    description = questionary.text(
        "Description (optional):",
    ).ask()

    return ModelFamily(
        name=name.strip(),
        description=description.strip() if description else None,
        models=[]
    )


# ============ Model Prompts ============

def prompt_add_model(company_name: str | None = None) -> Model | None:
    """Prompt to add a new model.

    Args:
        company_name: Optional company name to generate default model path.
    """
    print_header("Add New Model")

    name = questionary.text(
        "Model name (e.g., DeepSeek-V3.2):",
        validate=lambda x: len(x.strip()) > 0
    ).ask()

    if not name:
        return None

    # Generate default model path from company/model name
    default_path = ""
    if company_name:
        default_path = f"{company_name}/{name.strip()}"

    model_path = questionary.text(
        "HuggingFace model path:",
        default=default_path,
        validate=lambda x: len(x.strip()) > 0
    ).ask()

    if not model_path:
        return None

    # Thinking capability
    thinking_capability = questionary.select(
        "Select thinking capability:",
        choices=[
            questionary.Choice("non_thinking - Model does not support thinking mode", value="non_thinking"),
            questionary.Choice("thinking - Model supports thinking mode", value="thinking"),
            questionary.Choice("hybrid - Model supports both thinking and non-thinking modes", value="hybrid"),
        ]
    ).ask()

    if not thinking_capability:
        thinking_capability = "non_thinking"

    # Tool parser
    tool_parser = questionary.text(
        "Tool parser name (leave empty if not supported):"
    ).ask()

    # Reasoning parser
    reasoning_parser = questionary.text(
        "Reasoning parser name (leave empty if not supported):"
    ).ask()

    # Chat template
    chat_template = questionary.text(
        "Chat template path (leave empty for default):"
    ).ask()

    return Model(
        name=name.strip(),
        model_path=model_path.strip(),
        attributes=ModelAttributes(
            thinking_capability=thinking_capability,
            tool_parser=tool_parser.strip() if tool_parser else None,
            reasoning_parser=reasoning_parser.strip() if reasoning_parser else None,
            chat_template=chat_template.strip() if chat_template else None,
        ),
        hardware={}
    )


# ============ Hardware Prompts ============

def prompt_add_hardware_type(model: Model) -> str | None:
    """Prompt to add a new hardware type to a model"""
    print_header("Add New Hardware")

    hardware = questionary.select(
        "Select hardware type:",
        choices=["H100", "H200", "B200", "A100", "Other"]
    ).ask()

    if hardware == "Other":
        hardware = questionary.text(
            "Enter hardware name:",
            validate=lambda x: len(x.strip()) > 0
        ).ask()

    if hardware and hardware not in model.hardware:
        model.hardware[hardware] = HardwareConfig(versions={})
        return hardware

    if hardware and hardware in model.hardware:
        print_error(f"Hardware '{hardware}' already exists.")
        return None

    return None


# ============ Version Prompts ============

def prompt_add_version(hardware_config: HardwareConfig) -> str | None:
    """Prompt to add a new SGLang version"""
    print_header("Add New SGLang Version")

    version = questionary.text(
        "Enter SGLang version (e.g., v0.5.6):",
        validate=lambda x: len(x.strip()) > 0
    ).ask()

    if version and version not in hardware_config.versions:
        hardware_config.versions[version] = VersionConfig(configurations=[])
        return version

    if version and version in hardware_config.versions:
        print_error(f"Version '{version}' already exists.")
        return None

    return None


# ============ Named Configuration Prompts ============

def prompt_add_configuration() -> NamedConfiguration | None:
    """Prompt to add a new named configuration.

    Returns None if user cancels at any point (ESC/Ctrl+C).
    """
    print_header("Add New Configuration")

    name = questionary.text(
        "Configuration name (e.g., default, low-latency-fp8):",
        validate=lambda x: len(x.strip()) > 0
    ).ask()

    if not name:
        return None

    # Attributes
    print_info("Configuration attributes:")

    nodes = questionary.select(
        "Node configuration:",
        choices=["single", "multi"]
    ).ask()
    if nodes is None:
        return None

    optimization = questionary.select(
        "Optimization target:",
        choices=["balanced", "low-latency", "high-throughput"]
    ).ask()
    if optimization is None:
        return None

    quantization = questionary.select(
        "Quantization format:",
        choices=[
            questionary.Choice("fp8", value="fp8"),
            questionary.Choice("int4", value="int4"),
            questionary.Choice("bf16", value="bf16"),
            questionary.Choice("fp4", value="fp4"),
        ]
    ).ask()
    if quantization is None:
        return None

    # Quantized model path
    quantized_model_path = questionary.text(
        "Quantized model path (leave empty to use base model):"
    ).ask()
    quantized_model_path = quantized_model_path.strip() if quantized_model_path else None

    # Configuration mode: engine-only OR prefill+decode
    print_info("Configuration mode:")
    config_mode = questionary.select(
        "Select configuration mode:",
        choices=[
            questionary.Choice(
                "Engine only (unified config)",
                value="engine"
            ),
            questionary.Choice(
                "Prefill + Decode (phase-specific config)",
                value="phases"
            ),
        ]
    ).ask()
    if config_mode is None:
        return None

    engine = None
    prefill = None
    decode = None

    if config_mode == "engine":
        # Engine config
        print_info("Engine configuration:")

        tp = questionary.text(
            "Tensor Parallelism (tp):",
            default="8",
            validate=lambda x: x.isdigit() and int(x) >= 1
        ).ask()
        if tp is None:
            return None

        dp_str = questionary.text(
            "Data Parallelism (dp, leave empty if not used):"
        ).ask()
        dp = int(dp_str) if dp_str and dp_str.isdigit() else None

        ep_str = questionary.text(
            "Expert Parallelism (ep, leave empty if not used):"
        ).ask()
        ep = int(ep_str) if ep_str and ep_str.isdigit() else None

        enable_dp_attention = None
        if dp:
            dp_attn_result = questionary.confirm("Enable DP attention?", default=False).ask()
            if dp_attn_result:
                enable_dp_attention = True

        # Environment variables
        env_vars = {}
        add_env_vars = questionary.confirm("Add environment variables?", default=False).ask()
        if add_env_vars:
            while True:
                key = questionary.text("Env var name (empty to finish):").ask()
                if not key:
                    break
                value = questionary.text(f"Value for {key}:").ask()
                if value is not None:
                    env_vars[key] = value

        # Extra args
        extra_args = []
        add_extra_args = questionary.confirm("Add extra command-line arguments?", default=False).ask()
        if add_extra_args:
            args_str = questionary.text(
                "Enter extra args (space-separated):"
            ).ask()
            if args_str:
                extra_args = args_str.split()

        engine = EngineConfig(
            env_vars=env_vars if env_vars else None,
            tp=int(tp),
            dp=dp,
            ep=ep,
            enable_dp_attention=enable_dp_attention,
            extra_args=extra_args if extra_args else None
        )

    else:  # config_mode == "phases"
        # Prefill config
        print_info("Prefill configuration:")
        prefill_tp = questionary.text(
            "Prefill Tensor Parallelism (tp):",
            default="8",
            validate=lambda x: x.isdigit() and int(x) >= 1
        ).ask()
        if prefill_tp is None:
            return None
        prefill = EngineConfig(tp=int(prefill_tp))

        # Decode config
        print_info("Decode configuration:")
        decode_tp = questionary.text(
            "Decode Tensor Parallelism (tp):",
            default="8",
            validate=lambda x: x.isdigit() and int(x) >= 1
        ).ask()
        if decode_tp is None:
            return None
        decode = EngineConfig(tp=int(decode_tp))

    return NamedConfiguration(
        name=name.strip(),
        attributes=ConfigAttributes(
            nodes=nodes,
            optimization=optimization,
            quantization=quantization
        ),
        quantized_model_path=quantized_model_path,
        engine=engine,
        prefill=prefill,
        decode=decode
    )


def prompt_edit_configuration(config: NamedConfiguration) -> NamedConfiguration | None:
    """Prompt to edit an existing configuration.

    Returns None if user cancels at any point (ESC/Ctrl+C).
    """
    print_header(f"Edit Configuration: {config.name}")

    # Name
    name = questionary.text(
        "Configuration name:",
        default=config.name,
        validate=lambda x: len(x.strip()) > 0
    ).ask()

    if not name:
        return None

    # Attributes
    print_info("Configuration attributes:")

    nodes = questionary.select(
        "Node configuration:",
        choices=["single", "multi"],
        default=config.attributes.nodes
    ).ask()
    if nodes is None:
        return None

    optimization = questionary.select(
        "Optimization target:",
        choices=["balanced", "low-latency", "high-throughput"],
        default=config.attributes.optimization
    ).ask()
    if optimization is None:
        return None

    quantization = questionary.select(
        "Quantization format:",
        choices=[
            questionary.Choice("fp8", value="fp8"),
            questionary.Choice("int4", value="int4"),
            questionary.Choice("bf16", value="bf16"),
            questionary.Choice("fp4", value="fp4"),
        ],
        default=config.attributes.quantization
    ).ask()
    if quantization is None:
        return None

    # Quantized model path
    quantized_model_path = questionary.text(
        "Quantized model path (leave empty to use base model):",
        default=config.quantized_model_path or ""
    ).ask()
    quantized_model_path = quantized_model_path.strip() if quantized_model_path else None

    # Determine current config mode and offer to change
    current_mode = "engine" if config.engine is not None else "phases"
    print_info(f"Current configuration mode: {current_mode}")

    config_mode = questionary.select(
        "Select configuration mode:",
        choices=[
            questionary.Choice(
                "Engine only (unified config)",
                value="engine"
            ),
            questionary.Choice(
                "Prefill + Decode (phase-specific config)",
                value="phases"
            ),
        ],
        default=current_mode
    ).ask()
    if config_mode is None:
        return None

    engine = None
    prefill = None
    decode = None

    if config_mode == "engine":
        # Engine config
        print_info("Engine configuration:")

        # Get defaults from existing engine config if present
        default_tp = str(config.engine.tp) if config.engine else "8"
        default_dp = str(config.engine.dp) if config.engine and config.engine.dp else ""
        default_ep = str(config.engine.ep) if config.engine and config.engine.ep else ""
        default_dp_attn = config.engine.enable_dp_attention if config.engine else False
        default_env_vars = dict(config.engine.env_vars) if config.engine and config.engine.env_vars else {}
        default_extra_args = list(config.engine.extra_args) if config.engine and config.engine.extra_args else []

        tp = questionary.text(
            "Tensor Parallelism (tp):",
            default=default_tp,
            validate=lambda x: x.isdigit() and int(x) >= 1
        ).ask()
        if tp is None:
            return None

        dp_str = questionary.text(
            "Data Parallelism (dp, leave empty if not used):",
            default=default_dp
        ).ask()
        dp = int(dp_str) if dp_str and dp_str.isdigit() else None

        ep_str = questionary.text(
            "Expert Parallelism (ep, leave empty if not used):",
            default=default_ep
        ).ask()
        ep = int(ep_str) if ep_str and ep_str.isdigit() else None

        enable_dp_attention = None
        if dp:
            dp_attn_result = questionary.confirm(
                "Enable DP attention?",
                default=default_dp_attn or False
            ).ask()
            if dp_attn_result:
                enable_dp_attention = True

        # Environment variables
        env_vars = default_env_vars
        edit_env_vars = questionary.confirm(
            f"Edit environment variables? (current: {env_vars})",
            default=False
        ).ask()
        if edit_env_vars:
            env_vars = {}
            while True:
                key = questionary.text("Env var name (empty to finish):").ask()
                if not key:
                    break
                value = questionary.text(f"Value for {key}:").ask()
                if value is not None:
                    env_vars[key] = value

        # Extra args
        extra_args = default_extra_args
        edit_extra_args = questionary.confirm(
            f"Edit extra arguments? (current: {extra_args})",
            default=False
        ).ask()
        if edit_extra_args:
            args_str = questionary.text(
                "Enter extra args (space-separated):",
                default=" ".join(extra_args)
            ).ask()
            extra_args = args_str.split() if args_str else []

        engine = EngineConfig(
            env_vars=env_vars if env_vars else None,
            tp=int(tp),
            dp=dp,
            ep=ep,
            enable_dp_attention=enable_dp_attention,
            extra_args=extra_args if extra_args else None
        )

    else:  # config_mode == "phases"
        # Prefill config
        print_info("Prefill configuration:")
        default_prefill_tp = str(config.prefill.tp) if config.prefill else "8"
        prefill_tp = questionary.text(
            "Prefill Tensor Parallelism (tp):",
            default=default_prefill_tp,
            validate=lambda x: x.isdigit() and int(x) >= 1
        ).ask()
        if prefill_tp is None:
            return None
        prefill = EngineConfig(tp=int(prefill_tp))

        # Decode config
        print_info("Decode configuration:")
        default_decode_tp = str(config.decode.tp) if config.decode else "8"
        decode_tp = questionary.text(
            "Decode Tensor Parallelism (tp):",
            default=default_decode_tp,
            validate=lambda x: x.isdigit() and int(x) >= 1
        ).ask()
        if decode_tp is None:
            return None
        decode = EngineConfig(tp=int(decode_tp))

    return NamedConfiguration(
        name=name.strip(),
        attributes=ConfigAttributes(
            nodes=nodes,
            optimization=optimization,
            quantization=quantization
        ),
        quantized_model_path=quantized_model_path,
        engine=engine,
        prefill=prefill,
        decode=decode
    )


# ============ Display Functions ============

def display_config_summary(config: CompanyConfig) -> None:
    """Display a summary of the company configuration"""
    table = Table(title=f"Company: {config.company}")
    table.add_column("Family", style="cyan")
    table.add_column("Models", style="green")
    table.add_column("Hardware Configs", style="yellow")

    for family in config.families:
        hw_configs = sum(
            len(model.hardware)
            for model in family.models
        )
        table.add_row(
            family.name,
            str(len(family.models)),
            str(hw_configs)
        )

    console.print(table)
