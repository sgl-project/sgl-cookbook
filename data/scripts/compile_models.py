#!/usr/bin/env python3
"""
Model Configuration Compiler

Compiles simplified model configuration YAML files into the full schema format.

Usage:
    python compile_models.py [--input-dir DIR] [--output-dir DIR] [--check]

The compiler reads simplified YAML files from the input directory and generates
full schema-compliant YAML files in the output directory.

Supports two patterns:
1. Variant Generation: Define base_name + capabilities + quantizations
2. Explicit Models: Define name directly (no variant expansion)
"""

import argparse
import sys
from pathlib import Path
from typing import Any

import yaml


# =============================================================================
# Variant Generation Constants
# =============================================================================

# Only "base" has a default suffix (empty). Other capabilities like "instruct"
# and "thinking" must be explicitly defined via model_name_suffix in src files.
MODEL_NAME_SUFFIXES = {
    "base": "",
}

DEFAULT_QUANT_SUFFIXES = {
    "bf16": "",
    "fp8": "-FP8",
    "fp4": "-FP4",
    "int4": "-INT4",
}


# =============================================================================
# Engine Configuration Builders
# =============================================================================


def build_engine_config(
    hw_config: dict,
    config_template: dict,
    quant: str | None = None,
    quant_overrides: dict | None = None,
) -> dict:
    """Build a full engine configuration block."""
    # Start with config_template defaults (e.g., from "default" or "high-throughput-dp")
    # Then override with hardware-specific config

    # Get tp: hardware config overrides config template
    tp = hw_config.get("tp", config_template.get("tp", 8))

    # Build base engine config from config template, overridden by hardware config
    engine = {
        "env_vars": hw_config.get("env_vars", config_template.get("env_vars", {})),
        "tp": tp,
        "dp": hw_config.get("dp", config_template.get("dp")),
        "ep": hw_config.get("ep", config_template.get("ep")),
        "enable_dp_attention": hw_config.get(
            "enable_dp_attention", config_template.get("enable_dp_attention")
        ),
        "extra_args": hw_config.get("extra_args", config_template.get("extra_args", [])),
    }

    # Apply quantization-specific overrides (e.g., fp8: { ep: 2 })
    if quant and quant_overrides:
        for key, value in quant_overrides.items():
            engine[key] = value

    return engine


def build_named_configuration(
    config_template: dict,
    hw_config: dict,
    quant: str,
    quant_overrides: dict | None = None,
) -> dict:
    """Build a full named configuration block."""
    engine_config = build_engine_config(
        hw_config, config_template, quant, quant_overrides
    )

    return {
        "name": config_template["name"],
        "attributes": {
            "nodes": config_template.get("nodes", "single"),
            "optimization": config_template.get("optimization", "balanced"),
            "quantization": quant,
        },
        "quantized_model_path": None,
        "engine": engine_config,
        "prefill": None,
        "decode": None,
    }


def build_hardware_config(
    hw_name: str,
    hw_config: dict,
    defaults: dict,
    quant: str,
    quant_overrides: dict | None = None,
) -> dict:
    """Build hardware configuration with all named configurations."""
    # Version is now a top-level folder, so we directly return configurations
    configurations = []
    for config_template in defaults.get("configurations", []):
        configurations.append(
            build_named_configuration(config_template, hw_config, quant, quant_overrides)
        )
    return {"configurations": configurations}


# =============================================================================
# Model Builders
# =============================================================================


def get_llm_attr(obj: dict, key: str, default: Any = None) -> Any:
    """Get an LLM attribute from either obj.llm.key or obj.key (for backwards compatibility)."""
    llm = obj.get("llm", {})
    if key in llm:
        return llm[key]
    return obj.get(key, default)


