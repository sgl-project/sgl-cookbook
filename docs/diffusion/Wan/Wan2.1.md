---
sidebar_position: 1
---

# Wan2.1

## 1. Model Introduction

[Wan2.1 series](https://github.com/Wan-Video/Wan2.1) is an open and advanced suite of large-scale video generative models from Wan-AI.

Key characteristics:

- **State-of-the-art video quality**: Consistently outperforms many open-source and commercial video models on internal and public benchmarks, especially for motion richness and temporal consistency.
- **Consumer GPU friendly**: The T2V-1.3B variant can generate 5-second 480P videos on consumer GPUs with modest VRAM requirements.
- **Multi-capability suite**: Supports Text-to-Video (T2V), Image-to-Video (I2V), video editing, text-to-image, and video-to-audio generation.
- **Robust text rendering**: First-generation Wan model capable of generating both Chinese and English text in videos with strong readability.
- **Powerful Wan-VAE**: A 3D causal VAE that encodes/decodes long 1080P videos while preserving temporal information, enabling efficient high-resolution video generation.

For more details, refer to the official Wan2.1 resources:

- **GitHub**: [Wan-Video/Wan2.1](https://github.com/Wan-Video/Wan2.1)
- **Hugging Face collection**: [Wan-AI Wan2.1](https://huggingface.co/collections/Wan-AI/wan21-67b5ac2a1d8f42b46a19448e)

## 2. SGLang-diffusion Installation

SGLang-diffusion offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang-diffusion installation guide](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/install.md) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

The Wan2.1 series offers models in multiple sizes and resolutions, optimized for different hardware platforms. The recommended launch configurations vary by hardware and model size.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform and model variant.

import Wan2_1ConfigGenerator from '@site/src/components/diffusion/Wan2_1ConfigGenerator';

<Wan2_1ConfigGenerator />

### 3.2 Configuration Tips

Current supported optimization options are listed in the [SGLang diffusion support matrix](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/support_matrix.md).

- `--vae-path`: Path to a custom VAE model or HuggingFace model ID. If not specified, the VAE will be loaded from the main model path.
- `--num-gpus {NUM_GPUS}`: Number of GPUs to use.
- `--tp-size {TP_SIZE}`: Tensor parallelism size (for the encoder/DiT; keep \(\leq 1\) if relying heavily on CPU offload).
- `--sp-degree {SP_SIZE}`: Sequence parallelism degree.
- `--ulysses-degree {ULYSSES_DEGREE}`: Degree of DeepSpeed-Ulysses-style SP in USP.
- `--ring-degree {RING_DEGREE}`: Degree of ring attention-style SP in USP.
- `--text-encoder-cpu-offload`, `--dit-cpu-offload`, `--vae-cpu-offload`: Use CPU offload to reduce peak GPU memory when needed.

## 4. Model Invocation

### 4.1 Basic Usage

For more API usage and request examples, please refer to:
[SGLang Diffusion OpenAI API](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/openai_api.md)

#### 4.1.1 Launch a server and then send requests

```bash
sglang serve --model-path Wan-AI/Wan2.1-T2V-14B --port 3000

curl http://127.0.0.1:3000/v1/images/generations \
  -o >(jq -r '.data[0].b64_json' | base64 --decode > example.png) \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "black-forest-labs/FLUX.1-dev",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "1024x1024",
    "response_format": "b64_json"
  }'
```

#### 4.1.2 Generate a video without launching a server

```bash
SERVER_ARGS=(
  --model-path Wan-AI/Wan2.1-T2V-14B
  --text-encoder-cpu-offload
  --pin-cpu-memory
  --num-gpus 4
  --ulysses-degree=2
  --enable-cfg-parallel
)

SAMPLING_ARGS=(
  --prompt "A curious raccoon"
  --save-output
  --output-path outputs
  --output-file-name "A curious raccoon.mp4"
)

sglang generate "${SERVER_ARGS[@]}" "${SAMPLING_ARGS[@]}"
```

### 4.2 Advanced Usage

#### 4.2.1 Cache-DiT Acceleration

SGLang integrates [Cache-DiT](https://github.com/vipshop/cache-dit), a caching acceleration engine for Diffusion Transformers (DiT), to achieve significant inference speedups with minimal quality loss. You can set `SGLANG_CACHE_DIT_ENABLED=True` to enable it. For more details, please refer to the SGLang Cache-DiT [documentation](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/cache_dit.md).

**Basic Usage**

```bash
SGLANG_CACHE_DIT_ENABLED=true sglang serve --model-path Wan-AI/Wan2.1-T2V-14B
```

**Advanced Usage**

- DBCache Parameters: DBCache controls block-level caching behavior:

  | Parameter | Env Variable              | Default | Description                              |
  | --------- | ------------------------- | ------- | ---------------------------------------- |
  | Fn        | `SGLANG_CACHE_DIT_FN`     | 1       | Number of first blocks to always compute |
  | Bn        | `SGLANG_CACHE_DIT_BN`     | 0       | Number of last blocks to always compute  |
  | W         | `SGLANG_CACHE_DIT_WARMUP` | 4       | Warmup steps before caching starts       |
  | R         | `SGLANG_CACHE_DIT_RDT`    | 0.24    | Residual difference threshold            |
  | MC        | `SGLANG_CACHE_DIT_MC`     | 3       | Maximum continuous cached steps          |

- TaylorSeer Configuration: TaylorSeer improves caching accuracy using Taylor expansion:

  | Parameter | Env Variable                  | Default | Description                     |
  | --------- | ----------------------------- | ------- | ------------------------------- |
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
  sglang serve --model-path Wan-AI/Wan2.1-T2V-14B
  ```

#### 4.2.2 GPU Optimization

- `--dit-cpu-offload`: Use CPU offload for DiT inference. Enable if you run out of memory with FSDP.
- `--text-encoder-cpu-offload`: Use CPU offload for text encoder inference.
- `--image-encoder-cpu-offload`: Use CPU offload for image encoder inference.
- `--vae-cpu-offload`: Use CPU offload for VAE.
- `--pin-cpu-memory`: Pin memory for CPU offload. Use as a workaround if you see "CUDA error: invalid argument".

#### 4.2.3 Supported LoRA Registry

SGLang supports applying Wan2.1 LoRA adapters on top of base models:

| origin model  |  supported LoRA  |
| -------- | ------- |
| [Wan-AI/Wan2.1-T2V-14B](https://huggingface.co/Wan-AI/Wan2.1-T2V-14B) | [NIVEDAN/wan2.1-lora](https://huggingface.co/NIVEDAN/wan2.1-lora) |
| [Wan-AI/Wan2.1-I2V-14B-720P](https://huggingface.co/Wan-AI/Wan2.1-I2V-14B-720P) | [valiantcat/Wan2.1-Fight-LoRA](https://huggingface.co/valiantcat/Wan2.1-Fight-LoRA) |

**Example**:

```bash
sglang serve --model-path Wan-AI/Wan2.1-T2V-14B --port 3000 \
    --lora-path NIVEDAN/wan2.1-lora
```

## 5. Benchmark

### 5.1 How to Run Benchmarks with SGLang

You can use the built-in SGLang diffusion benchmark script to evaluate Wan2.1 performance on your hardware.

#### 5.1.1 Generate a single video

**Server Command**:

```bash
sglang serve --model-path Wan-AI/Wan2.1-T2V-14B
```

**Benchmark Command**:

```bash
python3 -m sglang.multimodal_gen.benchmarks.bench_serving \
    --backend sglang-video --dataset vbench --task t2v --num-prompts 1 --max-concurrency 1
```

#### 5.1.2 Generate videos with high concurrency

**Server Command**:

```bash
SGLANG_CACHE_DIT_ENABLED=true \
SGLANG_CACHE_DIT_FN=2 \
SGLANG_CACHE_DIT_BN=1 \
SGLANG_CACHE_DIT_WARMUP=4 \
SGLANG_CACHE_DIT_RDT=0.4 \
SGLANG_CACHE_DIT_MC=4 \
SGLANG_CACHE_DIT_TAYLORSEER=true \
SGLANG_CACHE_DIT_TS_ORDER=2 \
sglang serve --model-path Wan-AI/Wan2.1-T2V-14B
```

**Benchmark Command**:

```bash
python3 -m sglang.multimodal_gen.benchmarks.bench_serving \
    --backend sglang-video --dataset vbench --task t2v --num-prompts 20 --max-concurrency 20
```

For general notes on interpreting these results and comparing across models, see the [Diffusion Model Benchmark](../../base/benchmarks/diffusion_model_benchmark.md).
