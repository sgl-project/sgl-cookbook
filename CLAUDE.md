# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SGLang Cookbook is a Docusaurus-based documentation site providing deployment guides and recipes for SGLang (a fast LLM serving framework) across various models and hardware platforms. The site is deployed at https://cookbook.sglang.io.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm start

# Build production site
npm run build

# Serve built site locally
npm run serve

# Clear Docusaurus cache
npm run clear
```

### Configuration Compilation

Model configurations use a two-directory pattern: human-editable YAML in `data/models/src/` is compiled to schema-compliant YAML in `data/models/generated/`.

```bash
# Compile model configurations (requires venv)
source .venv/bin/activate && python data/scripts/compile_models.py

# Compile optimal configurations
source .venv/bin/activate && python data/scripts/compile_optimal_configs.py

# Check if generated files are up-to-date (CI mode)
source .venv/bin/activate && python data/scripts/compile_models.py --check
```

### Schema Validation

```bash
cd data/schema
npm install
npm test           # Validate model configs
npm run test:optimal  # Validate optimal configs
```

Pre-commit hooks automatically compile configs when `data/models/src/*.yaml` or `data/optimal-configs/src/*.yaml` files change.

## Architecture

### Directory Structure

```
docs/                   # Markdown documentation files
├── autoregressive/     # LLM deployment guides by vendor
├── diffusion/          # Diffusion model guides
├── base/               # Benchmarks and reference docs
└── specbundle/         # SpecBundle documentation

src/components/         # React components
├── autoregressive/     # Model-specific config generators
├── base/ConfigGenerator/  # Reusable config generator component
└── diffusion/          # Diffusion-specific components

data/
├── models/
│   ├── src/<version>/  # Source YAML (edit these), versioned by SGLang version (e.g., v0.5.6, v0.5.8)
│   └── generated/<version>/  # Generated YAML (auto-created)
├── optimal-configs/    # Optimal deployment configurations
└── schema/             # TypeScript schema definitions
```

### Key Patterns

1. **Configuration as Code**: Edit simplified YAML in `src/`, compiler generates full schema-compliant YAML in `generated/`. Both directories are committed.

2. **Interactive Config Generators**: React components in `src/components/autoregressive/<ModelNameConfigGenerator>/index.js` (flat structure, NOT nested in vendor folders) generate SGLang CLI commands based on user selections. They use the base `ConfigGenerator` component with a config object defining options and a `generateCommand` function.

3. **Webpack Aliases**: Configured in `docusaurus.config.js`:
   - `@diffusion` → `docs/diffusion`
   - `@specbundle` → `docs/specbundle`
   - `@optimal-configs` → `data/optimal-configs/generated`

4. **Docs at Root**: Documentation is served at `/` (not `/docs/`), configured via `routeBasePath: '/'`.

### Adding a New Model

Use the `/add-model` skill to add a new model. It will collect the required inputs and walk through all implementation steps. See `.claude/skills/add-model/SKILL.md` for the full workflow.

## Configuration Reference

Model YAML configs support:
- **Defaults**: Company-wide deployment presets (tp, dp, ep, enable_dp_attention)
- **Variant Generation**: Auto-generate models from base_name + quantizations + capabilities
- **Hardware Overrides**: Per-hardware tp/dp/ep values
- **Quantization Overrides**: FP8/BF16-specific settings

See `data/models/README.md` for detailed configuration documentation.
