---
name: review-pr
description: Review a pull request against the cookbook contribution checklist. Run with /review-pr <PR number>.
---

# Review PR

Fetch the diff, run the checklist, report what you find.

## Usage

```
/review-pr <PR number>
```

## Steps

1. `gh pr view <N> --json title,body,files,author,baseRefName,headRefName,commits,reviews`
2. `gh pr diff <N>`
3. `gh pr list --state open --search "<model name>"` (duplicate check)
4. Run every checklist item against the diff
5. Output per-file verdicts and overall recommendation

## Checklist

### 1. File hygiene
- No stray files (`package-lock.json`, `.claude/settings.local.json`, unrelated `.gitignore` changes)
- Only expected files: `.md` doc, `src/components/.../index.js`, optional `data/` YAML
- Files must end with a trailing newline — flag `\ No newline at end of file`
- Check commit history for unrelated commits (e.g., "Create settings.local.json") that may have been included accidentally

### 2. Launch command
- Must use `sglang serve` — flag `python -m sglang.launch_server` (deprecated, issue #33)
- Applies to docs AND ConfigGenerator `generateCommand`
- New PRs should fix pre-existing deprecated commands in files they touch, not pile on more hardware
- Also flag `python3 -m sglang.launch_server` (same issue, just python3 variant)

### 3. Hardware specs

| GPU    | Memory |
|--------|--------|
| A100   | 80GB   |
| H100   | 80GB   |
| H200   | 141GB  |
| B200   | 180GB  |
| B300   | 275GB  |
| MI300X | 192GB  |
| MI325X | 256GB  |
| MI350X | 288GB  |
| MI355X | 288GB  |

- TP must make sense: `model_weight_GB / (tp * gpu_mem)` should fit with ~20-30% headroom
- BF16 ≈ params * 2 GB, FP8 ≈ params * 1 GB, FP4 ≈ params * 0.5 GB
- For MoE models, use total weight size (all experts), not active params
- Multi-node configs: verify node count × GPUs × memory is sufficient

### 4. ConfigGenerator quality
- Must extend the base `ConfigGenerator` from `../../base/ConfigGenerator` — no custom standalone React components
- `generateCommand` output must match what the docs describe
- GPU names uppercase: `MI300X` not `MI300x`
- `export default` matches the component name (copy-paste trap)
- Hardware selection must actually change the generated command
- `modelConfigs` needs an entry for every hardware option (missing = runtime crash)
- Model path in `generateCommand` must match the right model (e.g., don't use Scout path in a Maverick generator)
- Option IDs must be unique — two items with `id: 'enabled'` is a bug
- Each option group needs exactly one `default: true`
- Watch for JS syntax errors (mismatched braces, trailing commas)
- If a quantization/weight option exists in the UI, it must do something in `generateCommand` — dead options are misleading
- New hardware should come with `data/models/src/` YAML updates
- No dead code: unused functions, unreachable `commandRule` properties superseded by `generateCommand`, or `getDynamicItems` that return static arrays
- No duplicate conditional blocks with identical conditions — consolidate them
- Platform-required flags (e.g., AMD Triton attention) must be unconditional, not gated behind optional checkboxes
- Silently ignoring user selections (e.g., DP checkbox does nothing for a platform) is a UX bug — show a message or disable the option

### 5. Port consistency
- Use `--port 30000` everywhere (not 8000)
- Applies to docs, generated commands, curl examples, benchmark commands, and client code (`base_url`)
- All examples on the same page must use the same port — launch command port must match client/curl port
- For multi-node configs, shell variable placeholders like `${PORT}` are acceptable but document the expected value

### 6. Quantization rules
- FP4 is Blackwell-only (B200/B300) — never AMD
- BF16 and FP8 work on both NVIDIA and AMD
- AMD FP4 options must be `disabled: true` in the UI
- FP8 configs that add `--kv-cache-dtype fp8_e4m3` should note potential accuracy trade-offs

### 7. Duplicate PRs
- Another open PR for the same model? Flag it
- Compare which is more complete (YAML, benchmarks, correct commands)
- Note merge conflict risk if they touch the same files
- Same author with overlapping PRs: flag the older one as potentially superseded

### 8. Sidebar
- New model → `sidebars.js` must be updated
- Deleted/renamed doc file → sidebar reference must follow
- Removed `sidebar_position` frontmatter → flag (affects ordering)

### 9. Links and factual claims
- HuggingFace URLs point to the right model — verify the model actually exists
- No `sgl-project-dev` references (use `sgl-project`)
- Docker images should come from `lmsysorg/sglang` — flag alternatives like `rocm/sgl-dev`
- Docs links use `docs.sglang.io` (canonical — `.ai` 301-redirects there)
- Markdown links well-formed: `[text](url)` not `[text] (url)`
- Google Drive sharing links will NOT render as images in markdown — must use direct image URLs or host in repo
- License claims must match the actual HuggingFace model license (common error: saying "Community License" when model is Apache 2.0)
- Shell placeholders like `export VAR=${VAR}` are bash no-ops — use `export VAR=<placeholder>` or actual example values

### 10. Scope
- Do the changes match what the PR title says?
- Flag global changes hiding behind a platform-specific title (e.g., "H200 FP8" PR that adds `--kv-cache-dtype` to every platform)
- Check conditionals carefully: `if (quantization === 'fp8')` without a hardware guard affects ALL platforms, not just the one in the title
- Unmentioned side-fixes (bug fixes, flag renames, casing corrections) should be documented in the PR body

### 11. Benchmarks
- Benchmarks use `python3 -m sglang.bench_serving`, not `sglang serve` with benchmark flags
- Deploy and benchmark are separate steps
- Benchmark port must match the deployment port in the same section

### 12. Build
```bash
npm run build
```

### 13. Grammar and spelling (docs PRs)
- Check all added/changed lines for typos, misspellings, and grammar errors
- Common issues: "recommend" vs "recommended", subject-verb agreement, misspelled technical terms
- Flag each error with the exact wrong text and correction

### 14. Reviewer feedback
- Check existing review comments from `gh api repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/pulls/<N>/comments` — have prior reviewer requests been addressed?
- Unresolved requested changes from collaborators should be flagged
- If a reviewer requested something specific (e.g., accuracy warning), verify it was added in the latest diff

## Output

Per file:
- ✅ PASS
- ⚠️ ISSUE: <what>
- 🔴 BLOCK: <what>

Overall: **APPROVE** / **REQUEST CHANGES** / **BLOCKED**
