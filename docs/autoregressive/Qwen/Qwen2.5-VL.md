---
sidebar_position: 5
---

# Qwen2.5-VL

## 1. Model Introduction

[Qwen2.5-VL series](https://huggingface.co/collections/Qwen/qwen25-vl-66cee7455501d7126940800d) is a vision-language model from the Qwen team, offering significant improvements over its predecessor in understanding, reasoning, and multi-modal processing.

This generation delivers comprehensive upgrades across the board:

- **Enhanced Visual Understanding**: Strong performance in document understanding, chart analysis, and scene recognition.
- **Improved Reasoning**: Logical reasoning and mathematical problem-solving capabilities in multi-modal contexts.
- **Multiple Sizes**: Available in 3B, 7B, 32B, and 72B variants to suit different deployment needs.
- **ROCm Support**: Compatible with AMD MI300X, MI325X and MI355X GPUs via SGLang (verified).

For more details, please refer to the [official Qwen2.5-VL collection](https://huggingface.co/collections/Qwen/qwen25-vl-66cee7455501d7126940800d).

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for AMD MI300X, MI325X and MI355X hardware platforms and different use cases.

### 3.1 Basic Configuration

The Qwen2.5-VL series offers models in various sizes. The following configurations have been verified on AMD MI300X, MI325X and MI355X GPUs.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform and model size.

import Qwen25VLConfigGenerator from '@site/src/components/autoregressive/Qwen25VLConfigGenerator';

<Qwen25VLConfigGenerator />

### 3.2 Configuration Tips

* **Memory Management**: For the 72B model on MI300X/MI325X/MI355X, we have verified successful deployment with `--context-length 128000`. Smaller context lengths can be used to reduce memory usage if needed.
* **Multi-GPU Deployment**: Use Tensor Parallelism (`--tp`) to scale across multiple GPUs. For example, use `--tp 8` for the 72B model and `--tp 2` for the 32B model on MI300X/MI325X/MI355X.

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)
- [SGLang OpenAI Vision API Guide](https://docs.sglang.ai/basic_usage/openai_api_vision.html)

### 4.2 Advanced Usage

#### 4.2.1 Multi-Modal Inputs

Qwen2.5-VL supports image inputs. Here's a basic example with image input:

```python
import time
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:30000/v1",
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
    model="Qwen/Qwen2.5-VL-7B-Instruct",
    messages=messages,
    max_tokens=2048
)
print(f"Response costs: {time.time() - start:.2f}s")
print(f"Generated text: {response.choices[0].message.content}")
```

**Example Output:**

```text
Response costs: 2.31s
Generated text: Auntie Anne's

CINNAMON SUGAR
1 x 17,000
SUB TOTAL
17,000

GRAND TOTAL
17,000

CASH IDR
20,000

CHANGE DUE
3,000
```

**Multi-Image Input Example:**

Qwen2.5-VL can process multiple images in a single request for comparison or analysis:

```python
import time
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:30000/v1",
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
                "text": "Compare these two images and describe the differences in 100 words or less."
            }
        ]
    }
]

start = time.time()
response = client.chat.completions.create(
    model="Qwen/Qwen2.5-VL-7B-Instruct",
    messages=messages,
    max_tokens=2048
)
print(f"Response costs: {time.time() - start:.2f}s")
print(f"Generated text: {response.choices[0].message.content}")
```

**Example Output:**

```text
Response costs: 13.79s
Generated text: The first image shows a single red taxi driving on a street with a few other taxis in the background. The second image shows a large number of taxis parked in a lot, with some appearing to be in various states of repair. The first image has a single taxi with a visible license plate, while the second image has multiple taxis with different license plates. The first image has a clear view of the street and surrounding area, while the second image is taken from an elevated perspective, showing a wider view of the parking lot and the surrounding area.
```

**Note:**

- You can also provide local file paths using `file://` protocol
- For larger images, you may need more memory; adjust `--mem-fraction-static` accordingly

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: AMD MI300X GPU (8x)
- Model: Qwen2.5-VL-72B-Instruct
- Tensor Parallelism: 8
- Context Length: 128000

We use SGLang's built-in benchmarking tool to conduct performance evaluation with random images. Each request has 128 input tokens, two 720p images, and 1024 output tokens.

#### 5.1.1 Latency-Sensitive Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen2.5-VL-72B-Instruct \
  --tp 8 \
  --context-length 128000
```

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model Qwen/Qwen2.5-VL-72B-Instruct \
  --dataset-name image \
  --image-count 2 \
  --image-resolution 720p \
  --random-input-len 128 \
  --random-output-len 1024 \
  --num-prompts 10 \
  --max-concurrency 1
```

- **Test Results:**

```
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  92.78
Total input tokens:                      24776
Total input text tokens:                 816
Total input vision tokens:               23960
Total generated tokens:                  4220
Total generated tokens (retokenized):    2449
Request throughput (req/s):              0.11
Input token throughput (tok/s):          267.04
Output token throughput (tok/s):         45.48
Peak output token throughput (tok/s):    107.00
Peak concurrent requests:                2
Total token throughput (tok/s):          312.52
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   9274.21
Median E2E Latency (ms):                 5031.18
---------------Time to First Token----------------
Mean TTFT (ms):                          5333.48
Median TTFT (ms):                        826.35
P99 TTFT (ms):                           41852.91
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          9.37
Median TPOT (ms):                        9.36
P99 TPOT (ms):                           9.41
---------------Inter-Token Latency----------------
Mean ITL (ms):                           11.98
Median ITL (ms):                         9.38
P95 ITL (ms):                            18.74
P99 ITL (ms):                            18.80
Max ITL (ms):                            34.51
==================================================
```

#### 5.1.2 Throughput-Sensitive Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen2.5-VL-72B-Instruct \
  --tp 8 \
  --context-length 128000
```

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model Qwen/Qwen2.5-VL-72B-Instruct \
  --dataset-name image \
  --image-count 2 \
  --image-resolution 720p \
  --random-input-len 128 \
  --random-output-len 1024 \
  --num-prompts 100 \
  --max-concurrency 100
```

- **Test Results:**

```
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 100
Successful requests:                     100
Benchmark duration (s):                  96.18
Total input tokens:                      247998
Total input text tokens:                 8398
Total input vision tokens:               239600
Total generated tokens:                  52444
Total generated tokens (retokenized):    36606
Request throughput (req/s):              1.04
Input token throughput (tok/s):          2578.41
Output token throughput (tok/s):         545.26
Peak output token throughput (tok/s):    4693.00
Peak concurrent requests:                100
Total token throughput (tok/s):          3123.67
Concurrency:                             92.75
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   89207.18
Median E2E Latency (ms):                 89901.46
---------------Time to First Token----------------
Mean TTFT (ms):                          62327.44
Median TTFT (ms):                        63882.97
P99 TTFT (ms):                           78659.14
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          83.63
Median TPOT (ms):                        48.94
P99 TPOT (ms):                           689.88
---------------Inter-Token Latency----------------
Mean ITL (ms):                           60.74
Median ITL (ms):                         19.55
P95 ITL (ms):                            38.11
P99 ITL (ms):                            83.48
Max ITL (ms):                            73751.40
==================================================
```

### 5.2 Accuracy Benchmark

**Test Environment:**

- Hardware: AMD MI300X GPU (8x)
- Model: Qwen2.5-VL-72B-Instruct
- Tensor Parallelism: 8

#### 5.2.1 MMMU Benchmark

You can evaluate the model's accuracy using the MMMU dataset:

- Benchmark Command:

```shell
cd benchmark/mmmu && python bench_sglang.py --concurrency 16
```

- **Test Results:**

```
| Category                       | Accuracy | Samples |
|--------------------------------|----------|---------|
| Overall                        |    0.620 |     900 |
| Art and Design                 |    0.717 |     120 |
| Business                       |    0.653 |     150 |
| Health and Medicine            |    0.680 |     150 |
| Humanities and Social Science  |    0.767 |     120 |
| Science                        |    0.567 |     150 |
| Tech and Engineering           |    0.452 |     210 |
```
