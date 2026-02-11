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
5. **Hardware Platforms** - Ask which hardware platforms have been tested. Only include tested platforms in the ConfigGenerator and YAML. Do NOT assume AMD GPU support unless explicitly confirmed.

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
- AMD GPUs (MI300X/MI325X/MI355X) typically need `--attention-backend triton` — only include if tested
- For models with `commandRule` on options, use the pattern from existing generators to apply rules via `Object.entries(this.options).forEach(...)`

### Step 1: Create documentation file

Create `docs/autoregressive/<Vendor>/<ModelName>.md` with ALL sections pre-populated:
- Section 1: Model introduction (from model card)
- Section 2: SGLang installation instructions
- Section 3: Model deployment section (embed the config generator component)
- Section 4: Model invocation — include deployment command at the TOP of this section, then pre-fill test scripts (code generation, streaming, tool calling if supported) with `TODO` placeholders for outputs. This allows the user to copy commands directly from the rendered page.
- Section 5: Benchmarks — pre-fill with benchmark commands and `TODO` placeholders for results

**Benchmark commands reference:**
- GSM8K: `python3 benchmark/gsm8k/bench_sglang.py --port <port>`
- MMLU: `python3 benchmark/mmlu/bench_sglang.py --port <port>`
- Latency benchmark: `python3 -m sglang.bench_serving --backend sglang --num-prompts 10 --max-concurrency 1 ...`
- Throughput benchmark: `python3 -m sglang.bench_serving --backend sglang --num-prompts 1000 --max-concurrency 100 ...`

Keep benchmarks concise — only include latency and throughput for speed benchmarks. Do NOT add multiple scenarios (chat/reasoning/summarization) or multiple concurrency levels unless the user requests it.

**Important**:
- When the output contains nested markdown code blocks (e.g., model outputs python code), use four backticks ```````` for the outer block to avoid rendering issues.
- Do NOT hardcode sampling parameters (`temperature`, `top_p`, `top_k`) in code examples. SGLang automatically applies the recommended parameters from the model's `generation_config.json`.

**Reasoning / Thinking mode in code examples:**
- For **hybrid reasoning models** (thinking is always on by default), show TWO examples:
  1. **Thinking mode (default)**: No extra parameters needed, show `reasoning_content` streaming
  2. **Instruct mode (thinking off)**: Show `extra_body={"chat_template_kwargs": {"enable_thinking": False}}`
- For **models with separate Instruct/Thinking variants** (e.g., Qwen3-Next): The model name changes (e.g., `-Instruct` vs `-Thinking`), handled by ConfigGenerator
- Ask the user which pattern applies if unclear from the model card

### Step 2: Update sidebar

Edit `sidebars.js` to add the new entry under the appropriate vendor category.

### Step 3: Create config generator component

Create `src/components/autoregressive/<ModelName>ConfigGenerator/index.js` based on the deployment command provided.

Key considerations:
- Use the base `ConfigGenerator` component
- Define `modelConfigs` with per-hardware settings including `tp` and `mem` (mem-fraction-static), e.g.: `h200: { fp8: { tp: 8, mem: 0.85 }, bf16: { tp: 16, mem: 0.85 } }`. The `mem` value varies by hardware and quantization — ask the user for tested values.
- Add `commandRule` for optional features (tool calling, reasoning parser, etc.)
- Default all parsers to **Enabled** (e.g., tool call parser, reasoning parser) — users can disable if needed

**Reasoning parser option:**
- For **hybrid reasoning models**: Use "Reasoning Parser" with Enabled/Disabled toggle (NOT "Thinking Capabilities" with Instruct/Thinking). The model always supports thinking; the parser just separates the output.
- For **models with separate variants**: Use "Thinking" option with Instruct/Thinking toggle that changes the model name suffix.

**DP Attention option:**
- If the model supports DP attention, add it as an option with `Disabled (Low Latency)` / `Enabled (High Throughput)` labels.
- The `--dp` value should **dynamically match** `--tp` value — handle this in `generateCommand`, NOT via a static `commandRule`. Example:
  ```js
  if (values.dpattention === 'enabled') {
    cmd += ` \\\n  --dp ${tpValue} \\\n  --enable-dp-attention`;
  }
  ```

**Large models (>400B parameters):**
- BF16 typically requires **2x GPUs** compared to FP8. Structure `modelConfigs` to reflect this per hardware platform.
- Some hardware/quantization combos may not fit at all — do NOT add error messages, simply omit those combos or let the user decide.

**For models with multiple variants**, add selector options:
- `modelSize` option: e.g., `{ id: '480b', label: '480B', subtitle: 'MOE' }` — maps to different `modelConfigs` entries with per-hardware tp/ep
- `quantization` option: e.g., `{ id: 'bf16', label: 'BF16' }, { id: 'fp8', label: 'FP8' }` — affects model name suffix (e.g., `-FP8`) and may require extra flags (e.g., `--ep 2`, `--trust-remote-code`)

See `GLM5ConfigGenerator` (hybrid reasoning + DP attention + per-hardware mem), `Qwen3CoderConfigGenerator` (multi-size + quantization), and `Qwen3NextConfigGenerator` (quantization + thinking variants) for reference patterns.

### Step 4: Add model configuration

Create `data/models/src/<version>/<modelname>.yaml` to define hardware configs and parallelism strategies. Use the SGLang version from Phase 1. Create the version directory if it doesn't exist.

Include configurations for:
- `default` — balanced single-node deployment
- `high-throughput-dp` — if DP attention is supported (dp + enable_dp_attention)
- `speculative-mtp` or `speculative-eagle` — if speculative decoding is supported

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
- DP attention trade-offs (high throughput vs low latency)
- Hardware-specific `mem-fraction-static` values

Add these to the documentation.

## Phase 6: Final Review

Can be triggered with `/add-model review`.

Review the complete documentation for:
- Nested code block formatting (use ```````` for outer blocks containing ` ``` `)
- Consistent port numbers across all commands
- No duplicate deployment commands (reference the one at the top of Section 4)
- All `TODO` placeholders replaced with actual results
- ConfigGenerator defaults match the documented deployment command
- Reasoning mode examples show both thinking-on and thinking-off patterns (for hybrid reasoning models)
- `modelConfigs` include both `tp` and `mem` values per hardware/quantization
- DP attention `--dp` value dynamically matches `--tp` in the generator
