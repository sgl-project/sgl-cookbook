# SGLang Installation (PyPI)

This guide covers installing SGLang via PyPI using `pip` or `uv`. For Docker-based installation, refer to the individual model deployment guides.

For the full installation reference, see the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html).

## Stable Releases

### With CUDA-specific kernels

#### CUDA 12.9

Using uv:
```bash
uv pip install sglang sgl-kernel \
  --extra-index-url https://sgl-project.github.io/whl/cu129/ \
  --extra-index-url https://download.pytorch.org/whl/cu129 \
  --index-strategy unsafe-best-match
```

Using pip:
```bash
pip install sglang sgl-kernel \
  --extra-index-url https://sgl-project.github.io/whl/cu129/ \
  --extra-index-url https://download.pytorch.org/whl/cu129
```

#### CUDA 13.0

Using uv:
```bash
uv pip install sglang sgl-kernel \
  --extra-index-url https://sgl-project.github.io/whl/cu130/ \
  --extra-index-url https://download.pytorch.org/whl/cu130 \
  --index-strategy unsafe-best-match
```

Using pip:
```bash
pip install sglang sgl-kernel \
  --extra-index-url https://sgl-project.github.io/whl/cu130/ \
  --extra-index-url https://download.pytorch.org/whl/cu130
```

## Nightly Releases

Nightly builds include the latest features and model support before they land in a stable release. Some recently added models (e.g., [Ling-2.5-1T](../autoregressive/InclusionAI/Ling-2.5-1T.md)) are available via nightly builds before stable release.

### CUDA 12.9

Using uv:
```bash
uv pip install -U sglang sgl-kernel --pre \
  --index-url https://sgl-project.github.io/whl/cu129/ \
  --extra-index-url https://pypi.org/simple \
  --extra-index-url https://download.pytorch.org/whl/cu129 \
  --index-strategy unsafe-best-match
```

Using pip:
```bash
pip install -U sglang sgl-kernel --pre \
  --index-url https://sgl-project.github.io/whl/cu129/ \
  --extra-index-url https://pypi.org/simple \
  --extra-index-url https://download.pytorch.org/whl/cu129
```

### CUDA 13.0

Using uv:
```bash
# Step 1: Install nightly sglang
uv pip install -U sglang --pre \
  --index-url https://sgl-project.github.io/whl/cu129/ \
  --extra-index-url https://pypi.org/simple \
  --extra-index-url https://download.pytorch.org/whl/cu130 \
  --index-strategy unsafe-best-match

# Step 2: Install CUDA 13.0 kernel
uv pip install -U sgl-kernel \
  --extra-index-url https://sgl-project.github.io/whl/cu130/ \
  --extra-index-url https://download.pytorch.org/whl/cu130 \
  --index-strategy unsafe-best-match
```
