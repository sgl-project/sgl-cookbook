# Llama3.1 Usage Guide

## 1. Model Introduction

[Llama 3.1 70B Instruct](https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct) is a powerful open-weights language model developed by Meta, featuring advanced capabilities in reasoning, coding, and multilingual dialogue.

As a highly capable model in the Llama 3.1 family, the 70B Instruct version balances performance and efficiency, delivering state-of-the-art results across industrial benchmarks. It achieves comprehensive enhancements in long-context processing, tool use, and agentic workflows. Details are as follows:

- **Expanded context window**: The context window has been significantly increased to 128K tokens, enabling the model to process lengthy documents, maintain long conversation histories, and handle complex summarization tasks.
- **Superior coding performance**: The model demonstrates exceptional proficiency in code generation, debugging, and translation, achieving high scores on benchmarks like HumanEval and MBPP. It is optimized for diverse programming languages and complex software engineering tasks.
- **Advanced reasoning**: Llama 3.1 70B Instruct exhibits state-of-the-art reasoning capabilities, particularly in math (GSM8K) and general logic, allowing it to solve multi-step problems with high accuracy.
- **More capable agents**: The model is fine-tuned for robust tool use and function calling, allowing it to effectively orchestrate multi-step agentic workflows, query external APIs, and output structured JSON data reliably.
- **Multilingual mastery**: It supports eight languages (English, German, French, Italian, Portuguese, Hindi, Spanish, and Thai) with native-level fluency, making it highly effective for cross-lingual applications and global deployment.

For more details, please refer to the [official Llama 3.1 documentation](https://llama.meta.com/docs/model-cards-and-prompt-formats/llama3_1).

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

### 2.1 Docker Installation (Recommended)

Docker installation is the simplest and fastest method, requiring no complex dependency configuration.

```shell
docker pull lmsysorg/sglang:latest


docker run --gpus all \
    --ipc=host \
    -p 8000:8000 \
    -e HF_TOKEN=$YOUR_HF_TOKEN \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    --name llama-server \
    -it lmsysorg/sglang:latest bash
```

**Advantages:**

- Ready to use out of the box, no manual environment configuration needed
- Avoids dependency conflict issues
- Easy to migrate between different environments

**Use Cases:**

- Need to customize and modify SGLang source code
- Want to use the latest development features
- Participate in SGLang project development

For general installation instructions, you can also refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html).

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform and optimization mode.

import Llama31ConfigGenerator from '@site/src/components/Llama31ConfigGenerator';

<Llama31ConfigGenerator />

#### Manual Configuration Examples

##### H100 Platform (4x H100 on Single Machine)

**BF16 Precision:**

```shell
CUDA_VISIBLE_DEVICES=4,5,6,7 \
python3 -m sglang.launch_server \
    --model meta-llama/Llama-3.1-70B-Instruct \
    --tp 4 \
    --host 0.0.0.0 \
    --port 8000
```

##### Throughput Optimized Configuration

For maximum throughput in production environments, enable Data Parallel (DP) with attention optimization:

```shell
CUDA_VISIBLE_DEVICES=4,5,6,7 \
python -m sglang.launch_server \
  --model meta-llama/Llama-3.1-70B-Instruct \
  --tp 4 \
  --enable-dp-attention \
  --mem-fraction-static 0.85 \
  --host 0.0.0.0 \
  --port 8000
```

**Key Parameters for Throughput:**

- `--dp 4`: Data Parallel degree for attention only when `--enable-dp-attention` is set
- `--enable-dp-attention`: Enable DP attention mechanism for avoiding KV cache duplication
- `--mem-fraction-static 0.85`: Optimize GPU memory allocation

##### Latency Optimized Configuration

For low-latency applications, enable speculative decoding with EAGLE:

```shell
SGLANG_ENABLE_SPEC_V2=1 python -m sglang.launch_server \
  --model meta-llama/Llama-3.1-70B-Instruct \
  --tp 4 \
  --speculative-algorithm EAGLE \
  --speculative-num-steps 3 \
  --speculative-eagle-topk 1 \
  --speculative-num-draft-tokens 4 \
  --disable-shared-experts-fusion \
  --max-running-requests 64 \
  --mem-fraction-static 0.85 \
  --kv-cache-dtype fp8_e4m3 \
  --context-length 32768 \
  --quantization fp8 \
  --tensor-parallel-size 4 \
  --host 0.0.0.0 \
  --port 8000
```

**Key Parameters for Latency:**

- `--speculative-algorithm EAGLE`: Enable EAGLE speculative decoding
- `--speculative-num-steps 3`: Number of speculative verification rounds
- `--speculative-eagle-topk 1`: Top-k sampling for draft tokens
- `--speculative-num-draft-tokens 4`: Number of draft tokens per step
- `--max-running-requests 64`: Maximum number of concurrent requests

