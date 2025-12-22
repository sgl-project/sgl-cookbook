# Model Configurations

This directory contains model configuration files for SGLang deployments.

## Directory Structure

```
data/models/
├── README.md           # This file
├── src/                # Source files (human-editable, simplified format)
│   ├── deepseek.yaml
│   ├── qwen.yaml
│   └── ...
└── generated/          # Generated files (auto-generated, full schema format)
    ├── deepseek.yaml
    ├── qwen.yaml
    └── ...
```

## Source vs Generated

| Directory | Purpose | Format | Edit? |
|-----------|---------|--------|-------|
| `src/` | Human-authored source files | Simplified YAML with defaults and variant generation | **Yes** |
| `generated/` | Machine-generated output | Full schema-compliant YAML | **No** (auto-generated) |

### Why Two Directories?

**Source files (`src/`)** use a simplified format that:
- Reduces repetition through defaults and inheritance
- Supports variant generation (e.g., generate FP8/BF16 variants automatically)
- Is easier to read, write, and maintain

**Generated files (`generated/`)** are:
- Full schema-compliant YAML validated against TypeScript types
- Used by downstream tools and applications
- Automatically created by the compiler—never edit these directly

### Workflow

1. Edit files in `src/`
2. Run the compiler: `python data/scripts/compile_models.py`
3. Generated files appear in `generated/`
4. Commit both `src/` and `generated/` files

The pre-commit hook automatically runs the compiler when you modify `src/*.yaml` files.

---

# Writing Source Configuration Files

## Quick Start

1. Create a new YAML file in `src/` (e.g., `src/mymodel.yaml`)
2. Run the compiler: `python data/scripts/compile_models.py`
3. Verify the generated output in `generated/mymodel.yaml`

## File Structure

```yaml
# Required: Company/organization identifier
company: company-name

# Optional: Default settings applied to all models from this company
defaults:
  hardware: [H100, H200, B200]    # Supported hardware types
  versions: [v0.5.6]              # SGLang versions
  configurations:                  # Deployment presets (see below)
    - name: default
      nodes: single
      optimization: balanced
    - name: high-throughput-dp
      nodes: single
      optimization: high-throughput
      dp: 8
      enable_dp_attention: true

# Required: List of model families
families:
  - name: FamilyName
    description: Optional description
    # ... family config
```

## Understanding Deployment Configurations

The `defaults.configurations` section defines **deployment presets** that are available for **every model from this company**. These are not model-specific settings—they represent different ways users can deploy any model.

### What are Deployment Configurations?

Each configuration is a named preset with specific parallelism and optimization settings:

```yaml
defaults:
  configurations:
    # Preset 1: Balanced for general use
    - name: default
      nodes: single
      optimization: balanced
      tp: 8

    # Preset 2: Optimized for maximum throughput
    - name: high-throughput-dp
      nodes: single
      optimization: high-throughput
      tp: 8
      dp: 8
      enable_dp_attention: true

    # Preset 3: Optimized for low latency
    - name: low-latency
      nodes: single
      optimization: low-latency
      tp: 8
```

### How Configurations Apply to Models

When the compiler generates output, **every model gets all configurations**. For example, with the above defaults, `DeepSeek-V3.2` will have three deployment options:

```yaml
# Generated output (data/models/generated/deepseek.yaml)
models:
  - name: DeepSeek-V3.2
    hardware:
      H200:
        versions:
          v0.5.6:
            configurations:
              - name: default
                attributes:
                  optimization: balanced
                engine:
                  tp: 8
                  dp: null

              - name: high-throughput-dp
                attributes:
                  optimization: high-throughput
                engine:
                  tp: 8
                  dp: 8
                  enable_dp_attention: true

              - name: low-latency
                attributes:
                  optimization: low-latency
                engine:
                  tp: 8
                  dp: null
```

This allows users to choose which deployment preset they want when launching any model from this company.

### Company-Level vs Model-Level Settings

| Setting Type | Defined In | Applies To | Example |
|-------------|-----------|-----------|---------|
| Deployment configurations | `defaults.configurations` | All models from this company | `default`, `high-throughput-dp` |
| Model attributes | `families[].models[]` | Specific model only | `tp`, `ep` overrides |

**Key insight**: Deployment configurations are company-wide presets. Model-specific settings (like different `tp` values for smaller models) are defined at the model or hardware level and **override** the defaults.

## Two Patterns for Defining Models

