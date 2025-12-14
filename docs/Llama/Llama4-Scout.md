# Llama 4-Scout

## 1. Model Introduction

[Llama-4-Scout-17B-16E-Instruct](https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct) is the lightweight MoE multimodal variant in the Llama-4 family, designed for fast inference, strong vision-language reasoning, and stable long-context behavior.

It builds on the core architectural upgrades of [Llama-4](https://huggingface.co/meta-llama) while optimizing for serving efficiency.

This generation delivers focused upgrades:

- **MoE-efficient inference** — Sparse expert routing significantly reduces per-token compute.
- **Multimodal early fusion** — Unified image–text token processing improves grounding and reasoning.
- **Long-context stability** — iRoPE + inference-time attention scaling enhances consistency in extended-context workflows.
- **Speculative-decoding readiness** — Architecturally aligned with Eagle-class draft models for SGLang high-throughput pipelines.
- **Flexible deployment** — Supports INT4/BF16 inference and single-GPU H100-class serving.

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.io/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, quantization method, tool calling, and speculative decoding options.

import Llama4ScoutConfigGenerator from '@site/src/components/Llama4ScoutConfigGenerator';

<Llama4ScoutConfigGenerator />

### 3.2 Configuration Tips

- **Attention Backend Auto-Selection**: SGLang automatically selects the optimal attention backend for Llama 4 based on your hardware. You typically don't need to specify `-attention-backend` manually:

  - **Blackwell GPUs (B200/GB200)**: `trtllm_mha`
  - **Hopper GPUs (H100/H200)**: `fa3`
  - **AMD GPUs**: `aiter`
  - **Intel XPU**: `intel_xpu`
  - **Other platforms**: `triton` (fallback)

  To override the auto-selection, explicitly specify `--attention-backend` with one of the supported backends: `fa3`, `aiter`, `triton`, `trtllm_mha`, or `intel_xpu`.

- **OOM Mitigation**: Adjust`--context-length` and `--tp`to avoid a GPU out-of-memory issue. For the Scout model, we recommend setting `context-length` up to **1M on 8×H100** and **2.5M on 8×H200**. With **hybrid KV cache enabled** (`hybrid-kvcache-ratio`), this can scale to **5M on** 8x**H100** and **10M on** 8x**H200.**
- **TTFT Optimization:** Set `SGLANG_USE_CUDA_IPC_TRANSPORT=1` to use CUDA IPC for transferring multimodal features, which can noticeably reduce TTFT in multimodal workloads. This consumes additional GPU memory and may require adjusting `--mem-fraction-static` and/or `--max-running-requests` (extra memory is roughly proportional to image size × number of images in running requests).
- **Enable Hybrid-KVCache**: Add `--hybrid-kvcache-ratio` for hybrid kv cache(required for extended context). Details can be seen in [this PR](https://github.com/sgl-project/sglang/pull/6563).

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.io/basic_usage/send_request.html)
- [SGLang OpenAI Vision API Guide](https://docs.sglang.io/basic_usage/openai_api_vision.html)

### 4.2 Advanced Usage

#### 4.2.1 Multi-Modal Inputs

Llama 4-Scout supports both image and text inputs. Here's a basic example with image input:

```python
import time
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:8000/v1",
    timeout=3600
)

messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {
                    "url": "https://ofasys-multimodal-wlcb-3-toshanghai.oss-accelerate.aliyuncs.com/wpf272043/keepme/image/receipt.png"
                }
            },
            {
                "type": "text",
                "text": "Read all the text in the image."
            }
        ]
    }
]

start = time.time()

response = client.chat.completions.create(
    model="meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages=messages,
    max_tokens=256
)

print(f"Response costs: {time.time() - start:.2f}s")
print("Generated text:", response.choices[0].message.content)
```

**Example Output:**

```python
Response costs: 4.03s
Generated text: The text in the image reads:

Auntie Anne's

[Censored information]

CINNAMON SUGAR
1 x 17,000    17,000

SUB TOTAL                   17,000
GRAND TOTAL                 17,000
CASH IDR                    20,000
CHANGE DUE                  3,000

[Censored information]
```

**Multi-Image Input Example:**

Llama 4-Scout can process multiple images in a single request for comparison or analysis:

```python
import time
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:8000/v1",
    timeout=3600
)

messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {
                    "url": "https://www.civitatis.com/f/china/hong-kong/guia/taxi.jpg"
                }
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": "https://cdn.cheapoguides.com/wp-content/uploads/sites/7/2025/05/GettyImages-509614603-1280x600.jpg"
                }
            },
            {
                "type": "text",
                "text": (
                    "Compare these two images and describe the differences "
                    "in 100 words or less. Focus on key visual elements."
                )
            }
        ]
    }
]

start = time.time()

response = client.chat.completions.create(
    model="meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages=messages,
    max_tokens=512
)

print(f"Response time: {time.time() - start:.2f}s")
print("Generated text:", response.choices[0].message.content)
```

**Example Output:**

```python
Response time: 3.83s
Generated text: The two images depict taxis in different settings. The first image shows a close-up of three red taxis with black and white accents, driving on a city street. In contrast, the second image presents an aerial view of numerous taxis, including red, green, and white ones, parked or driving on a busy road. The main differences between the images are the perspective (close-up vs. aerial), the number of taxis (three vs. many), and their colors (primarily red vs. multiple colors). Additionally, the background scenery varies significantly, with a storefront visible in the first image and a highway or overpass in the second.
```

#### 4.2.2 Tool Calling

Llama 4-Scout supports tool calling capabilities with `--tool-call-parser pythonic`.

```python
python -m sglang.launch_server \
	--model-path meta-llama/Llama-4-Scout-17B-16E-Instruct \
	--tp 8 \
	--host 0.0.0.0 \
	--port 8000 \
	--enable-multimodal \
	--tool-call-parser pythonic \
	--context-length 65536
```

**Python Example:**

```python
from openai import OpenAI
import json

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="EMPTY"
)

# Define available tools (OpenAI-style)
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a given city",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city name"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Temperature unit"
                    }
                },
                "required": ["location"]
            }
        }
    }
]

# Send a chat completion request
response = client.chat.completions.create(
    model="meta-llama/Llama-4-Scout-17B-16E-Instruct",
    messages=[
        {
            "role": "user",
            "content": "What's the weather in Beijing in celsius?"
        }
    ],
    tools=tools,
    temperature=0.0,
)

# Inspect model response
message = response.choices[0].message

if message.tool_calls:
    for call in message.tool_calls:
        print(f"🔧 Tool Call: {call.function.name}")
        print("Arguments:")
        print(json.loads(call.function.arguments))
else:
    print("💬 Model response:")
    print(message.content)
```

**Output Example:**

```python
🔧 Tool Call: get_weather
	Arguments: {'location': 'Beijing', 'unit': 'celsius'}
```

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA H200 GPU (8x)
- Model: `Llama-4-Scout-17B-16E-Instruct`
- Tensor Parallelism: 8

We use SGLang's built-in benchmarking tool to evaluate performance with random multimodal requests. For example, each request can include 2×720p images, 128 text input tokens, and 1024 output tokens.

#### 5.1.1 Latency-Sensitive Benchmark

• Model Deployment Command:

```python
python -m sglang.launch_server \
  --model-path meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --tp 8 \
  --context-length 8192 \
  --dtype bfloat16 \
  --trust-remote-code \
  --enable-multimodal \
  --host 0.0.0.0 \
  --port 8000
```

• Benchmark Command:

```
python -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --host 127.0.0.1 \
  --port 8000 \
  --model meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --dataset-name image \
  --image-count 2 \
  --image-resolution 720p \
  --random-input-len 128 \
  --random-output-len 1024 \
  --num-prompts 10 \
  --max-concurrency 1
```

• Test Results:

```python
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  45.96
Total input tokens:                      38470
Total input text tokens:                 723
Total input vision tokens:               37747
Total generated tokens:                  4220
Total generated tokens (retokenized):    4175
Request throughput (req/s):              0.22
Input token throughput (tok/s):          836.98
Output token throughput (tok/s):         91.81
Peak output token throughput (tok/s):    105.00
Peak concurrent requests:                2
Total token throughput (tok/s):          928.79
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   4594.23
Median E2E Latency (ms):                 3683.71
---------------Time to First Token----------------
Mean TTFT (ms):                          393.71
Median TTFT (ms):                        371.41
P99 TTFT (ms):                           612.67
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          9.88
Median TPOT (ms):                        9.87
P99 TPOT (ms):                           10.15
---------------Inter-Token Latency----------------
Mean ITL (ms):                           10.09
Median ITL (ms):                         9.90
P95 ITL (ms):                            10.56
P99 ITL (ms):                            14.32
Max ITL (ms):                            31.79
==================================================
```

#### 5.1.2 Throughput-Sensitive Benchmark

Model Deployment Command:

```python
python -m sglang.launch_server \
  --model-path meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --tp 8 \
  --context-length 8192 \
  --dtype bfloat16 \
  --trust-remote-code \
  --enable-multimodal \
  --host 0.0.0.0 \
  --port 8000
```

Benchmark Command:

```python
python -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --host 127.0.0.1 \
  --port 8000 \
  --model meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --dataset-name image \
  --image-count 2 \
  --image-resolution 720p \
  --random-input-len 128 \
  --random-output-len 1024 \
  --num-prompts 100 \
  --max-concurrency 4
```

• Test Results:

```python
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 4
Successful requests:                     100
Benchmark duration (s):                  308.72
Total input tokens:                      384866
Total input text tokens:                 7426
Total input vision tokens:               377440
Total generated tokens:                  52444
Total generated tokens (retokenized):    50538
Request throughput (req/s):              0.32
Input token throughput (tok/s):          1246.67
Output token throughput (tok/s):         169.88
Peak output token throughput (tok/s):    206.00
Peak concurrent requests:                7
Total token throughput (tok/s):          1416.55
Concurrency:                             3.96
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   12232.71
Median E2E Latency (ms):                 12290.30
---------------Time to First Token----------------
Mean TTFT (ms):                          560.15
Median TTFT (ms):                        400.46
P99 TTFT (ms):                           3620.83
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          22.22
Median TPOT (ms):                        22.19
P99 TPOT (ms):                           27.17
---------------Inter-Token Latency----------------
Mean ITL (ms):                           23.14
Median ITL (ms):                         20.85
P95 ITL (ms):                            22.37
P99 ITL (ms):                            81.66
Max ITL (ms):                            1703.10
==================================================
```

**Optimized Results (EAGLE3 Speculative Decoding)**

[EAGLE-3](https://huggingface.co/lmsys/sglang-EAGLE3-Llama-4-Scout-17B-16E-Instruct-v1) is the draft model for Llama-4-Scout-17B-16E speculative decoding, trained via SpecForge on UltraChat and ShareGPT.
For more details, see the [SGLang speculative decoding documentation](https://docs.sglang.io/advanced_features/speculative_decoding.html#EAGLE-Decoding).

Model Deployment Command:

```bash
python3 -m sglang.launch_server \
    --model-path meta-llama/Llama-4-Scout-17B-16E-Instruct  \
    --speculative-algorithm EAGLE3 \
    --speculative-draft-model-path lmsys/sglang-EAGLE3-Llama-4-Scout-17B-16E-Instruct-v1 \
    --speculative-num-steps 3 \
    --speculative-eagle-topk 1 \
    --speculative-num-draft-tokens 4 \
    --mem-fraction-static 0.75 \
    --cuda-graph-max-bs 2 \
    --tp 8 \
    --context-length 8192 \
    --host 0.0.0.0 \
    --port 8000 \
    --dtype bfloat16 \
    --trust-remote-code
```

Benchmark Command:

```python
python -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --host 127.0.0.1 \
  --port 8000 \
  --model meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --dataset-name image \
  --image-count 2 \
  --image-resolution 720p \
  --random-input-len 128 \
  --random-output-len 1024 \
  --num-prompts 100 \
  --max-concurrency 4
```

• Test Results:

```python
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 4
Successful requests:                     100
Benchmark duration (s):                  438.38
Total input tokens:                      384899
Total input text tokens:                 7453
Total input vision tokens:               377446
Total generated tokens:                  52444
Total generated tokens (retokenized):    51367
Request throughput (req/s):              0.23
Input token throughput (tok/s):          878.01
Output token throughput (tok/s):         119.63
Peak output token throughput (tok/s):    112.00
Peak concurrent requests:                6
Total token throughput (tok/s):          997.65
Concurrency:                             3.98
Accept length:                           1.90
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   17465.62
Median E2E Latency (ms):                 17904.50
---------------Time to First Token----------------
Mean TTFT (ms):                          173.40
Median TTFT (ms):                        128.26
P99 TTFT (ms):                           973.19
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          34.38
Median TPOT (ms):                        32.31
P99 TPOT (ms):                           52.95
---------------Inter-Token Latency----------------
Mean ITL (ms):                           33.73
Median ITL (ms):                         30.08
P95 ITL (ms):                            62.32
P99 ITL (ms):                            65.00
Max ITL (ms):                            1029.08
==================================================
```

**Note:**

- When running EAGLE3 with extended context lengths, set`export SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1`
  to allow speculative decoding to override the model's default context limit.

## 5.2 Accuracy Benchmark

### 5.2.1 MMLU-Pro Benchmark

You can evaluate the model's accuracy on the MMLU-Pro benchmark using `lm_eval`:
• Model Deployment Command:

```
python -m sglang.launch_server \
  --model-path meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --port 8000 \
  --tp 8 \
  --mem-fraction-static 0.8 \
  --context-length 8192
```

• Benchmark Command:

```python
uv pip install lm_eval

python3 -m lm_eval \
  --model local-chat-completions \
  --model_args model=meta-llama/Llama-4-Scout-17B-16E-Instruct,base_url=http://127.0.0.1:8000/v1/chat/completions,num_concurrent=128,timeout=999999,max_gen_toks=2048 \
  --tasks mmlu_pro \
  --batch_size 128 \
  --apply_chat_template \
  --num_fewshot 0
```

• Test Results:

```python
|       Tasks       |Version|    Filter    |n-shot|  Metric   |   |Value |   |Stderr|
|-------------------|------:|--------------|-----:|-----------|---|-----:|---|-----:|
|mmlu_pro           |    2.0|custom-extract|      |exact_match|↑  |0.7486|±  |0.0039|
| - biology         |    2.1|custom-extract|     0|exact_match|↑  |0.8675|±  |0.0127|
| - business        |    2.1|custom-extract|     0|exact_match|↑  |0.7820|±  |0.0147|
| - chemistry       |    2.1|custom-extract|     0|exact_match|↑  |0.8039|±  |0.0118|
| - computer_science|    2.1|custom-extract|     0|exact_match|↑  |0.7585|±  |0.0212|
| - economics       |    2.1|custom-extract|     0|exact_match|↑  |0.8329|±  |0.0128|
| - engineering     |    2.1|custom-extract|     0|exact_match|↑  |0.6533|±  |0.0153|
| - health          |    2.1|custom-extract|     0|exact_match|↑  |0.7359|±  |0.0154|
| - history         |    2.1|custom-extract|     0|exact_match|↑  |0.6247|±  |0.0248|
| - law             |    2.1|custom-extract|     0|exact_match|↑  |0.5195|±  |0.0151|
| - math            |    2.1|custom-extract|     0|exact_match|↑  |0.8364|±  |0.0101|
| - other           |    2.1|custom-extract|     0|exact_match|↑  |0.7132|±  |0.0149|
| - philosophy      |    2.1|custom-extract|     0|exact_match|↑  |0.6573|±  |0.0213|
| - physics         |    2.1|custom-extract|     0|exact_match|↑  |0.8106|±  |0.0109|
| - psychology      |    2.1|custom-extract|     0|exact_match|↑  |0.7882|±  |0.0145|

| Groups |Version|    Filter    |n-shot|  Metric   |   |Value |   |Stderr|
|--------|------:|--------------|------|-----------|---|-----:|---|-----:|
|mmlu_pro|      2|custom-extract|      |exact_match|↑  |0.7486|±  |0.0039|
```