def get_merged_hardware_config(
    family: dict,
    model_def: dict,
    defaults: dict,
) -> tuple[dict, list[str]]:
    """
    Merge hardware configs from file-level defaults, family, and model levels.

    Returns (merged_hw_configs, hardware_list) where:
    - merged_hw_configs: dict with 'default' and hardware-specific overrides
    - hardware_list: list of hardware names to generate

    Inheritance order (most specific wins):
    1. model.hardware.{H100,H200,B200} - specific hardware override
    2. model.hardware.default - model default for all hardware
    3. family.hardware.{H100,H200,B200} - family hardware override
    4. family.hardware.default - family default for all hardware
    5. defaults.hardware.{H100,H200,B200} - file-level per-hardware default
    """
    # Get hardware configs from each level
    # defaults.hardware can be either:
    # - dict: { H100: { tp: 8 }, H200: { tp: 8 } } (new format with per-hw defaults)
    # - list: [H100, H200, B200] (old format, just hardware names)
    defaults_hw = defaults.get("hardware", {})
    family_hw = family.get("hardware", {})
    model_hw = model_def.get("hardware", {}) if isinstance(model_def, dict) else {}

    # Handle both old (list) and new (dict) formats for defaults.hardware
    if isinstance(defaults_hw, list):
        # Old format: list of hardware names, no per-hw defaults
        file_level_hw_configs = {}
        default_hardware_list = defaults_hw
    else:
        # New format: dict with per-hardware configs
        file_level_hw_configs = defaults_hw
        default_hardware_list = list(defaults_hw.keys())

    # Get default configs from family and model (applies to all hardware)
    family_default = family_hw.get("default", {})
    model_default = model_hw.get("default", {})

    # Build merged hardware config with file-level defaults as base
    merged_hw_configs = {"default": {**family_default, **model_default}}

    # Collect all hardware-specific keys from all levels
    all_hw_keys = set(default_hardware_list)
    for key in family_hw:
        if key != "default":
            all_hw_keys.add(key)
    for key in model_hw:
        if key != "default":
            all_hw_keys.add(key)

    # Merge hardware-specific configs with inheritance chain
    # Order: file-level hw -> family default -> family hw -> model default -> model hw
    for hw_name in all_hw_keys:
        # Start with file-level per-hardware default
        file_hw_config = file_level_hw_configs.get(hw_name, {})
        # Then family-level per-hardware override
        family_hw_specific = family_hw.get(hw_name, {})
        # Then model-level per-hardware override
        model_hw_specific = model_hw.get(hw_name, {})
        # Merge: file -> family_default -> family_hw -> model_default -> model_hw
        merged_hw_configs[hw_name] = {
            **file_hw_config,
            **family_default,
            **family_hw_specific,
            **model_default,
            **model_hw_specific,
        }

    # Determine hardware list:
    # - If model has explicit hardware keys (not just default), use those
    # - Else if family has explicit hardware keys (not just default), use those
    # - Else use all hardware from defaults.hardware
    model_explicit_hw = [k for k in model_hw if k != "default"]
    family_explicit_hw = [k for k in family_hw if k != "default"]

    if model_explicit_hw:
        # Model explicitly lists hardware (e.g., only H200/B200)
        hardware_list = model_explicit_hw
    elif family_explicit_hw and not model_default and not family_default:
        # Family explicitly lists hardware without defaults
        hardware_list = family_explicit_hw
    else:
        # Use all hardware from file-level defaults
        hardware_list = default_hardware_list

    return merged_hw_configs, hardware_list


def build_model_attributes(
    family: dict,
    model_def: dict,
    capability: str | None = None,
) -> dict:
    """Build model attributes from family defaults and model overrides."""
    # Determine thinking_capability based on:
    # 1. Model-level override (model_def.llm.thinking_capability or model_def.thinking_capability)
    # 2. Family-level default (family.llm.thinking_capability or family.thinking_capability)
    # 3. Infer from capability variant
    thinking_cap = get_llm_attr(model_def, "thinking_capability")
    if thinking_cap is None:
        thinking_cap = get_llm_attr(family, "thinking_capability")

    # If not explicitly set, infer from capability
    if thinking_cap is None and capability:
        if capability == "thinking":
            thinking_cap = "thinking"
        else:
            thinking_cap = "non_thinking"

    # Get parsers from model or family (check llm wrapper first)
    tool_parser = get_llm_attr(model_def, "tool_parser")
    if tool_parser is None:
        tool_parser = get_llm_attr(family, "tool_parser")

    reasoning_parser = get_llm_attr(model_def, "reasoning_parser")
    if reasoning_parser is None:
        reasoning_parser = get_llm_attr(family, "reasoning_parser")

    chat_template = get_llm_attr(model_def, "chat_template")
    if chat_template is None:
        chat_template = get_llm_attr(family, "chat_template")

    # For instruct variants, typically no reasoning parser
    if capability == "instruct":
        reasoning_parser = None
    # For base variants without thinking capability, no reasoning parser
    elif capability == "base" and thinking_cap != "hybrid":
        reasoning_parser = None

    return {
        "llm": {
            "thinking_capability": thinking_cap,
            "tool_parser": tool_parser,
            "reasoning_parser": reasoning_parser,
            "chat_template": chat_template,
        }
    }


