---
sidebar_position: 1
---

# MiniMax-M2.1/M2

## 1. Model Introduction

[MiniMax-M2.1](https://huggingface.co/MiniMaxAI/MiniMax-M2.1) and [MiniMax-M2](https://huggingface.co/MiniMaxAI/MiniMax-M2) are advanced large language models created by [MiniMax](https://www.minimax.io/).

MiniMax-M2 series redefines efficiency for agents. It's a compact, fast, and cost-effective MoE model (230 billion total parameters with 10 billion active parameters) built for elite performance in coding and agentic tasks, all while maintaining powerful general intelligence. With just 10 billion activated parameters, MiniMax-M2 provides the sophisticated, end-to-end tool use performance expected from today's leading models, but in a streamlined form factor that makes deployment and scaling easier than ever.

This guide applies to the following models. You only need to update the model name during deployment. The following examples use **MiniMax-M2**:

- [MiniMaxAI/MiniMax-M2.1](https://huggingface.co/MiniMaxAI/MiniMax-M2.1)
- [MiniMaxAI/MiniMax-M2](https://huggingface.co/MiniMaxAI/MiniMax-M2)

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

### 3.1 System Requirements

The following are recommended configurations; actual requirements should be adjusted based on your use case:

- 4x 96GB GPUs: Supported context length of up to 400K tokens.
- 8x 144GB GPUs: Supported context length of up to 3M tokens.

### 3.2 Basic Configuration

**Interactive Command Generator:** Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform and features.

import MiniMaxM2ConfigGenerator from '@site/src/components/autoregressive/MiniMaxM2ConfigGenerator';

<MiniMaxM2ConfigGenerator />

## 4. Model Invocation

### 4.1 Basic Usage

After startup, you can test the SGLang OpenAI-compatible API with the following command:

```bash
curl http://localhost:8000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "MiniMaxAI/MiniMax-M2",
        "messages": [
            {"role": "system", "content": [{"type": "text", "text": "You are a helpful assistant."}]},
            {"role": "user", "content": [{"type": "text", "text": "Who won the world series in 2020?"}]}
        ]
    }'
```

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: TODO
- Model: MiniMax-M2
- Tensor Parallelism: 8
- Expert Parallelism: 8

- Model Deployment Command:

```bash
python3 -m sglang.launch_server \
  --model-path MiniMaxAI/MiniMax-M2 \
  --tp 8 \
  --ep 8 \
  --reasoning-parser minimax-append-think \
  --tool-call-parser minimax-m2 \
  --trust-remote-code \
  --mem-fraction-static 0.85
```

#### 5.1.1 Latency-Sensitive Benchmark

- Benchmark Command:

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 8000 \
  --model MiniMaxAI/MiniMax-M2 \
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
  --model MiniMaxAI/MiniMax-M2 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 1000 \
  --max-concurrency 100
```

- **Test Results:** TODO

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

```bash
python3 benchmark/gsm8k/bench_sglang.py --port 8000
```

- **Test Results:** TODO

#### 5.2.2 MMLU Benchmark

```bash
python3 benchmark/mmlu/bench_sglang.py --port 8000
```

- **Test Results:** TODO
