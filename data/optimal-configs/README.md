# Optimal Configurations

This directory contains pre-tuned, benchmarked deployment configurations for SGLang models.

## Directory Structure

```
optimal-configs/
├── src/                      # Human-editable source YAML files
│   └── v0.5.6/
│       └── deepseek-r1.yaml  # DeepSeek-R1 optimal configurations
├── generated/                # Auto-generated JSON files (DO NOT EDIT)
│   └── v0.5.6/
│       └── deepseek-r1.json  # Compiled JSON for React components
└── README.md
```

## Workflow

1. **Edit source files** in `src/v0.5.6/`
2. **Run compiler** to generate JSON:
   ```bash
   python data/scripts/compile_optimal_configs.py
   ```
3. **Pre-commit hooks** automatically compile on commit

## Adding a New Model

1. Create a new YAML file in `src/v0.5.6/{model-name}.yaml`
2. Follow the schema defined in `data/schema/optimal-config-types.ts`
3. Run the compiler to generate JSON
4. Update the React component to import the new config

## Schema

See `data/schema/optimal-config-types.ts` for the TypeScript schema definition.

Key structures:
- `OptimalConfigFile`: Root configuration with ui_options, configs, and validation
- `UIOptions`: Dropdown/radio options for the config generator UI
- `OptimalConfig`: A single hardware/quant/gpu/scenario configuration
- `ServerParameters`: SGLang server parameters

## Validation

Run TypeScript validation:
```bash
cd data/schema && npm run test:optimal
```

## Pre-commit Hooks

Two hooks are configured:
1. `compile-optimal-configs`: Compiles YAML → JSON on source changes
2. `validate-optimal-configs-ts`: Validates generated JSON against schema
