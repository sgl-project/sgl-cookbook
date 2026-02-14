---
sidebar_position: 0
---
# Z-Image-Turbo

## 1. Model Introduction

[Z-Image-Turbo](https://huggingface.co/Tongyi-MAI/Z-Image-Turbo) is a distilled text-to-image diffusion model from the Z-Image family developed by the Tongyi-MAI team. It matches or exceeds leading competitors with only 8 NFEs (Number of Function Evaluations).

For more details, please refer to the [official Z-Image-Turbo HuggingFace page](https://huggingface.co/Tongyi-MAI/Z-Image-Turbo), the [Blog](https://tongyi-mai.github.io/Z-Image-blog/), and the [Tech Report](https://arxiv.org/abs/2511.22699).

## 2. SGLang-diffusion Installation

SGLang-diffusion offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang-diffusion installation guide](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/install.md) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

Z-Image-Turbo is a text-to-image model. The recommended launch configurations vary by hardware.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform.

import ZImageTurboConfigGenerator from '@site/src/components/diffusion/ZImageTurboConfigGenerator';

<ZImageTurboConfigGenerator />

### 3.2 Configuration Tips

Current supported optimization all listed [here](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/support_matrix.md).

- `--vae-path`: Path to a custom VAE model or HuggingFace model ID (e.g., fal/FLUX.2-Tiny-AutoEncoder). If not specified, the VAE will be loaded from the main model path.
- `--num-gpus`: Number of GPUs to use
- `--tp-size`: Tensor parallelism size (only for the encoder; should not be larger than 1 if text encoder offload is enabled, as layer-wise offload plus prefetch is faster)
- `--sp-degree`: Sequence parallelism size (typically should match the number of GPUs)
- `--ulysses-degree`: The degree of DeepSpeed-Ulysses-style SP in USP
- `--ring-degree`: The degree of ring attention-style SP in USP

**AMD ROCm Notes**: Requires SGLang >= v0.5.8.

## 4. API Usage

For complete API documentation, please refer to the [official API usage guide](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/openai_api.md).

### 4.1 Generate an Image

```python
import base64
from openai import OpenAI

client = OpenAI(api_key="EMPTY", base_url="http://localhost:30000/v1")

response = client.images.generate(
    model="Tongyi-MAI/Z-Image-Turbo",
    prompt="A logo With Bold Large text: SGL Diffusion",
    n=1,
    response_format="b64_json",
)

# Save the generated image
image_bytes = base64.b64decode(response.data[0].b64_json)
with open("output.png", "wb") as f:
    f.write(image_bytes)
```

### 4.2 Advanced Usage

#### 4.2.1 Cache-DiT Acceleration

SGLang integrates [Cache-DiT](https://github.com/vipshop/cache-dit), a caching acceleration engine for Diffusion Transformers (DiT), to achieve up to 7.4x inference speedup with minimal quality loss. You can set `SGLANG_CACHE_DIT_ENABLED=True` to enable it. For more details, please refer to the SGLang Cache-DiT [documentation](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/cache_dit.md).

**Basic Usage**

```bash
SGLANG_CACHE_DIT_ENABLED=true sglang serve --model-path Tongyi-MAI/Z-Image-Turbo
```

**Advanced Usage**

- DBCache Parameters: DBCache controls block-level caching behavior:

  | Parameter | Env Variable                | Default | Description                              |
  | --------- | --------------------------- | ------- | ---------------------------------------- |
  | Fn        | `SGLANG_CACHE_DIT_FN`     | 1       | Number of first blocks to always compute |
  | Bn        | `SGLANG_CACHE_DIT_BN`     | 0       | Number of last blocks to always compute  |
  | W         | `SGLANG_CACHE_DIT_WARMUP` | 4       | Warmup steps before caching starts       |
  | R         | `SGLANG_CACHE_DIT_RDT`    | 0.24    | Residual difference threshold            |
  | MC        | `SGLANG_CACHE_DIT_MC`     | 3       | Maximum continuous cached steps          |
- TaylorSeer Configuration: TaylorSeer improves caching accuracy using Taylor expansion:

  | Parameter | Env Variable                    | Default | Description                     |
  | --------- | ------------------------------- | ------- | ------------------------------- |
  | Enable    | `SGLANG_CACHE_DIT_TAYLORSEER` | false   | Enable TaylorSeer calibrator    |
  | Order     | `SGLANG_CACHE_DIT_TS_ORDER`   | 1       | Taylor expansion order (1 or 2) |

  Combined Configuration Example:

```bash
SGLANG_CACHE_DIT_ENABLED=true \
SGLANG_CACHE_DIT_FN=2 \
SGLANG_CACHE_DIT_BN=1 \
SGLANG_CACHE_DIT_WARMUP=4 \
SGLANG_CACHE_DIT_RDT=0.4 \
SGLANG_CACHE_DIT_MC=4 \
SGLANG_CACHE_DIT_TAYLORSEER=true \
SGLANG_CACHE_DIT_TS_ORDER=2 \
sglang serve --model-path Tongyi-MAI/Z-Image-Turbo
```

#### 4.2.2 CPU Offload

- `--dit-cpu-offload`: Use CPU offload for DiT inference. Enable if run out of memory.
- `--text-encoder-cpu-offload`: Use CPU offload for text encoder inference.
- `--vae-cpu-offload`: Use CPU offload for VAE.
- `--pin-cpu-memory`: Pin memory for CPU offload. Only added as a temp workaround if it throws "CUDA error: invalid argument".

## 5. Benchmark

Test Environment:

- Hardware: AMD Instinct MI300X GPU (1x)
- Model: Tongyi-MAI/Z-Image-Turbo
- Docker Image: lmsysorg/sglang:v0.5.8-rocm700-mi30x
- sglang diffusion version: 0.5.8

### 5.1 Speedup Benchmark

#### 5.1.1 Generate an image

**Server Command**:

```
sglang serve --model-path Tongyi-MAI/Z-Image-Turbo \
    --ulysses-degree=1 --ring-degree=1 --port 30000
```

**Benchmark Command**:

```
python3 -m sglang.multimodal_gen.benchmarks.bench_serving \
    --backend sglang-image --dataset vbench --task text-to-image --num-prompts 1 --max-concurrency 1
```

**Result**:

```
================= Serving Benchmark Result =================
Task:                                    text-to-image
Model:                                   Tongyi-MAI/Z-Image-Turbo
Dataset:                                 vbench
--------------------------------------------------
Benchmark duration (s):                  1.84
Request rate:                            inf
Max request concurrency:                 1
Successful requests:                     1/1
--------------------------------------------------
Request throughput (req/s):              0.54
Latency Mean (s):                        1.8435
Latency Median (s):                      1.8435
Latency P99 (s):                         1.8435
--------------------------------------------------
Peak Memory Max (MB):                    30689.20
Peak Memory Mean (MB):                   30689.20
Peak Memory Median (MB):                 30689.20
============================================================
```

#### 5.1.2 Generate images with high concurrency

**Benchmark Command**:

```
python3 -m sglang.multimodal_gen.benchmarks.bench_serving \
    --backend sglang-image --dataset vbench --task text-to-image --num-prompts 20 --max-concurrency 20
```

**Result**:

```
================= Serving Benchmark Result =================
Task:                                    text-to-image
Model:                                   Tongyi-MAI/Z-Image-Turbo
Dataset:                                 vbench
--------------------------------------------------
Benchmark duration (s):                  35.32
Request rate:                            inf
Max request concurrency:                 20
Successful requests:                     20/20
--------------------------------------------------
Request throughput (req/s):              0.57
Latency Mean (s):                        18.5672
Latency Median (s):                      18.5573
Latency P99 (s):                         34.9880
--------------------------------------------------
Peak Memory Max (MB):                    30689.26
Peak Memory Mean (MB):                   30689.21
Peak Memory Median (MB):                 30689.21
============================================================
```
