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

1. `gh pr view <N> --json title,body,files,author,baseRefName,headRefName`
2. `gh pr diff <N>`
3. `gh pr list --state open --search "<model name>"` (duplicate check)
4. Run every checklist item against the diff
5. Output per-file verdicts and overall recommendation

## Checklist

### 1. File hygiene
- No stray files (`package-lock.json`, `.claude/settings.local.json`, unrelated `.gitignore` changes)
- Only expected files: `.md` doc, `src/components/.../index.js`, optional `data/` YAML
- Files must end with a trailing newline — flag `\ No newline at end of file`

### 2. Launch command
- Must use `sglang serve` — flag `python -m sglang.launch_server` (deprecated, issue #33)
- Applies to docs AND ConfigGenerator `generateCommand`
- New PRs should fix pre-existing deprecated commands, not pile on more hardware

### 3. Hardware specs

| GPU    | Memory |
|--------|--------|
| A100   | 80GB   |
| H100   | 80GB   |
| H200   | 141GB  |
| B200   | 183GB  |
| B300   | 275GB  |
| MI300X | 192GB  |
| MI325X | 256GB  |
| MI350X | 288GB  |
| MI355X | 288GB  |

- TP must make sense: `model_weight_GB / (tp * gpu_mem)` should fit with ~20-30% headroom
- BF16 ≈ params * 2 GB, FP8 ≈ params * 1 GB, FP4 ≈ params * 0.5 GB

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

### 5. Port consistency
- Use `--port 30000` everywhere (not 8000)
- Applies to both docs and generated commands

### 6. Quantization rules
- FP4 is Blackwell-only (B200/B300) — never AMD
- BF16 and FP8 work on both NVIDIA and AMD
- AMD FP4 options must be `disabled: true` in the UI

### 7. Duplicate PRs
- Another open PR for the same model? Flag it
- Compare which is more complete (YAML, benchmarks, correct commands)
- Note merge conflict risk if they touch the same files

### 8. Sidebar
- New model → `sidebars.js` must be updated
- Deleted/renamed doc file → sidebar reference must follow
- Removed `sidebar_position` frontmatter → flag (affects ordering)

### 9. Links
- HuggingFace URLs point to the right model
- No `sgl-project-dev` references (use `sgl-project`)
- Docker images should come from `lmsysorg/sglang` — flag alternatives like `rocm/sgl-dev`
- Docs links use `docs.sglang.io` (canonical — `.ai` 301-redirects there)
- Markdown links well-formed: `[text](url)` not `[text] (url)`

### 10. Scope
- Do the changes match what the PR title says?
- Flag global changes hiding behind a platform-specific title (e.g., "H200 FP8" PR that adds `--kv-cache-dtype` to every platform)

### 11. Benchmarks
- Benchmarks use `python3 -m sglang.bench_serving`, not `sglang serve` with benchmark flags
- Deploy and benchmark are separate steps

### 12. Build
```bash
npm run build
```

## Output

Per file:
- ✅ PASS
- ⚠️ ISSUE: <what>
- 🔴 BLOCK: <what>

Overall: **APPROVE** / **REQUEST CHANGES** / **BLOCKED**
