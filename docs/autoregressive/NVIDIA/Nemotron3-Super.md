# NVIDIA Nemotron3-Super

## 1. Model Introduction

`NVIDIA Nemotron3-Super` is a hybrid LLM from NVIDIA that combines Mixture-of-Experts (MoE) feed-forward layers, Mamba2 sequence-modeling layers, and standard self-attention layers in a single stack, enabling efficient and high-quality inference.

<!-- TODO: Update model description, parameter count, and architecture details once the model is publicly available. -->

At a high level:

- **Hybrid layer stack (Mamba2 + MoE + attention):** The network is composed of interleaved layers that are *either* Mamba2, *or* MoE feed-forward, *or* attention-only.
- **Non-uniform layer ordering:** The order and mix of these specialized layers is not a simple, rigid pattern, enabling the model to trade off sequence modeling, routing capacity, and expressivity across depth.
- **Deployment-friendly precision:** Use BF16 for accuracy-sensitive and evaluation workloads; use FP8 for latency- and throughput-critical serving on recent NVIDIA GPUs.

> **Note:** The public model name will be updated once it is officially released. The placeholder model path used in this guide is `nvidia/nemotron-super-sft-020426`.


## 2. SGLang Installation

Refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html), or install via:
```bash
pip install sglang
```


## 3. Model Deployment

This section provides a progressive guide from quick deployment to performance tuning.

### 3.1 Basic Configuration

**Interactive Command Generator**: select hardware, tensor parallelism, and common knobs to generate a launch command.

import NemotronSuperConfigGenerator from '@site/src/components/autoregressive/NemotronSuperConfigGenerator';

<NemotronSuperConfigGenerator />

### 3.2 Configuration Tips

- **Attention backend**:

    **H200/B200**: use flashinfer attention backend by default.

- **TP support**:

    To set tp size, use `--tp <1|2|4|8>`.

- **FP8 KV cache**:

    To enable fp8 kv cache, please append `--kv-cache-dtype fp8_e4m3`.


## 4. Model Invocation

### 4.1 Basic Usage (OpenAI-Compatible API)

SGLang provides an OpenAI-compatible endpoint. Example with the OpenAI Python client:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY",
)

resp = client.chat.completions.create(
    model="nvidia/nemotron-super-sft-020426",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Summarize what MoE models are in 5 bullets."},
    ],
    max_tokens=256,
)

print(resp.choices[0].message.content)
```

Streaming chat completion:
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY",
)

stream = client.chat.completions.create(
    model="nvidia/nemotron-super-sft-020426",
    messages=[
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "What are the first 5 prime numbers?"}
    ],
    max_tokens=1024,
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta
    if delta and delta.content:
        print(delta.content, end="", flush=True)
```

### 4.2 Reasoning

To enable reasoning, `--reasoning-parser nano_v3` should be appended to the launching command. The model supports two modes — Reasoning ON (default) vs OFF. This can be toggled by setting `enable_thinking` to `False`, as shown below.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY",
)

# Reasoning on (default)
print("Reasoning on")
resp = client.chat.completions.create(
    model="nvidia/nemotron-super-sft-020426",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Write a haiku about GPUs."}
    ],
    max_tokens=512,
)
print(resp.choices[0].message.reasoning_content)

# Reasoning off
print("Reasoning off")
resp = client.chat.completions.create(
    model="nvidia/nemotron-super-sft-020426",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Write a haiku about GPUs."}
    ],
    max_tokens=256,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}}
)
print(resp.choices[0].message.content)
```

### 4.3 Tool Calling

To enable tool calling, `--tool-call-parser qwen3_coder` should be appended to the launching command. Call functions using the OpenAI Tools schema and inspect returned `tool_calls`.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY",
)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate_tip",
            "parameters": {
                "type": "object",
                "properties": {
                    "bill_total": {
                        "type": "integer",
                        "description": "The total amount of the bill"
                    },
                    "tip_percentage": {
                        "type": "integer",
                        "description": "The percentage of tip to be applied"
                    }
                },
                "required": ["bill_total", "tip_percentage"]
            }
        }
    }
]

completion = client.chat.completions.create(
    model="nvidia/nemotron-super-sft-020426",
    messages=[
        {"role": "system", "content": ""},
        {"role": "user", "content": "My bill is $50. What will be the amount for 15% tip?"}
    ],
    tools=TOOLS,
    max_tokens=512,
    stream=False
)

print(completion.choices[0].message.reasoning_content)
print(completion.choices[0].message.tool_calls)
```

---

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: TODO

- Model Deployment Command:

```shell
python3 -m sglang.launch_server \
  --model-path nvidia/nemotron-super-sft-020426 \
  --trust-remote-code \
  --max-running-requests 1024 \
  --host 0.0.0.0 \
  --port 30000
```

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 30000 \
  --model nvidia/nemotron-super-sft-020426 \
  --dataset-name random \
  --random-input-len 1024 \
  --random-output-len 1024 \
  --num-prompts 4096 \
  --max-concurrency 256
```

- **Test Results:**

```
TODO
```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

**Environment**
- Hardware: TODO
- Model: TODO

**Launch Model**
```bash
python3 -m sglang.launch_server \
  --model-path nvidia/nemotron-super-sft-020426 \
  --trust-remote-code \
  --reasoning-parser nano_v3
```

**Run Benchmark**
```bash
python3 benchmark/gsm8k/bench_sglang.py --port 30000
```

**Test Results:**
```
TODO
```

#### 5.2.2 MMLU Benchmark

**Run Benchmark**
```bash
python3 benchmark/mmlu/bench_sglang.py --port 30000
```

**Test Results:**
```
TODO
```
