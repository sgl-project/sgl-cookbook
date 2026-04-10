---
name: add-model
description: Add a new model to the SGLang Cookbook, including documentation, sidebar, config generator component, and model YAML configuration.
disable-model-invocation: true
---

# Add New Model to SGLang Cookbook

Interactive, multi-step workflow. Collect inputs incrementally — don't ask for everything upfront.

## Phase 1: Collect Initial Inputs

Ask the user for:

1. **Model Card** — HuggingFace model name or URL (e.g., `Qwen/Qwen3-Coder-Next`). Fetch the page to extract description, capabilities, etc. If the model isn't public yet, ask the user to paste what they know (name, param count, architecture, capabilities, context length).
2. **Model Variants** — Multiple sizes (e.g., 480B/30B) or quantizations (BF16/FP8)? Which to include? This affects ConfigGenerator options, YAML entries, and doc examples. See `Qwen3CoderConfigGenerator` and `Qwen3NextConfigGenerator` for multi-variant patterns.
3. **Deployment Command** — Full `sglang serve --model-path` command with all flags (tp, dp, ep, etc.). Not `python -m sglang.launch_server` (deprecated, issue #33). If the model card provides one, use it as starting point but verify format.
4. **SGLang Version** — Version being tested (e.g., `v0.5.8`). Determines YAML directory: `data/models/src/<version>/`.
5. **Hardware Platforms** — Which platforms are tested? Show the full list (A100, H100, H200, B200, B300, MI300X, MI325X, MI350X, MI355X) and let the user pick. Only include tested platforms — don't assume anything. For each, confirm TP degree and any platform-specific flags.

## Phase 2: Create Scaffolding

Read ALL reference templates first, then create files.

### Reference Templates

- **Doc**: Find a similar model under `docs/autoregressive/` (e.g., `Qwen3-Coder.md`, `DeepSeek-V3_2.md`)
- **ConfigGenerator**: Similar generator under `src/components/autoregressive/` (e.g., `Qwen3NextConfigGenerator/index.js`)
- **YAML**: `data/models/src/<version>/<similar-model>.yaml`. List `data/models/src/` for available versions.
- **Sidebar**: `sidebars.js`
- **Vendors**: `data/models/vendors.yaml`

### Key Rules

- ConfigGenerator goes FLAT under `src/components/autoregressive/<ModelNameConfigGenerator>/index.js` (not nested in vendor folders)
- YAML source files go in `data/models/src/<version>/` (not directly in `data/models/src/`)
- Base `ConfigGenerator` component: `src/components/base/ConfigGenerator`
- All commands use `sglang serve` — never `python -m sglang.launch_server`
- All files end with a trailing newline
- Check open PRs first (`gh pr list --search "<model name>"`) to avoid duplicate work
- For `commandRule` options, follow the `Object.entries(this.options).forEach(...)` pattern from existing generators

### Hardware Reference

Only include platforms the user has actually tested.

| Platform | Vendor | Memory | Docker Image |
|----------|--------|--------|--------------|
| A100     | NVIDIA | 80GB   | `lmsysorg/sglang:<ver>` |
| H100     | NVIDIA | 80GB   | `lmsysorg/sglang:<ver>` |
| H200     | NVIDIA | 141GB  | `lmsysorg/sglang:<ver>` |
| B200     | NVIDIA | 180GB  | `lmsysorg/sglang:<ver>` |
| B300     | NVIDIA | 275GB  | `lmsysorg/sglang:<ver>` |
| MI300X   | AMD    | 192GB  | `lmsysorg/sglang:<ver>-rocm720-mi30x` |
| MI325X   | AMD    | 256GB  | `lmsysorg/sglang:<ver>-rocm720-mi30x` |
| MI350X   | AMD    | 288GB  | `lmsysorg/sglang:<ver>-rocm720-mi35x` |
| MI355X   | AMD    | 288GB  | `lmsysorg/sglang:<ver>-rocm720-mi35x` |

**TP calculation**: `model_weight_GB / gpu_mem_GB`, round up to nearest power of 2. Leave 20-30% headroom.
- BF16 ≈ params * 2 GB, FP8 ≈ params * 1 GB, FP4 ≈ params * 0.5 GB
- FP4 is Blackwell-only (B200/B300)
- MoE models: use total weight size (all experts), not active params

**Platform-specific flags** (only add if tested):
- Blackwell (B200/B300): may need `--attention-backend trtllm_mha`
- AMD: typically needs `--attention-backend triton`
- AMD env vars: `SGLANG_USE_AITER=1`, `SGLANG_ROCM_FUSED_DECODE_MLA=0`
- AMD MoE/MLA: check AITER kernel constraints on TP (e.g., `heads_per_gpu % 16 == 0`)

### Step 1: Create documentation

Create `docs/autoregressive/<Vendor>/<ModelName>.md`:
- Section 1: Model introduction (from model card)
- Section 2: SGLang installation
- Section 3: Deployment (embed ConfigGenerator component)
- Section 4: Invocation — deployment command at top, then test scripts (code gen, streaming, tool calling) with `TODO` output placeholders
- Section 5: Benchmarks with `TODO` result placeholders

Benchmark commands:
- GSM8K: `python3 benchmark/gsm8k/bench_sglang.py --port <port>`
- MMLU: `python3 benchmark/mmlu/bench_sglang.py --port <port>`
- MMMU: `python3 benchmark/mmmu/bench_sglang.py --port <port>` — uses a universal answer regex that works across models. Don't use model-specific parsing (e.g., `<|begin_of_box|>`) as it breaks with standard answer formats.
- Latency: `python3 -m sglang.bench_serving --backend sglang --num-prompts 10 --max-concurrency 1 ...`
- Throughput: `python3 -m sglang.bench_serving --backend sglang --num-prompts 1000 --max-concurrency 100 ...`

Keep benchmarks concise. Order: accuracy first, then speed. Don't add multiple scenarios or concurrency levels unless asked.

Notes:
- Nested code blocks: use four backticks ```````` for the outer block
- Don't hardcode sampling params (`temperature`, `top_p`) — SGLang uses `generation_config.json` defaults
- Hybrid reasoning models: show both thinking-on (default) and thinking-off (`enable_thinking: False`) examples
- Separate Instruct/Thinking variants (e.g., Qwen3-Next): model name changes, handled by ConfigGenerator
- Format raw API response objects (e.g., `ChatCompletionMessage(...)`) into readable structured output

### Step 2: Update sidebar and homepage

Edit `sidebars.js` — add the new entry under the right vendor.

Update `docs/intro.md` (homepage):
- Add model under the correct vendor section
- `- [x]` if doc has real content, `- [ ]` if stub/placeholder
- Keep `NEW` tags to 3 or fewer total — if adding one, remove the oldest first (check git history)
- Entry order in `intro.md` should match `sidebars.js`

### Step 3: Create ConfigGenerator

Create `src/components/autoregressive/<ModelName>ConfigGenerator/index.js`.

- Use the base `ConfigGenerator` component
- `modelConfigs` with per-hardware `tp` and `mem` values: `h200: { fp8: { tp: 8, mem: 0.85 }, bf16: { tp: 16, mem: 0.85 } }`
- Only list tested platforms in hardware options
- Platform detection in `generateCommand`:
  ```js
  const isAMD = ['mi300x','mi325x','mi350x','mi355x'].includes(hardware);
  const isBlackwell = ['b200','b300'].includes(hardware);
  if (isAMD) { /* AMD-specific flags */ }
  if (isBlackwell) { /* Blackwell-specific flags */ }
  ```
- `commandRule` for optional features (tool calling, reasoning parser, etc.)
- Default parsers to Enabled

**Reasoning parser**: For hybrid models, use Enabled/Disabled toggle (the model always thinks; parser just separates output). For separate Instruct/Thinking variants, toggle changes the model name suffix.

**DP Attention**: `Disabled (Low Latency)` / `Enabled (High Throughput)`. The `--dp` value commonly matches `--tp` but this isn't mandatory. Handle in `generateCommand`, not via static `commandRule`:
```js
if (values.dpattention === 'enabled') {
  cmd += ` \\\n  --dp ${tpValue} \\\n  --enable-dp-attention`;
}
```
In config tips, describe `--dp` matching `--tp` as a common pattern, not a requirement.

**Large models (>400B)**: BF16 needs ~2x GPUs vs FP8. Reflect this in `modelConfigs`. Omit combos that don't fit.

**Multiple variants**: Add `modelSize` and/or `quantization` selectors. See `GLM51ConfigGenerator`, `GLM5ConfigGenerator`, `Qwen3CoderConfigGenerator`, `Qwen3NextConfigGenerator` for patterns.

**Platform-required flags**: If a platform requires certain flags to function at all (e.g., AMD MI355X needs `--attention-backend triton`), add them unconditionally for that platform — NOT gated behind optional checkboxes like "Performance Optimizations". Optional optimizations go inside checkbox guards; required-to-work flags go outside.

**No dead code**: Don't define `commandRule` on options if `generateCommand` handles them directly (the rules will never be called). Don't use `getDynamicItems` if the items don't depend on other option values — use static `items` instead. Don't leave unused helper functions.

**No silent ignores**: If a feature (e.g., DP attention) is unsupported on a platform, either disable the UI option or show an explicit message (like a "Work In Progress" note). Never silently drop user selections.

**Scope discipline**: If adding support for one platform, don't accidentally add global flags. Always check conditionals: `if (quantization === 'fp8')` without a hardware guard affects ALL platforms. Be explicit: `if (hardware === 'h200' && quantization === 'fp8')`.

**License accuracy**: Always verify the actual HuggingFace model license before writing the license section. Don't copy from other model docs — licenses vary (Apache 2.0, MIT, community licenses, etc.).

### Step 4: Add YAML config

Create `data/models/src/<version>/<modelname>.yaml`:
- `default` — balanced single-node
- `high-throughput-dp` — if DP attention supported
- `speculative-mtp` or `speculative-eagle` — if speculative decoding supported

Valid `thinking_capability` enum values: `non_thinking`, `thinking`, `hybrid`. Don't use `hybrid_thinking` or other variants — pre-commit validation rejects them.

## Phase 3: Compile, Validate, Build

Ensure venv exists:
```bash
python3 -m venv .venv
source .venv/bin/activate && pip install pre-commit pyyaml
```

Compile and validate:
```bash
source .venv/bin/activate && python data/scripts/compile_models.py
cd data/schema && npm install && npm test
```

Full build (catches import errors, broken links, component issues — more reliable than dev server):
```bash
npm run build
```

Dev server for visual check:
```bash
npm start
```

Check the page renders at `http://localhost:3000`.

## Phase 4: Interactive Testing

User deploys the model, runs test scripts, pastes results. Replace `TODO` placeholders with actual outputs:
1. Invocation results (code gen, streaming, tool calls)
2. Accuracy benchmarks (GSM8K, MMLU)
3. Speed benchmarks (latency, throughput)

## Phase 5: Configuration Tips

Ask for:
- Recommended settings, known issues, optimization tips
- DP attention trade-offs
- Hardware-specific `mem-fraction-static` values

Add to docs.

## Phase 6: Final Review

Can be triggered with `/add-model review`. Also consider running `/review-pr` on the PR for an automated checklist pass.

Review the complete documentation for:
- Nested code block formatting (use ```````` for outer blocks containing ` ``` `)
- Consistent port numbers across all commands, curl examples, and client code (use 30000, not 8000)
- Launch port matches client/curl `base_url` port on the same page
- No duplicate deployment commands (reference the one at the top of Section 4)
- All `TODO` placeholders replaced with actual results
- ConfigGenerator defaults match the documented deployment command
- ConfigGenerator `export default` matches the actual class name (common copy-paste bug)
- All commands use `sglang serve` — no deprecated `python -m sglang.launch_server` or `python3 -m sglang.launch_server`
- Reasoning mode examples show both thinking-on and thinking-off patterns (for hybrid reasoning models)
- `modelConfigs` include both `tp` and `mem` values per hardware/quantization
- DP attention `--dp` value dynamically matches `--tp` in the generator
- Homepage (`docs/intro.md`) includes the new model entry and matches sidebar order
- NEW tag count on homepage is 3 or fewer
- Raw API response objects (e.g., `ChatCompletionMessage(...)`) are formatted into readable structured output (Reasoning/Content/Tool Calls sections)
- License section matches the actual HuggingFace model license (verify — don't copy from other models)
- No dead code in ConfigGenerator (unused `commandRule`, unused helper functions, `getDynamicItems` returning static arrays)
- Platform-required flags are unconditional (not behind optional checkboxes)
- Unsupported features show explicit messages, not silent no-ops
- No images hosted on Google Drive (sharing links don't render in markdown)
- Shell environment blocks use proper placeholders (`export VAR=<your-value>`), not `export VAR=${VAR}` (which is a bash no-op)
- Grammar and spelling checked in all added documentation text

## Git Workflow

Always create a new branch — never commit to main directly.

```bash
git checkout -b add-<model-name>
# ... make changes ...
git add <specific files>
git commit -m "Add <Model Name> cookbook"
git push -u origin add-<model-name>
gh pr create --title "Add <Model Name> cookbook" --body "..."
```

When checking homepage entries, verify the doc has real content — not just a "Community contribution welcome" stub.
