---
name: add-model
description: Add a new model to the SGLang Cookbook, including documentation, sidebar, config generator component, and model YAML configuration.
disable-model-invocation: true
---

# Add New Model to SGLang Cookbook

This is an interactive, multi-step workflow. Collect inputs incrementally from the user as needed — do NOT ask for everything upfront.

## Phase 1: Collect Initial Inputs

Ask the user for:

1. **Model Card** - HuggingFace model name or URL (e.g., `Qwen/Qwen3-Coder-Next` or `https://huggingface.co/deepseek-ai/DeepSeek-V3`). Fetch the page to extract model description, supported capabilities, and other details. If the model is not yet public or the page is inaccessible, ask the user to paste as much information as they know (model name, parameter count, architecture, capabilities, context length, etc.).
2. **Model Variants** - Check if the model family has multiple size variants (e.g., 480B/30B) and quantization options (e.g., BF16/FP8). Ask the user which variants to include. This affects:
   - ConfigGenerator: `modelSize` option with `modelConfigs` per size, `quantization` option for BF16/FP8
   - YAML: `models` list with different `base_name` entries, `quantizations` arrays
   - Documentation: model name references and deployment examples
   - See `Qwen3CoderConfigGenerator` and `Qwen3NextConfigGenerator` for multi-variant examples.
3. **Full Deployment Command** - Complete SGLang launch command including all strategy and optimization flags (tp, dp, ep, enable_dp_attention, etc.). If the model card already provides an SGLang deployment command, offer it as a default option.
4. **SGLang Version** - The SGLang version the user is testing on (e.g., `v0.5.8`). This determines the version subdirectory for YAML configs (`data/models/src/<version>/`).

## Phase 2: Create Scaffolding

With model card and deployment command in hand, read ALL reference templates first, then create files.

### Reference Templates

Read these files to understand existing patterns before creating anything:
- **Doc template**: Find a similar model doc under `docs/autoregressive/` (e.g., `Qwen3-Coder.md` for a Qwen model, `DeepSeek-V3_2.md` for DeepSeek)
- **ConfigGenerator template**: Find a similar generator under `src/components/autoregressive/` (e.g., `Qwen3NextConfigGenerator/index.js`, `Qwen3CoderConfigGenerator/index.js`)
- **YAML template**: `data/models/src/<version>/<similar-model>.yaml` (e.g., `qwen3next.yaml`). List `data/models/src/` to see available version directories.
- **Sidebar**: `sidebars.js`
- **Vendors**: `data/models/vendors.yaml`

### Important Patterns

- ConfigGenerator components are placed FLAT under `src/components/autoregressive/<ModelNameConfigGenerator>/index.js` (NOT nested in vendor folders)
- YAML source files are in `data/models/src/<version>/` (NOT directly in `data/models/src/`). The version directory corresponds to the SGLang version being tested. Create it if it doesn't exist.
- The base `ConfigGenerator` component is at `src/components/base/ConfigGenerator`
- AMD GPUs (MI300X/MI325X/MI355X) typically need `--attention-backend triton`
- For models with `commandRule` on options, use the pattern from existing generators to apply rules via `Object.entries(this.options).forEach(...)`

### Step 1: Create documentation file

Create `docs/autoregressive/<Vendor>/<ModelName>.md` with ALL sections pre-populated:
- Section 1: Model introduction (from model card)
- Section 2: SGLang installation instructions
- Section 3: Model deployment section (embed the config generator component)
- Section 4: Model invocation — include deployment command at the TOP of this section, then pre-fill test scripts (code generation, streaming, tool calling if supported) with `TODO` placeholders for outputs. This allows the user to copy commands directly from the rendered page.
- Section 5: Benchmarks — pre-fill with benchmark commands and `TODO` placeholders for results

**Benchmark commands reference:**
- GSM8K: `python benchmark/gsm8k/bench_sglang.py --port <port>`
- MMLU: `python benchmark/mmlu/bench_sglang.py --port <port>`
- Latency benchmark: `python3 -m sglang.bench_serving --backend sglang --num-prompts 10 --max-concurrency 1 ...`
- Throughput benchmark: `python3 -m sglang.bench_serving --backend sglang --num-prompts 1000 --max-concurrency 100 ...`

**Important**:
- When the output contains nested markdown code blocks (e.g., model outputs python code), use four backticks ```````` for the outer block to avoid rendering issues.
- Do NOT hardcode sampling parameters (`temperature`, `top_p`, `top_k`) in code examples. SGLang automatically applies the recommended parameters from the model's `generation_config.json`.

### Step 2: Update sidebar

Edit `sidebars.js` to add the new entry under the appropriate vendor category.

### Step 3: Create config generator component

Create `src/components/autoregressive/<ModelName>ConfigGenerator/index.js` based on the deployment command provided.

Key considerations:
- Use the base `ConfigGenerator` component
- Define `modelConfigs` with per-hardware tp/ep settings
- Add `commandRule` for optional features (tool calling, reasoning parser, etc.)
- Default all optimizations and parsers to **Enabled** (e.g., tool call parser, reasoning parser) — users can disable if needed
- Consider hardware-specific flags (e.g., AMD triton backend)

**For models with multiple variants**, add selector options:
- `modelSize` option: e.g., `{ id: '480b', label: '480B', subtitle: 'MOE' }` — maps to different `modelConfigs` entries with per-hardware tp/ep
- `quantization` option: e.g., `{ id: 'bf16', label: 'BF16' }, { id: 'fp8', label: 'FP8' }` — affects model name suffix (e.g., `-FP8`) and may require extra flags (e.g., `--ep 2`, `--trust-remote-code`)
- `thinking` option: e.g., `{ id: 'instruct', label: 'Instruct' }, { id: 'thinking', label: 'Thinking' }` — affects model name suffix and reasoning parser

See `Qwen3CoderConfigGenerator` (multi-size + quantization) and `Qwen3NextConfigGenerator` (quantization + thinking) for reference patterns.

### Step 4: Add model configuration

Create `data/models/src/<version>/<modelname>.yaml` to define hardware configs and parallelism strategies. Use the SGLang version from Phase 1. Create the version directory if it doesn't exist.

## Phase 3: Compile, Validate, and Start Dev Server

Run compilation and validation:

```bash
source .venv/bin/activate && python data/scripts/compile_models.py
cd data/schema && npm install && npm test
```

Start dev server to verify rendering:

```bash
npm start
```

Verify the new page renders correctly at `http://localhost:3000`.

## Phase 4: Interactive Testing

The user will deploy the model and run the test scripts from the documentation page. They will paste results back, and we update the `TODO` placeholders with actual outputs.

This covers:
1. **Model Invocation** — code generation, streaming, tool calling results
2. **Speed Benchmarks** — latency and throughput results
3. **Accuracy Benchmarks** — GSM8K, MMLU results

## Phase 5: Configuration Tips

Ask the user for any extra information:
- Recommended settings
- Known issues or limitations
- Optimization tips

Add these to the documentation.

## Phase 6: Final Review

Review the complete documentation for:
- Nested code block formatting (use ```````` for outer blocks containing ` ``` `)
- Consistent port numbers across all commands
- No duplicate deployment commands (reference the one at the top of Section 4)
- All `TODO` placeholders replaced with actual results
