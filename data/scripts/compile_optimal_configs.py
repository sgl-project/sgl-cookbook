#!/usr/bin/env python3
"""
Optimal Configuration Compiler

Compiles optimal config YAML files to JSON format for React consumption.

Usage:
    python compile_optimal_configs.py [--input-dir DIR] [--output-dir DIR] [--check]
"""

import argparse
import json
import logging
import sys
from pathlib import Path

import yaml

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


def load_yaml(path: Path) -> dict:
    """Load a YAML file."""
    try:
        with open(path) as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        logger.error(f"YAML file not found: {path}")
        raise
    except yaml.YAMLError as e:
        logger.error(f"Failed to parse YAML file {path}: {e}")
        raise


def save_json(data: dict, path: Path) -> None:
    """Save data to a JSON file."""
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
    except OSError as e:
        logger.error(f"Failed to write JSON file {path}: {e}")
        raise


def add_metadata(source: dict, input_path: Path) -> dict:
    """Add model and version fields if not present."""
    result = dict(source)

    if "model" not in result:
        result["model"] = input_path.stem

    if "version" not in result:
        parent_dir = input_path.parent.name
        if parent_dir.startswith("v"):
            result["version"] = parent_dir
        else:
            result["version"] = "v0.5.6"

    return result


def validate_config(config: dict, filename: str) -> list[str]:
    """Basic validation of the config structure."""
    errors = []

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


def compile_file(input_path: Path, output_path: Path, check_only: bool = False) -> bool:
    """Compile a single YAML file to JSON."""
    print(f"Compiling {input_path.name}...")

    source = load_yaml(input_path)
    compiled = add_metadata(source, input_path)

    errors = validate_config(compiled, input_path.name)
    if errors:
        for err in errors:
            print(f"  ERROR: {err}")
        return False

    if check_only:
        if output_path.exists():
            with open(output_path) as f:
                existing = json.load(f)
            if existing == compiled:
                print(f"  OK: {output_path.name} is up to date")
                return True
            else:
                print(f"  FAIL: {output_path.name} is out of date")
                return False
        else:
            print(f"  FAIL: {output_path.name} does not exist")
            return False

    save_json(compiled, output_path)
    print(f"  Wrote {output_path}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compile optimal config YAML to JSON format"
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path(__file__).parent.parent / "optimal-configs" / "src",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).parent.parent / "optimal-configs" / "generated",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check if generated files are up to date without writing",
    )
    parser.add_argument("files", nargs="*")

    args = parser.parse_args()

    if args.files:
        input_files = [Path(f) for f in args.files]
    else:
        input_files = list(args.input_dir.glob("*.yaml"))
        input_files.extend(args.input_dir.glob("*/*.yaml"))

    if not input_files:
        print(f"No YAML files found in {args.input_dir}")
        return 1

    all_ok = True
    for input_path in input_files:
        relative_path = input_path.relative_to(args.input_dir)
        output_path = args.output_dir / relative_path.with_suffix(".json")
        if not compile_file(input_path, output_path, args.check):
            all_ok = False

    if args.check and not all_ok:
        print("\nSome files are out of date. Run without --check to regenerate.")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