### Pattern 1: Variant Generation (Recommended for model series)

Use this when you have multiple variants of a base model (different quantizations, capabilities).

```yaml
models:
  - base_name: 235B-A22B                    # Base name (appended to family name)
    quantizations: [bf16, fp8]              # Generate variants for each quantization
    capabilities: [base, instruct, thinking] # Generate variants for each capability
    hardware:
      H100: { tp: 8 }
      H200: { tp: 8 }
      B200: { tp: 8 }
    fp8:                                    # Quantization-specific overrides
      ep: 2
```

This generates models like:
- `FamilyName-235B-A22B` (bf16)
- `FamilyName-235B-A22B-FP8` (fp8)
- `FamilyName-235B-A22B-Instruct-2507` (bf16)
- `FamilyName-235B-A22B-Instruct-2507-FP8` (fp8)
- `FamilyName-235B-A22B-Thinking-2507` (bf16)
- `FamilyName-235B-A22B-Thinking-2507-FP8` (fp8)

### Pattern 2: Explicit Models (For unique model names)

Use this when model names don't follow a pattern or need exact control.

```yaml
models:
  # Simplest form - just the model name
  - ModelName

  # With additional configuration
  - name: ModelName-Custom
    thinking_capability: hybrid
    tool_parser: custom_parser
    hardware:
      H200: { tp: 8, ep: 4 }
      B200: { tp: 8, ep: 4 }
```

## Configuration Override Hierarchy

The compiler uses a **layered override system** where more specific configurations override more general ones:

```
defaults.configurations (company-wide deployment presets)
  └── model-level hardware config
        └── quantization-specific overrides
```

### Override Priority (Low to High)

1. **Defaults** (`defaults.configurations`) - Company-wide deployment presets
2. **Hardware-level** - Override for specific hardware (H100, H200, B200)
3. **Quantization-level** - Override for specific quantization (fp8, bf16, etc.)

### Example: Layered Overrides

```yaml
company: example-ai

defaults:
  hardware: [H100, H200, B200]
  versions: [v0.5.6]
  configurations:
    # These presets apply to ALL models from example-ai
    - name: default
      nodes: single
      optimization: balanced
      tp: 8                           # Default tp=8 for all models
    - name: high-throughput-dp
      nodes: single
      optimization: high-throughput
      tp: 8
      dp: 8                           # Default dp=8 for high-throughput
      enable_dp_attention: true

families:
  - name: MyFamily
    tool_parser: myfamily             # Family-level parser (inherited by all models)
    reasoning_parser: myfamily

    models:
      # Model 1: Uses all defaults (tp=8 from configurations)
      - name: MyFamily-Base

      # Model 2: Hardware override (smaller model needs less parallelism)
      - name: MyFamily-Small
        tool_parser: null             # Override: disable tool parsing for this model
        hardware:
          H100: { tp: 1 }             # Override: tp=1 on H100 (instead of tp=8)
          H200: { tp: 2 }             # Override: tp=2 on H200
          B200: { tp: 2 }

      # Model 3: Quantization-specific override
      - base_name: Large
        quantizations: [bf16, fp8]
        capabilities: [base]
        hardware:
          H100: { tp: 8 }
          H200: { tp: 8 }
          B200: { tp: 8 }
        fp8:                          # Only applies to FP8 variants
          ep: 2                       # Add expert parallelism for FP8
          extra_args: ["--enable-mixed-precision"]

      # Model 4: Hardware + quantization override
      - base_name: MoE
        quantizations: [bf16, fp8]
        capabilities: [base]
        hardware:
          H100:
            tp: 4
            valid_quants: [fp8]       # H100 only supports FP8
          H200:
            tp: 8
            dp: 4                     # H200 uses dp=4 (overrides default dp=8)
          B200:
            tp: 8
        fp8:
          ep: 4
```

### What Gets Overridden

| Field | Defaults | Family | Model | Hardware | Quant |
|-------|:--------:|:------:|:-----:|:--------:|:-----:|
| `tp` | ✓ | - | - | ✓ | ✓ |
| `dp` | ✓ | - | - | ✓ | ✓ |
| `ep` | ✓ | - | - | ✓ | ✓ |
| `enable_dp_attention` | ✓ | - | - | ✓ | ✓ |
| `env_vars` | ✓ | - | - | ✓ | - |
| `extra_args` | ✓ | - | - | ✓ | ✓ |
| `thinking_capability` | - | ✓ | ✓ | - | - |
| `tool_parser` | - | ✓ | ✓ | - | - |
| `reasoning_parser` | - | ✓ | ✓ | - | - |
| `chat_template` | - | ✓ | ✓ | - | - |