def generate_model_variants(
    company: str,
    family: dict,
    model_def: dict,
    defaults: dict,
) -> list[dict]:
    """Generate model variants from a base model definition with capabilities/quantizations."""
    base_name = model_def["base_name"]
    family_name = family["name"]

    # Get variant dimensions
    capabilities = model_def.get("capabilities", ["base"])
    quantizations = model_def.get("quantizations", ["bf16", "fp8"])

    # Get custom quant suffixes if defined
    quant_suffixes = model_def.get("quant_suffix", DEFAULT_QUANT_SUFFIXES)

    # Get quantized paths if different paths per quantization
    quantized_paths = model_def.get("quantized_paths", {})

    # Get merged hardware config from family and model levels
    hw_configs, hardware_list = get_merged_hardware_config(family, model_def, defaults)
    default_hw_config = hw_configs.get("default", {})

    models = []

    # Get model name suffixes (for capability variants) from model or family level
    name_suffixes = model_def.get("model_name_suffix", family.get("model_name_suffix", MODEL_NAME_SUFFIXES))

    for capability in capabilities:
        for quant in quantizations:
            # Build model name
            name_suffix = name_suffixes.get(capability, MODEL_NAME_SUFFIXES.get(capability, ""))
            quant_suffix = quant_suffixes.get(quant, DEFAULT_QUANT_SUFFIXES.get(quant, ""))
            model_name = f"{family_name}-{base_name}{name_suffix}{quant_suffix}"

            # Determine model path
            if quantized_paths and quant in quantized_paths:
                model_path = quantized_paths[quant]
            else:
                # Default: company/model_name
                model_path = f"{company}/{model_name}"

            # Get quantization-specific overrides (e.g., quant_overrides: { fp8: { ep: 2 } })
            quant_overrides_section = model_def.get("quant_overrides", {})
            quant_overrides = quant_overrides_section.get(quant, {})

            # Build hardware configurations
            hardware = {}
            for hw_name in hardware_list:
                # Start with default config, then merge hardware-specific overrides
                hw_config = {**default_hw_config, **hw_configs.get(hw_name, {})}

                # Check hardware constraints (valid_quants)
                valid_quants = hw_config.get("valid_quants")
                if valid_quants and quant not in valid_quants:
                    continue  # Skip this hardware for this quantization

                hardware[hw_name] = build_hardware_config(
                    hw_name, hw_config, defaults, quant, quant_overrides
                )

            # Skip if no valid hardware
            if not hardware:
                continue

            models.append({
                "name": model_name,
                "model_path": model_path,
                "attributes": build_model_attributes(family, model_def, capability),
                "hardware": hardware,
            })

    return models


def build_explicit_model(
    company: str,
    family: dict,
    model_def: dict | str,
    defaults: dict,
) -> dict:
    """Build a single explicit model (no variant generation)."""
    # Handle string-only model definition (just the name)
    if isinstance(model_def, str):
        model_def = {"name": model_def}

    model_name = model_def["name"]

    # Derive model_path if not specified
    model_path = model_def.get("model_path", f"{company}/{model_name}")

    # Get merged hardware config from family and model levels
    hw_configs, hardware_list = get_merged_hardware_config(family, model_def, defaults)
    default_hw_config = hw_configs.get("default", {})

    # Default quantization for explicit models
    quant = model_def.get("quantization", "fp8")

    # Build hardware configurations
    hardware = {}
    for hw_name in hardware_list:
        # Start with default config, then merge hardware-specific overrides
        hw_config = {**default_hw_config, **hw_configs.get(hw_name, {})}
        hardware[hw_name] = build_hardware_config(hw_name, hw_config, defaults, quant)

    return {
        "name": model_name,
        "model_path": model_path,
        "attributes": build_model_attributes(family, model_def),
        "hardware": hardware,
    }


def build_family(company: str, family: dict, defaults: dict) -> dict:
    """Build a full family configuration."""
    models = []

    for model_def in family.get("models", []):
        # Determine if this is variant generation or explicit model
        if isinstance(model_def, dict) and "base_name" in model_def:
            # Variant generation mode
            variants = generate_model_variants(company, family, model_def, defaults)
            models.extend(variants)
        else:
            # Explicit model mode
            models.append(build_explicit_model(company, family, model_def, defaults))

    return {
        "name": family["name"],
        "description": family.get("description"),
        "models": models,
    }