**TODO: Add more latency optimization tips and parameter tuning guidance**

### 3.4 Other Optimization Tips

#### Memory Optimization

**GPU Memory Management:**

- `--mem-fraction-static 0.85`: Control GPU memory allocation (recommended: 0.85-0.90 to avoid out-of-memory errors)
- `--kv-cache-dtype fp8_e4m3`: Reduce KV cache memory by 50% (requires CUDA 11.8+)
- `--cpu-offload-gigabytes 16`: Offload layers to CPU on low-VRAM GPUs to save GPU memory

**Context Length:**

- `--context-length 32768`: Set maximum sequence length to save memory by limiting sequence size
- Adjust based on your actual use case - shorter contexts use less memory

#### Quantization

**Model Quantization:**

- `--quantization fp8`: Online quantization to reduce memory usage and improve performance (works best with FP8 KV cache), don't recommend using it if official quantized model is available.

#### Parallel Deployment

**Tensor Parallelism:**

- `--tensor-parallel-size 4`: Split model across 4 GPUs for large models
- Adjust based on model size and available GPU memory

**Pipeline Parallelism:**

- `--pipeline-parallel-size 2`: Split model across layers for multi-node deployment
- Useful for very large models that don't fit on a single node

**GPU Resource Allocation:**

- `--base-gpu-id 1`: Specify starting GPU ID to avoid occupied GPUs in multi-instance setups

#### Service Configuration

**Network Settings:**

- `--host 0.0.0.0`: Allow LAN access (default: 127.0.0.1 for localhost only)
- `--port 8000`: Specify HTTP server port (default: 30000)

**API Security:**

- `--api-key my_secret_key`: Enable API key authentication to restrict model access

**gRPC Mode:**

- `--grpc-mode`: Enable gRPC server instead of HTTP for high-performance cross-service calls

#### Performance Optimization

**CUDA Graph:**

- `--disable-cuda-graph`: Disable CUDA Graph to speed up model loading (reduces inference speed)
- Only disable if you need faster startup time

**Speculative Decoding:**

- `--speculative-draft-model-path /path/to/draft`: Use a custom draft model for speculative decoding to boost throughput
- Example: `--speculative-draft-model-path /lmsys/vicuna-13b-v1.5`

#### Auxiliary Configuration

**Model Version:**

- `--revision v1.0`: Specify model version (branch/tag/commit ID) to load a designated model version

#### LoRA Support

**LoRA Adapters:**

- `--enable-lora`: Enable LoRA adapter support for fine-tuned LoRA models
- `--lora-paths /lora-adapter-1 /lora-adapter-2`: Specify paths to LoRA adapters for hot-swappable LoRAs
- `--max-loras-per-batch 8`: Set maximum number of LoRAs per batch for LoRA concurrency control

## 4. Benchmark

### 4.1 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA H100 GPU (4x)
- Model: Llama-3.1-70B-Instruct
- Tensor Parallelism: 4

We use SGLang's built-in benchmarking tool to conduct performance evaluation on the [ShareGPT_Vicuna_unfiltered](https://huggingface.co/datasets/anon8231489123/ShareGPT_Vicuna_unfiltered) dataset. This dataset contains real conversation data and can better reflect performance in actual use scenarios.

**Test Command:**

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --num-prompt 100 \
  --host 127.0.0.1 \
  --port 8000
```

**Test Results:**

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 not set
Successful requests:                     100
Benchmark duration (s):                  27.44
Total input tokens:                      33559
Total input text tokens:                 33559
Total input vision tokens:               0
Total generated tokens:                  21265
Total generated tokens (retokenized):    21189
Request throughput (req/s):              3.64
Input token throughput (tok/s):          1223.19
Output token throughput (tok/s):         775.09
Total token throughput (tok/s):          1998.28
Concurrency:                             15.04
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   4125.87
Median E2E Latency (ms):                 2857.44
---------------Time to First Token----------------
Mean TTFT (ms):                          201.32
Median TTFT (ms):                        184.07
P99 TTFT (ms):                           267.12
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          20.35
Median TPOT (ms):                        19.19
P99 TPOT (ms):                           35.65
---------------Inter-Token Latency----------------
Mean ITL (ms):                           18.58
Median ITL (ms):                         18.43
P95 ITL (ms):                            22.11
P99 ITL (ms):                            25.18
Max ITL (ms):                            78.05
==================================================
```

### 5.2 Accuracy Benchmark

**GSM8K Test:**

```shell
python3 -m sglang.test.few_shot_gsm8k --num-questions 200 --port 8000
```

**Results:**

```
Accuracy: 0.935
Invalid: 0.000
Latency: 6.915 s
Output throughput: 2560.502 token/s
```