## Configuration Reference

### Defaults Section

| Field | Type | Description |
|-------|------|-------------|
| `hardware` | list | Hardware types: `H100`, `H200`, `B200` |
| `versions` | list | SGLang versions (e.g., `v0.5.6`) |
| `configurations` | list | Company-wide deployment presets |

### Deployment Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | required | Preset name (e.g., `default`, `high-throughput-dp`) |
| `nodes` | string | `single` | `single` or `multi` node deployment |
| `optimization` | string | `balanced` | `balanced`, `low-latency`, or `high-throughput` |
| `tp` | int | 8 | Tensor parallelism degree |
| `dp` | int | null | Data parallelism degree |
| `ep` | int | null | Expert parallelism (for MoE models) |
| `enable_dp_attention` | bool | null | Enable DP attention optimization |
| `env_vars` | dict | {} | Environment variables |
| `extra_args` | list | [] | Additional CLI arguments |

### Family Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Family name (e.g., `DeepSeek-V3.2`) |
| `description` | string | Optional description |
| `thinking_capability` | string | `non_thinking`, `thinking`, or `hybrid` |
| `tool_parser` | string | Tool call parser name |
| `reasoning_parser` | string | Reasoning parser name |
| `chat_template` | string | Custom chat template path |
| `capability_suffix` | dict | Custom suffixes for capabilities |

### Model Fields (Variant Generation)

| Field | Type | Description |
|-------|------|-------------|
| `base_name` | string | Base model name (triggers variant generation) |
| `quantizations` | list | `bf16`, `fp8`, `fp4`, `int4`, `mxfp4` |
| `capabilities` | list | `base`, `instruct`, `thinking` |
| `hardware` | dict | Hardware-specific tp/dp/ep values |
| `quant_suffix` | dict | Custom quantization suffixes |
| `quantized_paths` | dict | Custom HuggingFace paths per quantization |
| `<quant>` | dict | Quantization-specific overrides (e.g., `fp8: { ep: 2 }`) |

### Model Fields (Explicit)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Exact model name |
| `model_path` | string | HuggingFace path (default: `company/name`) |
| `quantization` | string | Quantization type (default: `fp8`) |
| `thinking_capability` | string | Override family default |
| `tool_parser` | string | Override family default |
| `reasoning_parser` | string | Override family default |
| `chat_template` | string | Override family default |
| `hardware` | dict | Hardware-specific configuration |

## Examples

### Example 1: Simple Dense Model (Llama-3.1)

```yaml
company: meta-llama

defaults:
  hardware: [H100, H200, B200]
  versions: [v0.5.6]
  configurations:
    - name: default
      nodes: single
      optimization: balanced

families:
  - name: Llama-3.1
    description: Llama 3.1 70B Instruct model
    thinking_capability: non_thinking
    tool_parser: llama31

    models:
      - name: Llama-3.1-70B-Instruct
        quantization: fp8
        hardware:
          H100: { tp: 4 }
          H200: { tp: 4 }
          B200: { tp: 4 }
```

### Example 2: MoE Model with Multiple Deployment Presets (DeepSeek)

```yaml
company: deepseek-ai

defaults:
  hardware: [H200, B200]
  versions: [v0.5.6]
  configurations:
    # All DeepSeek models will have these two deployment options
    - name: default
      nodes: single
      optimization: balanced
      tp: 8
    - name: high-throughput-dp
      nodes: single
      optimization: high-throughput
      tp: 8
      dp: 8
      enable_dp_attention: true

families:
  - name: DeepSeek-V3.2
    description: DeepSeek V3.2 family
    thinking_capability: hybrid
    tool_parser: deepseekv32
    reasoning_parser: deepseek-v3

    models:
      - DeepSeek-V3.2

      - name: DeepSeek-V3.2-Exp
        tool_parser: deepseekv31
        chat_template: ./examples/chat_template/tool_chat_template_deepseekv32.jinja
```

### Example 3: Variant Generation (Qwen3)