# =============================================================================
# Main Compilation Functions
# =============================================================================


def compile_config(source: dict, vendors: dict) -> dict:
    """Compile a simplified config into full schema format."""
    # Support both 'vendor' (new) and 'company' (legacy) keys
    vendor_id = source.get("vendor") or source.get("company")
    if not vendor_id:
        raise ValueError("Model config must specify 'vendor' or 'company'")

    # Look up vendor to get huggingface_org (used for model paths)
    if vendor_id in vendors:
        company = vendors[vendor_id]["huggingface_org"]
    else:
        # Fallback: use vendor_id directly as company (for backwards compatibility)
        print(f"  Warning: Vendor '{vendor_id}' not found in vendors.yaml, using as literal")
        company = vendor_id

    defaults = source.get("defaults", {})

    families = []
    for family in source.get("families", []):
        families.append(build_family(company, family, defaults))

    return {
        "vendor": vendor_id,
        "families": families,
    }


def load_yaml(path: Path) -> dict:
    """Load a YAML file."""
    with open(path) as f:
        return yaml.safe_load(f)


def save_yaml(data: dict, path: Path) -> None:
    """Save data to a YAML file with consistent formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)

    # Custom representer to handle None values as 'null'
    def represent_none(dumper: yaml.Dumper, _: Any) -> yaml.Node:
        return dumper.represent_scalar("tag:yaml.org,2002:null", "null")

    yaml.add_representer(type(None), represent_none)

    with open(path, "w") as f:
        yaml.dump(
            data,
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            width=120,
        )


def load_vendors(models_dir: Path) -> dict:
    """Load vendors from vendors.yaml file."""
    vendors_path = models_dir / "vendors.yaml"
    if not vendors_path.exists():
        return {}

    data = load_yaml(vendors_path)
    vendors = data.get("vendors", {})

    # Validate required fields
    for vendor_id, vendor_info in vendors.items():
        if "huggingface_org" not in vendor_info:
            raise ValueError(
                f"Vendor '{vendor_id}' missing required 'huggingface_org' field"
            )

    return vendors


def compile_file(
    input_path: Path, output_path: Path, vendors: dict, check_only: bool = False
) -> bool:
    """
    Compile a single file.

    Returns True if successful (or if check passes), False otherwise.
    """
    print(f"Compiling {input_path.name}...")

    source = load_yaml(input_path)
    compiled = compile_config(source, vendors)

    if check_only:
        if output_path.exists():
            existing = load_yaml(output_path)
            if existing == compiled:
                print(f"  OK: {output_path.name} is up to date")
                return True
            else:
                print(f"  FAIL: {output_path.name} is out of date")
                return False
        else:
            print(f"  FAIL: {output_path.name} does not exist")
            return False

    save_yaml(compiled, output_path)
    print(f"  Wrote {output_path}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compile simplified model configs to full schema format"
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path(__file__).parent.parent / "models" / "src",
        help="Directory containing simplified YAML files",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).parent.parent / "models" / "generated",
        help="Directory for generated YAML files",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check if generated files are up to date without writing",
    )
    parser.add_argument(
        "files",
        nargs="*",
        help="Specific files to compile (default: all .yaml files in input-dir)",
    )

    args = parser.parse_args()

    # Load vendors from models directory (parent of input-dir)
    models_dir = args.input_dir.parent
    vendors = load_vendors(models_dir)

    # Find input files
    if args.files:
        input_files = [Path(f) for f in args.files]
    else:
        # Search for YAML files in input-dir and all version subdirectories
        input_files = list(args.input_dir.glob("*.yaml"))
        input_files.extend(args.input_dir.glob("*/*.yaml"))

    if not input_files:
        print(f"No YAML files found in {args.input_dir}")
        return 1

    # Compile each file
    all_ok = True
    for input_path in input_files:
        # Preserve version subdirectory structure in output
        relative_path = input_path.relative_to(args.input_dir)
        output_path = args.output_dir / relative_path
        if not compile_file(input_path, output_path, vendors, args.check):
            all_ok = False

    if args.check and not all_ok:
        print("\nSome files are out of date. Run without --check to regenerate.")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
