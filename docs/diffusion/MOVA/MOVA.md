---
sidebar_position: 1
---
# MOVA

## 1. Model Introduction

[MOVA](https://github.com/OpenMOSS/MOVA) (MOSS Video and Audio) is a foundation model developed by the SII-OpenMOSS Team, designed to break the "silent era" of open-source video generation. Unlike cascaded pipelines that generate sound as an afterthought, MOVA synthesizes video and audio simultaneously in a single inference pass for perfect alignment. It adopts an Asymmetric Dual-Tower Architecture, fusing pre-trained video and audio towers through a bidirectional cross-attention mechanism to maintain tight synchronization between video and audio during generation.

[MOVA-360p](https://huggingface.co/OpenMOSS-Team/MOVA-360p) is suitable for fast inference and resource-constrained environments. [MOVA-720p](https://huggingface.co/OpenMOSS-Team/MOVA-720p) provides higher resolution video generation. Both versions support generating up to 8 seconds of video-audio content.

**Key Features:**

- **Native Bimodal Generation**: Generates high-fidelity video and synchronized audio in a single inference pass, eliminating error accumulation from cascaded pipelines
- **Precise Lip-Sync**: Achieves state-of-the-art performance in multilingual lip-synchronization (LSE-D: 7.094, LSE-C: 7.452 with Dual CFG on Verse-Bench Set3)
- **Environment-Aware Sound Effects**: Generates corresponding environmental sound effects including physical interaction sounds, ambient sounds, and spatial/textural sound feedback
- **Fully Open-Source**: Model weights, inference code, training pipelines, and LoRA fine-tuning scripts are all open-sourced

For more details, please refer to the [MOVA-360p HuggingFace page](https://huggingface.co/OpenMOSS-Team/MOVA-360p), the [MOVA-720p HuggingFace page](https://huggingface.co/OpenMOSS-Team/MOVA-720p), the [GitHub repository](https://github.com/OpenMOSS/MOVA), and the [technical report (arXiv)](https://arxiv.org/abs/2602.08794).

## 2. SGLang-diffusion Installation

SGLang-diffusion offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang-diffusion installation guide](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/install.md) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

MOVA supports both online serving and CLI generation modes. The recommended launch configurations vary by hardware and resolution.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform.

import MOVAConfigGenerator from '@site/src/components/diffusion/MOVAConfigGenerator';

<MOVAConfigGenerator />

### 3.2 Configuration Tips

Current supported optimization all listed [here](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/support_matrix.md).

- `--num-gpus`: Number of GPUs to use
- `--tp`: Tensor parallelism size (should not be larger than 1 if text encoder offload is enabled, as layer-wise offload plus prefetch is faster)
- `--ring-degree`: The degree of ring attention-style SP in USP
- `--ulysses-degree`: The degree of DeepSpeed-Ulysses-style SP in USP
- `--adjust-frames`: Whether to adjust frames automatically (set to `false` for MOVA)
- `--enable-torch-compile`: Enable torch.compile for faster inference

## 4. API Usage

For complete API documentation, please refer to the [official API usage guide](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/openai_api.md).

### 4.1 CLI Generation (sglang generate)

```bash
sglang generate \
  --model-path OpenMOSS-Team/MOVA-720p \
  --prompt "A man in a blue blazer and glasses speaks in a formal indoor setting, \
  framed by wooden furniture and a filled bookshelf. \
  Quiet room acoustics underscore his measured tone as he delivers his remarks. \
  At one point, he says, \"I would also believe that this advance in AI recently wasn't unexpected.\"" \
  --image-path "<YOUR-IMAGE-PATH>" \
  --adjust-frames false \
  --num-gpus 8 \
  --ring-degree 2 \
  --ulysses-degree 4 \
  --num-frames 193 \
  --fps 24 \
  --seed 67 \
  --num-inference-steps 25 \
  --enable-torch-compile \
  --save-output
```

### 4.2 Generate a Video

```bash
curl -X POST "http://0.0.0.0:30002/v1/videos" \
  -F "prompt=A man in a blue blazer and glasses speaks in a formal indoor setting, framed by wooden furniture and a filled bookshelf. Quiet room acoustics underscore his measured tone as he delivers his remarks. At one point, he says, \"I would also believe that this advance in AI recently wasn't unexpected.\"" \
  -F "input_reference=@<YOUR-IMAGE-PATH>" \
  -F "size=640x352" \
  -F "num_frames=193" \
  -F "fps=24" \
  -F "seed=67" \
  -F "guidance_scale=5.0" \
  -F "num_inference_steps=25" \
  -o create_video.json
```

### 4.3 Advanced Usage

#### 4.3.1 Cache-DiT Acceleration

SGLang integrates [Cache-DiT](https://github.com/vipshop/cache-dit), a caching acceleration engine for Diffusion Transformers (DiT), to achieve up to 7.4x inference speedup with minimal quality loss. You can set `SGLANG_CACHE_DIT_ENABLED=True` to enable it. For more details, please refer to the SGLang Cache-DiT [documentation](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/cache_dit.md).

**Basic Usage**

```bash
SGLANG_CACHE_DIT_ENABLED=true sglang serve --model-path OpenMOSS-Team/MOVA-720p
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
sglang serve --model-path OpenMOSS-Team/MOVA-720p
```

#### 4.3.2 CPU Offload

- `--dit-cpu-offload`: Use CPU offload for DiT inference. Enable if run out of memory.
- `--text-encoder-cpu-offload`: Use CPU offload for text encoder inference.
- `--vae-cpu-offload`: Use CPU offload for VAE.
- `--pin-cpu-memory`: Pin memory for CPU offload. Only added as a temp workaround if it throws "CUDA error: invalid argument".

## 5. Benchmark

### 5.1 Speedup Benchmark

#### 5.1.1 Generate a video

Test Environment:

- Hardware: NVIDIA H200 x 8
- git revision: 443b1a8
- Model: OpenMOSS-Team/MOVA-720p

**Server Command**:

```
sglang serve --model-path OpenMOSS-Team/MOVA-720p --port 30002 \
  --adjust-frames false --num-gpus 8 --ring-degree 2 --ulysses-degree 4 \
  --tp 1 --enable-torch-compile
```

**Benchmark Command**:

```
python3 -m sglang.multimodal_gen.benchmarks.bench_serving \
    --task image-to-video --dataset vbench --num-prompts 1 --max-concurrency 1 \
    --port 30002
```

**Result**:
```
================= Serving Benchmark Result =================
Task:                                    image-to-video
Model:                                   OpenMOSS-Team/MOVA-720p
Dataset:                                 vbench
--------------------------------------------------
Benchmark duration (s):                  590.76
Request rate:                            inf
Max request concurrency:                 1
Successful requests:                     1/1
--------------------------------------------------
Request throughput (req/s):              0.00
Latency Mean (s):                        590.7549
Latency Median (s):                      590.7549
Latency P99 (s):                         590.7549
--------------------------------------------------
Peak Memory Max (MB):                    74996.00
Peak Memory Mean (MB):                   74996.00
Peak Memory Median (MB):                 74996.00
============================================================
```

#### 5.1.2 Generate videos with high concurrency

**Server Command**:

```
sglang serve --model-path OpenMOSS-Team/MOVA-720p --port 30002 \
  --adjust-frames false --num-gpus 8 --ring-degree 2 --ulysses-degree 4 \
  --tp 1 --enable-torch-compile
```

**Benchmark Command**:

```
python3 -m sglang.multimodal_gen.benchmarks.bench_serving \
    --task image-to-video --dataset vbench --num-prompts 20 --max-concurrency 20 \
    --port 30002
```
