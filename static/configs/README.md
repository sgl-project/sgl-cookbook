# DeepSeek-R1 Configuration Files

This directory contains optimal configuration files for DeepSeek-R1 deployment.

## File Organization

### Lookup Files
- **`lookup.yaml`** - Source of truth (human-editable)
- **`lookup.json`** - Auto-generated from lookup.yaml (DO NOT EDIT)

To regenerate JSON after editing YAML:
```bash
npx js-yaml static/configs/lookup.yaml > static/configs/lookup.json
```

### Config YAML Files
Pre-tested optimal configurations for different hardware/quantization/scenario combinations:

- `deepseek-r1/v0.5.6/b200/fp4/` - B200 FP4 configs (4 and 8 GPU variants)
- `deepseek-r1/v0.5.6/b200/fp8/` - B200 FP8 configs
- `deepseek-r1/v0.5.6/h200/fp8/` - H200 FP8 configs

## Usage

The UI components import `lookup.json` for configuration data. Edit `lookup.yaml` to modify:
- UI options (hardware, quantization, scenario labels)
- Configuration parameters
- Validation rules
