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

CAPABILITY_SUFFIXES = {
    "base": "",
    "instruct": "-Instruct-2507",
    "thinking": "-Thinking-2507",
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


def build_version_config(
    defaults: dict,
    hw_config: dict,
    quant: str,
    quant_overrides: dict | None = None,
) -> dict:
    """Build version configuration with all named configurations."""
    configurations = []
    for config_template in defaults.get("configurations", []):
        configurations.append(
            build_named_configuration(config_template, hw_config, quant, quant_overrides)
        )
    return {"configurations": configurations}


def build_hardware_config(
    hw_name: str,
    hw_config: dict,
    defaults: dict,
    quant: str,
    quant_overrides: dict | None = None,
) -> dict:
    """Build hardware configuration with all versions."""
    versions = {}
    for version in defaults.get("versions", ["v0.5.6"]):
        versions[version] = build_version_config(
            defaults, hw_config, quant, quant_overrides
        )
    return {"versions": versions}


# =============================================================================
# Model Builders
# =============================================================================


def build_model_attributes(
    family: dict,
    model_def: dict,
    capability: str | None = None,
) -> dict:
    """Build model attributes from family defaults and model overrides."""
    # Determine thinking_capability based on:
    # 1. Model-level override
    # 2. Family-level default
    # 3. Infer from capability variant
    thinking_cap = model_def.get(
        "thinking_capability", family.get("thinking_capability")
    )

    # If not explicitly set, infer from capability
    if thinking_cap is None and capability:
        if capability == "thinking":
            thinking_cap = "thinking"
        else:
            thinking_cap = "non_thinking"

    # Get parsers from model or family
    tool_parser = model_def.get("tool_parser", family.get("tool_parser"))
    reasoning_parser = model_def.get("reasoning_parser", family.get("reasoning_parser"))

    # For instruct variants, typically no reasoning parser
    if capability == "instruct":
        reasoning_parser = None
    # For base variants without thinking capability, no reasoning parser
    elif capability == "base" and thinking_cap != "hybrid":
        reasoning_parser = None

    return {
        "thinking_capability": thinking_cap,
        "tool_parser": tool_parser,
        "reasoning_parser": reasoning_parser,
        "chat_template": model_def.get("chat_template", family.get("chat_template")),
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

    # Get hardware config
    hw_configs = model_def.get("hardware", {})
    hardware_list = list(hw_configs.keys()) if hw_configs else defaults.get(
        "hardware", ["H200", "B200"]
    )

    models = []

    # Get custom capability suffixes if defined at family or model level
    cap_suffixes = model_def.get("capability_suffix", family.get("capability_suffix", CAPABILITY_SUFFIXES))

    for capability in capabilities:
        for quant in quantizations:
            # Build model name
            cap_suffix = cap_suffixes.get(capability, CAPABILITY_SUFFIXES.get(capability, ""))
            quant_suffix = quant_suffixes.get(quant, DEFAULT_QUANT_SUFFIXES.get(quant, ""))
            model_name = f"{family_name}-{base_name}{cap_suffix}{quant_suffix}"

            # Determine model path
            if quantized_paths and quant in quantized_paths:
                model_path = quantized_paths[quant]
            else:
                # Default: company/model_name
                model_path = f"{company}/{model_name}"

            # Get quantization-specific overrides (e.g., fp8: { ep: 2 })
            quant_overrides = model_def.get(quant, {})

            # Build hardware configurations
            hardware = {}
            for hw_name in hardware_list:
                hw_config = hw_configs.get(hw_name, {})

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

    # Get hardware config
    hw_configs = model_def.get("hardware", {})
    hardware_list = list(hw_configs.keys()) if hw_configs else defaults.get(
        "hardware", ["H200", "B200"]
    )

    # Default quantization for explicit models
    quant = model_def.get("quantization", "fp8")

    # Build hardware configurations
    hardware = {}
    for hw_name in hardware_list:
        hw_config = hw_configs.get(hw_name, {})
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


def compile_config(source: dict) -> dict:
    """Compile a simplified config into full schema format."""
    company = source["company"]
    defaults = source.get("defaults", {})

    families = []
    for family in source.get("families", []):
        families.append(build_family(company, family, defaults))

    return {
        "company": company,
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


def compile_file(input_path: Path, output_path: Path, check_only: bool = False) -> bool:
    """
    Compile a single file.

    Returns True if successful (or if check passes), False otherwise.
    """
    print(f"Compiling {input_path.name}...")

    source = load_yaml(input_path)
    compiled = compile_config(source)

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

    # Find input files
    if args.files:
        input_files = [Path(f) for f in args.files]
    else:
        input_files = list(args.input_dir.glob("*.yaml"))

    if not input_files:
        print(f"No YAML files found in {args.input_dir}")
        return 1

    # Compile each file
    all_ok = True
    for input_path in input_files:
        output_path = args.output_dir / input_path.name
        if not compile_file(input_path, output_path, args.check):
            all_ok = False

    if args.check and not all_ok:
        print("\nSome files are out of date. Run without --check to regenerate.")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