```yaml
company: Qwen

defaults:
  hardware: [H100, H200, B200]
  versions: [v0.5.6]
  configurations:
    - name: default
      nodes: single
      optimization: balanced

families:
  - name: Qwen3
    description: Qwen3 language models
    tool_parser: qwen
    reasoning_parser: qwen3

    models:
      # Large MoE - generates 6 variants (3 capabilities x 2 quantizations)
      - base_name: 235B-A22B
        quantizations: [bf16, fp8]
        capabilities: [base, instruct, thinking]
        hardware:
          H100: { tp: 8 }
          H200: { tp: 8 }
          B200: { tp: 8 }
        fp8:
          ep: 2

      # Small dense - generates 2 variants (base x 2 quantizations)
      - base_name: 8B
        quantizations: [bf16, fp8]
        capabilities: [base]
        hardware:
          H100: { tp: 1 }
          H200: { tp: 1 }
          B200: { tp: 1 }
```

### Example 4: Custom Capability Suffixes (Qwen3-VL)

```yaml
families:
  - name: Qwen3-VL
    description: Qwen3 vision-language models
    tool_parser: qwen
    reasoning_parser: qwen3
    # Override default suffixes (-Instruct-2507 -> -Instruct)
    capability_suffix:
      instruct: "-Instruct"
      thinking: "-Thinking"

    models:
      - base_name: 32B
        quantizations: [bf16, fp8]
        capabilities: [instruct, thinking]
        hardware:
          H100: { tp: 1 }
```

This generates: `Qwen3-VL-32B-Instruct`, `Qwen3-VL-32B-Thinking` (instead of `-Instruct-2507`)

### Example 5: Hardware Constraints (GLM-4.6)

```yaml
families:
  - name: GLM-4.6
    models:
      - base_name: ""
        quantizations: [bf16, fp8]
        capabilities: [base]
        quant_suffix:
          bf16: ""
          fp8: "-FP8"
        hardware:
          # BF16 not supported on H100
          H100: { tp: 4, valid_quants: [fp8] }
          H200: { tp: 4 }
          B200: { tp: 4 }
```

### Example 6: Environment Variables

```yaml
defaults:
  configurations:
    - name: default
      optimization: balanced
      env_vars:
        NCCL_DEBUG: "WARN"
    - name: high-performance
      optimization: high-throughput
      env_vars:
        SGL_ENABLE_TORCH_COMPILE: "1"
        CUDA_DEVICE_MAX_CONNECTIONS: "1"

families:
  - name: MyModel
    models:
      - name: MyModel-Large
        hardware:
          H200:
            tp: 8
            env_vars:
              # Hardware-specific env vars (overrides defaults)
              CUDA_VISIBLE_DEVICES: "0,1,2,3,4,5,6,7"
```

### Example 7: Per-Model Hardware Override

Override default deployment configurations for specific models that need different settings:

```yaml
company: example-ai

defaults:
  hardware: [H100, H200, B200]
  versions: [v0.5.6]
  configurations:
    # Company-wide presets: all models get these options
    - name: default
      nodes: single
      optimization: balanced
      tp: 8
    - name: high-throughput-dp
      nodes: single
      optimization: high-throughput
      tp: 8
      dp: 8
      enable_dp_attention: true

families:
  - name: ExampleFamily
    models:
      # Model using all defaults (tp=8, dp=8 for high-throughput)
      - name: ExampleFamily-Standard

      # Model with hardware-specific overrides
      - name: ExampleFamily-Efficient
        hardware:
          H100:
            tp: 4                      # Override: smaller tp on H100
            dp: 2                      # Override: smaller dp on H100
          H200:
            tp: 4
            dp: 4
          B200:
            tp: 8                      # Keep default tp on B200
            # dp inherits from default configuration

      # MoE model with quantization-specific expert parallelism
      - base_name: MoE-Large
        quantizations: [bf16, fp8]
        capabilities: [base]
        hardware:
          H200: { tp: 8 }
          B200: { tp: 8 }
        bf16:
          ep: 1                        # BF16: no expert parallelism
        fp8:
          ep: 4                        # FP8: enable expert parallelism
          extra_args: ["--enable-ep-moe"]
```

## Validation

After creating or modifying a source file:

```bash
# Compile all source files
python data/scripts/compile_models.py

# Check if generated files are up-to-date (used in CI)
python data/scripts/compile_models.py --check

# Run TypeScript schema validation
cd data/schema && npm test
```

## Pre-commit Hook

The repository includes a pre-commit hook that automatically compiles source files when you commit changes to `src/*.yaml` files.
