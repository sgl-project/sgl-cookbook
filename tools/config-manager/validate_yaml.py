#!/usr/bin/env python3
"""
Validate model configuration YAML files.

This script is used by pre-commit hooks and CI to ensure all model
configuration files conform to the expected schema.

Usage:
    python validate_yaml.py [file1.yaml] [file2.yaml] ...

If no files are provided, validates all YAML files in data/models/.
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml
from pydantic import ValidationError

# Add the config-manager directory to the path for imports
script_dir = Path(__file__).parent
if str(script_dir) not in sys.path:
    sys.path.insert(0, str(script_dir))

from models import CompanyConfig  # noqa: E402


def validate_file(file_path: Path) -> list[str]:
    """
    Validate a single YAML file.

    Returns a list of error messages (empty if valid).
    """
    errors = []

    if not file_path.exists():
        return [f"File not found: {file_path}"]

    try:
        with open(file_path, encoding='utf-8') as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as e:
        return [f"YAML syntax error: {e}"]

    if data is None:
        return [f"Empty YAML file: {file_path}"]

    try:
        config = CompanyConfig(**data)
        # Additional semantic validation
        for family in config.families:
            for model in family.models:
                for hw_name, hw_config in model.hardware.items():
                    for ver_name, ver_config in hw_config.versions.items():
                        if not ver_config.configurations:
                            errors.append(
                                f"No configurations defined for "
                                f"{model.name}/{hw_name}/{ver_name}"
                            )
    except ValidationError as e:
        for err in e.errors():
            loc = " -> ".join(str(x) for x in err["loc"])
            errors.append(f"{loc}: {err['msg']}")

    return errors


def get_models_dir() -> Path:
    """Get the models directory path."""
    return script_dir.parent.parent / "data" / "models"


def main():
    """Main entry point."""
    # Determine which files to validate
    if len(sys.argv) > 1:
        # Files provided as arguments (from pre-commit)
        files = [Path(f) for f in sys.argv[1:]]
    else:
        # No arguments - validate all files in models directory
        models_dir = get_models_dir()
        if not models_dir.exists():
            print(f"Models directory not found: {models_dir}")
            sys.exit(1)
        files = list(models_dir.glob("*.yaml")) + list(models_dir.glob("*.yml"))

    if not files:
        print("No YAML files to validate")
        sys.exit(0)

    all_errors = {}
    for file_path in files:
        print(f"Validating {file_path.name}...", end=" ")
        errors = validate_file(file_path)
        if errors:
            all_errors[file_path] = errors
            print("FAILED")
            for error in errors:
                print(f"  - {error}")
        else:
            print("OK")

    if all_errors:
        print(f"\n{len(all_errors)} file(s) failed validation")
        sys.exit(1)
    else:
        print(f"\nAll {len(files)} file(s) validated successfully")
        sys.exit(0)


if __name__ == "__main__":
    main()
