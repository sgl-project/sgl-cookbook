---
name: update-cookbook
description: Translate a SemiAnalysis InferenceX benchmark PR into the cookbook's interactive config generator. Run with /update-cookbook <PR URL or number>.
---

# Update Cookbook

Given a SemiAnalysis/InferenceX PR, read the validated benchmark configuration and update the corresponding `ConfigGenerator/index.js` in this cookbook.

## Usage

```
/update-cookbook <PR URL or number>
```

Example:
```
/update-cookbook https://github.com/SemiAnalysisAI/InferenceX/pull/921
```

## Workflow

### 1. Read the PR
Use `gh pr view <number> --repo SemiAnalysisAI/InferenceX` and `gh pr diff` to extract:
- The benchmark shell script (e.g. `benchmarks/single_node/*.sh`) — this is the source of truth for launch flags
- The `nvidia-master.yaml` or `amd-master.yaml` config entry — source of truth for TP/EP/hardware combos

### 2. Identify the combo
From the PR extract: model, hardware, quantization, and special features (MTP/EAGLE, EP, FP4, etc.).

### 3. Find the cookbook target
Locate `src/components/autoregressive/<Model>ConfigGenerator/index.js`.
- **Always edit the `index.js`, not the markdown file.**
- The markdown is auto-generated from the config generator UI.

### 4. Audit flags
For the new hardware+quantization+feature combo, compare every flag in the `.sh` script against what `generateCommand` currently emits. Note:
- Wrong TP/EP values in `modelConfigs`
- Missing flags in `generateCommand`
- Flags scoped to wrong conditions

### 5. Update `modelConfigs`
Fix TP and add EP values for the hardware+quantization entry based on what the benchmark used.

### 6. Update `generateCommand`
Add missing flags, scoped correctly:
- **Hardware-specific**: only emit for the relevant GPU (e.g. H200, AMD)
- **Quantization-specific**: only emit for fp8/fp4 (e.g. `--kv-cache-dtype fp8_e4m3`, `--quantization fp8`)
- **Feature-specific**: only emit when a feature is selected (e.g. `--disable-radix-cache` only when speculative enabled)

### 7. Skip dynamic benchmark vars
Do **not** include flags that reference shell env vars in the benchmark harness:
- `--cuda-graph-max-bs $CONC`
- `--context-length $MAX_MODEL_LEN`
These are benchmark-specific and not appropriate for a user-facing serve recipe.

### 8. Create branch, commit, open PR
- Branch name: `<model>-<hardware>-<quantization>-<feature>` (e.g. `qwen35-h200-fp8-mtp`)
- PR description must reference the source SemiAnalysis PR (e.g. `Based on SemiAnalysisAI/InferenceX#921`)
