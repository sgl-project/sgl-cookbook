---
sidebar_position: 2
---

# Wan2.2

## 1. Model Introduction

[Wan2.2 series](https://github.com/Wan-Video/Wan2.2) are the most popular and open and advanced large-scale video generative models.

This generation delivers comprehensive upgrades across the board:

- **Effective MoE Architecture**: Introduces a Mixture-of-Experts (MoE) architecture into video diffusion models. By separating the denoising process cross timesteps with specialized powerful expert models, this enlarges the overall model capacity while maintaining the same computational cost.
- **Cinematic-level Aesthetics**: Incorporates meticulously curated aesthetic data, complete with detailed labels for lighting, composition, contrast, color tone, and more. This allows for more precise and controllable cinematic style generation, facilitating the creation of videos with customizable aesthetic preferences.
- **Complex Motion Generation**: Trained on a significantly larger data, with +65.6% more images and +83.2% more videos. This expansion notably enhances the model's generalization across multiple dimensions such as motions, semantics, and aesthetics, achieving TOP performance among all open-sourced and closed-sourced models.
- **Efficient High-Definition Hybrid TI2V**: Open-sources a 5B model built with our advanced Wan2.2-VAE that achieves a compression ratio of 16×16×4. This model supports both text-to-video and image-to-video generation at 720P resolution with 24fps and can also run on consumer-grade graphics cards like 4090. It is one of the fastest 720P@24fps models currently available, capable of serving both the industrial and academic sectors simultaneously.

For more details, please refer to the [official Wan2.2 GitHub Repository](https://github.com/Wan-Video/Wan2.2).

## 2. SGLang-diffusion Installation

SGLang-diffusion offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang-diffusion installation guide](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/install.md) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

The Wan2.2 series offers models in various sizes, architectures and input types, optimized for different hardware platforms. The recommended launch configurations vary by hardware and model size.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model size.

import Wan2_2ConfigGenerator from '@site/src/components/Wan2_2ConfigGenerator';

<Wan2_2ConfigGenerator />

### 3.2 Configuration Tips

Current supported optimzation all listed [here](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/support_matrix.md).

--vae-path: Path to a custom VAE model or HuggingFace model ID (e.g., fal/FLUX.2-Tiny-AutoEncoder). If not specified, the VAE will be loaded from the main model path.
--num-gpus {NUM_GPUS}: Number of GPUs to use
--tp-size {TP_SIZE}: Tensor parallelism size (only for the encoder; should not be larger than 1 if text encoder offload is enabled, as layer-wise offload plus prefetch is faster)
--sp-degree {SP_SIZE}: Sequence parallelism size (typically should match the number of GPUs)
--ulysses-degree {ULYSSES_DEGREE}: The degree of DeepSpeed-Ulysses-style SP in USP
--ring-degree {RING_DEGREE}: The degree of ring attention-style SP in USP


## 4. Model Invocation

### 4.1 Basic Usage
For more API usage and request examples, please refer to:
[SGLang Diffusion OpenAI API](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/openai_api.md)

#### 4.1.1 Launch a server and then send requests
```
sglang serve --model-path black-forest-labs/FLUX.1-dev --port 3000

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
```
SERVER_ARGS=(
  --model-path Wan-AI/Wan2.2-T2V-A14B-Diffusers
  --text-encoder-cpu-offload
  --pin-cpu-memory
  --num-gpus 4
  --ulysses-degree=2
  --ring-degree=2
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
SGLang integrates [Cache-DiT](https://github.com/vipshop/cache-dit), a caching acceleration engine for Diffusion Transformers (DiT), to achieve up to 7.4x inference speedup with minimal quality loss. You can set `SGLANG_CACHE_DIT_ENABLED=True` to enable it. For more details, please refer to the SGLang Cache-DiT [documentation](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/docs/cache_dit.md).

**Basic Usage**
```
SGLANG_CACHE_DIT_ENABLED=true sglang serve --model-path Wan-AI/Wan2.2-T2V-A14B-Diffusers
```
**Advanced Usage**
- DBCache Parameters: DBCache controls block-level caching behavior:

  | Parameter | Env Variable              | Default | Description                              |
  |-----------|---------------------------|---------|------------------------------------------|
  | Fn        | `SGLANG_CACHE_DIT_FN`     | 1       | Number of first blocks to always compute |
  | Bn        | `SGLANG_CACHE_DIT_BN`     | 0       | Number of last blocks to always compute  |
  | W         | `SGLANG_CACHE_DIT_WARMUP` | 4       | Warmup steps before caching starts       |
  | R         | `SGLANG_CACHE_DIT_RDT`    | 0.24    | Residual difference threshold            |
  | MC        | `SGLANG_CACHE_DIT_MC`     | 3       | Maximum continuous cached steps          |

- TaylorSeer Configuration: TaylorSeer improves caching accuracy using Taylor expansion:

  | Parameter | Env Variable                  | Default | Description                     |
  |-----------|-------------------------------|---------|---------------------------------|
  | Enable    | `SGLANG_CACHE_DIT_TAYLORSEER` | false   | Enable TaylorSeer calibrator    |
  | Order     | `SGLANG_CACHE_DIT_TS_ORDER`   | 1       | Taylor expansion order (1 or 2) |
Combined Configuration Example:
```
SGLANG_CACHE_DIT_ENABLED=true \
SGLANG_CACHE_DIT_FN=2 \
SGLANG_CACHE_DIT_BN=1 \
SGLANG_CACHE_DIT_WARMUP=4 \
SGLANG_CACHE_DIT_RDT=0.4 \
SGLANG_CACHE_DIT_MC=4 \
SGLANG_CACHE_DIT_TAYLORSEER=true \
SGLANG_CACHE_DIT_TS_ORDER=2 \
sglang serve --model-path Wan-AI/Wan2.2-T2V-A14B-Diffusers
```

#### 4.2.2 GPU Optimization

- `--dit-cpu-offload`: Use CPU offload for DiT inference. Enable if run out of memory with FSDP.
- `--text-encoder-cpu-offload`: Use CPU offload for text encoder inference. Enable if run out of memory with FSDP.
- `--image-encoder-cpu-offload`: Use CPU offload for image encoder inference. Enable if run out of memory with FSDP.
- `--vae-cpu-offload`: Use CPU offload for VAE. Enable if run out of memory.
- `--pin-cpu-memory`: Pin memory for CPU offload. Only added as a temp workaround if it throws "CUDA error: invalid argument".

## 5. Benchmark
Test Environment:
- Hardware: NVIDIA B200 GPU (1x)
- Model: Wan-AI/Wan2.2-T2V-A14B-Diffusers
- sglang diffusion version: 0.5.6.post2

### 5.1 Speedup Benchmark
#### 5.1.1 Generate a video
Example input: `A cat walks on the grass, realistic`

server command:
```
sglang generate \
  --model-path Wan-AI/Wan2.2-T2V-A14B-Diffusers \
  --text-encoder-cpu-offload   --pin-cpu-memory \
  --num-gpus 1 \
  --prompt "A cat walks on the grass, realistic" \
  --num-frames 81 \
  --height 720 \
  --width 1280 \
  --num-inference-steps 27
```
result:
```
```
