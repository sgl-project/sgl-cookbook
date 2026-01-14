#!/usr/bin/env python3
"""
Optimal Configuration Compiler

Compiles optimal config YAML files to JSON format for React consumption.

Usage:
    python compile_optimal_configs.py [--input-dir DIR] [--output-dir DIR] [--check]

The compiler reads YAML files from the input directory and generates
JSON files in the output directory for use by React components.
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any

import yaml

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def load_yaml(path: Path) -> dict:
    """Load a YAML file."""
    try:
        with open(path) as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Failed to load YAML file {path}: {e}")
        raise


def save_json(data: dict, path: Path) -> None:
    """Save data to a JSON file with consistent formatting."""
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")  # Add trailing newline
    except Exception as e:
        logger.error(f"Failed to write JSON file {path}: {e}")
        raise


def add_metadata(source: dict, input_path: Path) -> dict:
    """
    Add or verify required metadata fields.

    Ensures the config has model and version fields, inferring from
    the file path if not present.
    """
    result = dict(source)

    # Infer model name from filename if not present
    if "model" not in result:
        result["model"] = input_path.stem

    # Infer version from directory structure if not present
    # Expected path: .../src/v0.5.6/deepseek-r1.yaml
    if "version" not in result:
        parent_dir = input_path.parent.name
        if parent_dir.startswith("v"):
            result["version"] = parent_dir
        else:
            result["version"] = "v0.5.6"  # Default version

    return result


def validate_config(config: dict, filename: str) -> list[str]:
    """
    Basic validation of the config structure.

    Returns a list of error messages (empty if valid).
    """
    errors = []

    # Check required top-level fields
    if "ui_options" not in config:
        errors.append(f"{filename}: 'ui_options' is required")
    else:
        ui_opts = config["ui_options"]
        for key in ["hardware", "quantization", "scenario", "gpu_count"]:
            if key not in ui_opts:
                errors.append(f"{filename}: 'ui_options.{key}' is required")
            elif not isinstance(ui_opts[key], list):
                errors.append(f"{filename}: 'ui_options.{key}' must be an array")

    if "configs" not in config:
        errors.append(f"{filename}: 'configs' is required")
    elif not isinstance(config["configs"], list):
        errors.append(f"{filename}: 'configs' must be an array")
    else:
        for i, cfg in enumerate(config["configs"]):
            prefix = f"{filename} configs[{i}]"
            if not cfg.get("hardware"):
                errors.append(f"{prefix}: 'hardware' is required")
            if not cfg.get("quantization"):
                errors.append(f"{prefix}: 'quantization' is required")
            if "gpu_count" not in cfg:
                errors.append(f"{prefix}: 'gpu_count' is required")
            if not cfg.get("scenario"):
                errors.append(f"{prefix}: 'scenario' is required")
            if not cfg.get("parameters"):
                errors.append(f"{prefix}: 'parameters' is required")
            elif not cfg["parameters"].get("model_path"):
                errors.append(f"{prefix}: 'parameters.model_path' is required")

    return errors


def compile_file(
    input_path: Path, output_path: Path, check_only: bool = False
) -> bool:
    """
    Compile a single YAML file to JSON.

    Returns True if successful (or if check passes), False otherwise.
    """
    logger.info(f"Compiling {input_path.name}...")

    try:
        source = load_yaml(input_path)
    except Exception:
        return False

    # Add metadata (model, version)
    compiled = add_metadata(source, input_path)

    # Validate
    errors = validate_config(compiled, input_path.name)
    if errors:
        for err in errors:
            logger.error(f"  ERROR: {err}")
        return False

    if check_only:
        if output_path.exists():
            try:
                with open(output_path) as f:
                    existing = json.load(f)
                if existing == compiled:
                    logger.info(f"  OK: {output_path.name} is up to date")
                    return True
                else:
                    logger.info(f"  FAIL: {output_path.name} is out of date")
                    return False
            except Exception as e:
                logger.error(f"  FAIL: Could not read {output_path.name}: {e}")
                return False
        else:
            logger.info(f"  FAIL: {output_path.name} does not exist")
            return False

    try:
        save_json(compiled, output_path)
        logger.info(f"  Wrote {output_path}")
        return True
    except Exception:
        return False


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compile optimal config YAML to JSON format"
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path(__file__).parent.parent / "optimal-configs" / "src",
        help="Directory containing source YAML files",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).parent.parent / "optimal-configs" / "generated",
        help="Directory for generated JSON files",
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
        # Search for YAML files in input-dir and all version subdirectories
        input_files = list(args.input_dir.glob("*.yaml"))
        input_files.extend(args.input_dir.glob("*/*.yaml"))

    if not input_files:
        logger.info(f"No YAML files found in {args.input_dir}")
        return 1

    # Compile each file
    all_ok = True
    for input_path in input_files:
        # Preserve version subdirectory structure in output
        relative_path = input_path.relative_to(args.input_dir)
        output_path = args.output_dir / relative_path.with_suffix(".json")
        if not compile_file(input_path, output_path, args.check):
            all_ok = False

    if args.check and not all_ok:
        logger.info("\nSome files are out of date. Run without --check to regenerate.")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
