---
name: review-pr
description: Review a pull request against the cookbook contribution checklist. Run with /review-pr <PR number>.
---

# Review PR

Given a PR number, fetch the diff and run the full checklist. Report findings clearly.

## Usage

```
/review-pr <PR number>
```

## Checklist

### 1. File hygiene
- No stray files: `package-lock.json`, `.claude/settings.local.json`, unrelated `.gitignore` changes
- Only expected files changed: `.md` doc + `src/components/.../index.js` + optional `data/` YAML

### 2. Launch command
- Must use `sglang serve` — flag any use of `python -m sglang.launch_server` (deprecated, see issue #33)

### 3. Hardware specs (AMD)
- MI300X = 192GB HBM3 per card
- MI325X = 256GB HBM3 per card  
- MI355X = 288GB HBM3E per card
- TP degree must be consistent with model size ÷ GPU memory per card

### 4. ConfigGenerator
- Options and `generateCommand` function match the doc
- AMD hardware options use correct card names and memory values

### 5. Links
- HuggingFace model URLs are valid and point to the right model
- No references to `sgl-project-dev` org (use `sgl-project`)

### 6. Build check
Run after reviewing:
```bash
npm run build
```
Fix any import errors before approving.

## Output format

For each file changed, give a one-line verdict:
- ✅ PASS
- ⚠️ ISSUE: <what's wrong>
- 🔴 BLOCK: <must fix before merge>

End with overall: **APPROVE** / **REQUEST CHANGES** / **BLOCKED**
