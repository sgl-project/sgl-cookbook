---
sidebar_position: 1
---

# Llama4

## 1. Model Introduction

[Llama 4](https://github.com/meta-llama/llama-models/blob/main/models/llama4/MODEL_CARD.md) is Meta's latest generation of open-source LLM model with industry-leading performance.

SGLang has supported Llama 4 Scout (109B) and Llama 4 Maverick (400B) since [v0.4.5](https://github.com/sgl-project/sglang/releases/tag/v0.4.5).

Ongoing optimizations are tracked in the [Roadmap](https://github.com/sgl-project/sglang/issues/5118).

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

### 3.1 Basic Configuration

**Interactive Command Generator:** Use the configuration selector below to automatically generate the appropriate deployment command for your model variant, hardware platform, and features.

import Llama4ConfigGenerator from '@site/src/components/autoregressive/Llama4ConfigGenerator';

<Llama4ConfigGenerator />

### 3.2 Configuration Tips

- **OOM Mitigation**: Adjust `--context-length` to avoid a GPU out-of-memory issue. For the Scout model, we recommend setting this value up to 1M on 8\*H100 and up to 2.5M on 8\*H200. For the Maverick model, we don't need to set context length on 8\*H200. When hybrid kv cache is enabled, `--context-length` can be set up to 5M on 8\*H100 and up to 10M on 8\*H200 for the Scout model.

- **Attention Backend Auto-Selection**: SGLang automatically selects the optimal attention backend for Llama 4 based on your hardware. You typically don't need to specify `--attention-backend` manually:
  - **Blackwell GPUs (B200/GB200)**: `trtllm_mha`
  - **Hopper GPUs (H100/H200)**: `fa3`
  - **AMD GPUs**: `aiter`
  - **Intel XPU**: `intel_xpu`
  - **Other platforms**: `triton` (fallback)

  To override the auto-selection, explicitly specify `--attention-backend` with one of the supported backends: `fa3`, `aiter`, `triton`, `trtllm_mha`, or `intel_xpu`.

- **Chat Template**: Add `--chat-template llama-4` for chat completion tasks.
- **Enable Multi-Modal**: Add `--enable-multimodal` for multi-modal capabilities.
- **Enable Hybrid-KVCache**: Set `--swa-full-tokens-ratio` to adjust the ratio of SWA layer (for Llama4, it's local attention layer) KV tokens / full layer KV tokens. (default: 0.8, range: 0-1)
- **EAGLE Speculative Decoding** SGLang has supported Llama 4 Maverick (400B) with [EAGLE speculative decoding](https://docs.sglang.io/advanced_features/speculative_decoding.html#EAGLE-Decoding). Add arguments `--speculative-draft-model-path`, `--speculative-algorithm`, `--speculative-num-steps`, `--speculative-eagle-topk` and `--speculative-num-draft-tokens` to enable this feature. For example:

```bash
python3 -m sglang.launch_server \
  --model-path meta-llama/Llama-4-Maverick-17B-128E-Instruct \
  --speculative-algorithm EAGLE3 \
  --speculative-draft-model-path nvidia/Llama-4-Maverick-17B-128E-Eagle3 \
  --speculative-num-steps 3 \
  --speculative-eagle-topk 1 \
  --speculative-num-draft-tokens 4 \
  --trust-remote-code \
  --tp 8 \
  --context-length 1000000
```

**Note:** The Llama 4 draft model *nvidia/Llama-4-Maverick-17B-128E-Eagle3* can only recognize conversations in chat mode.

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: TODO
- Model: Llama-4-Scout-17B-16E-Instruct
- Tensor Parallelism: 8

#### 5.1.1 Latency-Sensitive Benchmark

- Model Deployment Command:

```bash
python3 -m sglang.launch_server \
  --model-path meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --tp 8 \
  --context-length 65536 \
  --host 0.0.0.0 \
  --port 8000
```

- Benchmark Command:

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 8000 \
  --model meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- **Test Results:** TODO

#### 5.1.2 Throughput-Sensitive Benchmark

- Benchmark Command:

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 8000 \
  --model meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 1000 \
  --max-concurrency 100
```

- **Test Results:** TODO

### 5.2 Accuracy Benchmark

The accuracy on SGLang for both Llama4 Scout and Llama4 Maverick can match the [official benchmark numbers](https://ai.meta.com/blog/llama-4-multimodal-intelligence/).

Benchmark results on MMLU Pro dataset with 8*H100:

|                    | Llama-4-Scout-17B-16E-Instruct | Llama-4-Maverick-17B-128E-Instruct  |
|--------------------|--------------------------------|-------------------------------------|
| Official Benchmark | 74.3                           | 80.5                                |
| SGLang             | 75.2                           | 80.7                                |

Commands:

```bash
# Llama-4-Scout-17B-16E-Instruct model
python -m sglang.launch_server \
  --model-path meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --port 30000 \
  --tp 8 \
  --mem-fraction-static 0.8 \
  --context-length 65536
lm_eval --model local-chat-completions --model_args model=meta-llama/Llama-4-Scout-17B-16E-Instruct,base_url=http://localhost:30000/v1/chat/completions,num_concurrent=128,timeout=999999,max_gen_toks=2048 --tasks mmlu_pro --batch_size 128 --apply_chat_template --num_fewshot 0

# Llama-4-Maverick-17B-128E-Instruct
python -m sglang.launch_server \
  --model-path meta-llama/Llama-4-Maverick-17B-128E-Instruct \
  --port 30000 \
  --tp 8 \
  --mem-fraction-static 0.8 \
  --context-length 65536
lm_eval --model local-chat-completions --model_args model=meta-llama/Llama-4-Maverick-17B-128E-Instruct,base_url=http://localhost:30000/v1/chat/completions,num_concurrent=128,timeout=999999,max_gen_toks=2048 --tasks mmlu_pro --batch_size 128 --apply_chat_template --num_fewshot 0
```

Details can be seen in [this PR](https://github.com/sgl-project/sglang/pull/5092).
