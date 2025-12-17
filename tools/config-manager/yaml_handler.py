"""
YAML file handling utilities for model configuration.
"""

from pathlib import Path
from typing import Optional

import yaml
from pydantic import ValidationError

from models import CompanyConfig


# Custom YAML representer to handle None values as null
def represent_none(dumper, _):
    return dumper.represent_scalar('tag:yaml.org,2002:null', 'null')


yaml.add_representer(type(None), represent_none)


def get_data_dir() -> Path:
    """Get the data directory path"""
    # Navigate from tools/config-manager to data/
    return Path(__file__).parent.parent.parent / "data"


def get_models_dir() -> Path:
    """Get the models directory path"""
    return get_data_dir() / "models"


def list_company_files() -> list[Path]:
    """List all company YAML files"""
    models_dir = get_models_dir()
    if not models_dir.exists():
        return []
    return list(models_dir.glob("*.yaml")) + list(models_dir.glob("*.yml"))


def load_company_config(company_file: Path) -> CompanyConfig:
    """Load a company configuration from YAML file"""
    with open(company_file, encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return CompanyConfig(**data)


def load_company_config_raw(company_file: Path) -> dict:
    """Load a company configuration as raw dict (for diff comparison)"""
    with open(company_file, encoding='utf-8') as f:
        return yaml.safe_load(f) or {}


def save_company_config(config: CompanyConfig, company_file: Path) -> None:
    """Save a company configuration to YAML file"""
    # Ensure the models directory exists
    company_file.parent.mkdir(parents=True, exist_ok=True)

    # Convert to dict, handling Pydantic models
    data = config.model_dump(exclude_none=False)

    # Custom dumper settings for readable YAML
    with open(company_file, 'w', encoding='utf-8') as f:
        yaml.dump(
            data,
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            width=120
        )


def get_company_file_path(company_name: str) -> Path:
    """Get the file path for a company config.

    Sanitizes the company name and ensures the resulting path is within
    the expected models directory (prevents path traversal attacks).
    """
    # Sanitize company name: remove dangerous chars, replace spaces/slashes
    # Only allow alphanumeric, dash, underscore
    safe_name = "".join(
        c if c.isalnum() or c in "-_" else "-"
        for c in company_name.lower()
    ).strip("-_")

    # Ensure we have a valid name after sanitization
    if not safe_name:
        safe_name = "unnamed"

    models_dir = get_models_dir()
    result_path = (models_dir / f"{safe_name}.yaml").resolve()

    # Security check: ensure resulting path is within models directory
    try:
        result_path.relative_to(models_dir.resolve())
    except ValueError:
        # Path would escape the models directory - use safe fallback
        result_path = models_dir / "unnamed.yaml"

    return result_path


def validate_config(config: CompanyConfig) -> list[str]:
    """Validate a company configuration using Pydantic"""
    errors = []
    try:
        # Re-validate by creating a new instance from dict
        data = config.model_dump(exclude_none=False)
        CompanyConfig(**data)
    except ValidationError as e:
        for err in e.errors():
            loc = " -> ".join(str(x) for x in err["loc"])
            errors.append(f"{loc}: {err['msg']}")
    except Exception as e:
        errors.append(f"Validation error: {e}")
    return errors


def _dicts_equal(d1: dict, d2: dict) -> bool:
    """Compare two dicts for equality, handling nested structures."""
    if set(d1.keys()) != set(d2.keys()):
        return False
    for key in d1:
        v1, v2 = d1[key], d2[key]
        if type(v1) != type(v2):
            return False
        if isinstance(v1, dict):
            if not _dicts_equal(v1, v2):
                return False
        elif isinstance(v1, list):
            if len(v1) != len(v2):
                return False
            for i1, i2 in zip(v1, v2):
                if isinstance(i1, dict):
                    if not _dicts_equal(i1, i2):
                        return False
                elif i1 != i2:
                    return False
        elif v1 != v2:
            return False
    return True


def generate_change_summary(
    original: Optional[dict],
    current: CompanyConfig,
    file_path: Path
) -> dict:
    """
    Generate a summary of changes between original and current config.

    Returns:
        dict with keys: 'file', 'added', 'modified', 'removed', 'has_changes'
    """
    summary = {
        'file': str(file_path),
        'added': [],
        'modified': [],
        'removed': [],
        'has_changes': False
    }

    # New file case
    if original is None:
        summary['added'].append(f"Company: {current.company}")
        for family in current.families:
            summary['added'].append(f"  Family: {family.name}")
            for model in family.models:
                summary['added'].append(f"    Model: {model.name}")
                for hw_name, hw_config in model.hardware.items():
                    for ver_name, ver_config in hw_config.versions.items():
                        cfg_count = len(ver_config.configurations)
                        summary['added'].append(f"      {hw_name}/{ver_name}: {cfg_count} configuration(s)")
        summary['has_changes'] = True
        return summary

    # Compare families
    orig_families = {f['name']: f for f in original.get('families', [])}
    curr_families = {f.name: f for f in current.families}

    # Check for added/modified families
    for name, family in curr_families.items():
        if name not in orig_families:
            summary['added'].append(f"Family: {name}")
            for model in family.models:
                summary['added'].append(f"  Model: {model.name}")
        else:
            orig_family = orig_families[name]

            # Check family-level field changes (description)
            if family.description != orig_family.get('description'):
                summary['modified'].append(f"Family '{name}': description changed")

            # Compare models within family
            orig_models = {m['name']: m for m in orig_family.get('models', [])}
            curr_models = {m.name: m for m in family.models}

            for model_name, model in curr_models.items():
                if model_name not in orig_models:
                    summary['added'].append(f"Model: {model_name} in {name}")
                else:
                    orig_model = orig_models[model_name]

                    # Check model-level field changes
                    if model.model_path != orig_model.get('model_path'):
                        summary['modified'].append(f"Model '{model_name}': model_path changed")

                    # Check attributes changes
                    orig_attrs = orig_model.get('attributes', {})
                    curr_attrs = model.attributes.model_dump()
                    if not _dicts_equal(curr_attrs, orig_attrs):
                        summary['modified'].append(f"Model '{model_name}': attributes changed")

                    # Check hardware changes
                    orig_hw = orig_model.get('hardware', {})
                    curr_hw = model.hardware

                    for hw_name, hw_config in curr_hw.items():
                        if hw_name not in orig_hw:
                            summary['added'].append(f"Hardware: {hw_name} for {model_name}")
                        else:
                            # Check versions
                            orig_versions = orig_hw[hw_name].get('versions', {})
                            for ver_name, ver_config in hw_config.versions.items():
                                if ver_name not in orig_versions:
                                    summary['added'].append(f"Version: {ver_name} for {model_name}/{hw_name}")
                                else:
                                    # Compare configurations
                                    orig_configs = orig_versions[ver_name].get('configurations', [])
                                    curr_configs = [c.model_dump() for c in ver_config.configurations]

                                    orig_cfg_names = {c['name'] for c in orig_configs}
                                    curr_cfg_names = {c['name'] for c in curr_configs}

                                    # Added configurations
                                    for cfg_name in curr_cfg_names - orig_cfg_names:
                                        summary['added'].append(
                                            f"Config: {cfg_name} in {model_name}/{hw_name}/{ver_name}"
                                        )

                                    # Removed configurations
                                    for cfg_name in orig_cfg_names - curr_cfg_names:
                                        summary['removed'].append(
                                            f"Config: {cfg_name} from {model_name}/{hw_name}/{ver_name}"
                                        )

                                    # Modified configurations
                                    for curr_cfg in curr_configs:
                                        cfg_name = curr_cfg['name']
                                        orig_cfg = next((c for c in orig_configs if c['name'] == cfg_name), None)
                                        if orig_cfg and not _dicts_equal(curr_cfg, orig_cfg):
                                            summary['modified'].append(
                                                f"Config: {cfg_name} in {model_name}/{hw_name}/{ver_name}"
                                            )

                            # Check for removed versions
                            for ver_name in orig_versions:
                                if ver_name not in hw_config.versions:
                                    summary['removed'].append(f"Version: {ver_name} from {model_name}/{hw_name}")

                    # Check for removed hardware
                    for hw_name in orig_hw:
                        if hw_name not in curr_hw:
                            summary['removed'].append(f"Hardware: {hw_name} from {model_name}")

            # Check for removed models
            for model_name in orig_models:
                if model_name not in curr_models:
                    summary['removed'].append(f"Model: {model_name} from {name}")

    # Check for removed families
    for name in orig_families:
        if name not in curr_families:
            summary['removed'].append(f"Family: {name}")

    summary['has_changes'] = bool(summary['added'] or summary['modified'] or summary['removed'])
    return summary
