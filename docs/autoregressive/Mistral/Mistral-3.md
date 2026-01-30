
# Mistral 3

## AMD GPU Support

## 1. Model Introduction

Today, we announce Mistral 3, the next generation of Mistral models. Mistral 3 includes three state-of-the-art small, dense models (14B, 8B, and 3B) and Mistral Large 3 – our most capable model to date – a sparse mixture-of-experts trained with 41B active and 675B total parameters. All models are released under the Apache 2.0 license. Open-sourcing our models in a variety of compressed formats empowers the developer community and puts AI in people’s hands through distributed intelligence.

The Ministral models represent the best performance-to-cost ratio in their category. At the same time, Mistral Large 3 joins the ranks of frontier instruction-fine-tuned open-source models.



**Key Features:**

The Ministral-3 Instruct model offers the following capabilities:

Vision: Enables the model to analyze images and provide insights based on visual content, in addition to text.
Multilingual: Supports dozens of languages, including English, French, Spanish, German, Italian, Portuguese, Dutch, Chinese, Japanese, Korean, Arabic.
System Prompt: Maintains strong adherence and support for system prompts.
Agentic: Offers best-in-class agentic capabilities with native function calling and JSON outputting.
Edge-Optimized: Delivers best-in-class performance at a small scale, deployable anywhere.
Apache 2.0 License: Open-source license allowing usage and modification for both commercial and non-commercial purposes.
Large Context Window: Supports a 256k context window.




- **Hardware Optimization**: Specifically tuned for  AMD MI300X GPUs
- **High Performance**: Optimized for both throughput and latency scenarios

**Available Models:**

- **FP8 (8-bit quantized)**: [huggingface: mistralai/Ministral-3-14B-Instruct-2512] , [huggingface: mistralai/Ministral-3-8B-Instruct-2512]- Recommended for MI300X.


**License:**
This model is licensed under a Modified MIT License.



## 2. SGLang Installation

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model variant, deployment strategy, and thinking capabilities.

import Ministral3ConfigGenerator from '@site/src/components/autoregressive/Ministral3ConfigGenerator';


<Ministral3ConfigGenerator />

### 3.2 Configuration Tips
For more detailed configuration tips, please refer to [Mistral-3 Usage](https://cookbook.sglang.io/docs/autoregressive/Mistral/Mistral-3).

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

### 4.2 Advanced Usage

#### 4.2.1
```shell
docker pull lmsysorg/sglang:v0.5.7-rocm700-mi30x
```

```shell
docker run -d -it --ipc=host --network=host --privileged \
  --cap-add=CAP_SYS_ADMIN \
  --device=/dev/kfd --device=/dev/dri --device=/dev/mem \
  --group-add video --cap-add=SYS_PTRACE \
  --security-opt seccomp=unconfined \
  -v /:/work \
  -e SHELL=/bin/bash \
  --name Ministral \
  lmsysorg/sglang:v0.5.7-rocm700-mi30x \
  /bin/bash
```

#### 4.2.2 Pre-installation steps inside the docker

```shell
pip install mistral-common --upgrade
pip install transformers==5.0.0.rc0
```


#### 4.2.3 Launch the server
```shell
python3 -m sglang.launch_server \
  --model-path mistralai/Ministral-3-14B-Instruct-2512 \
  --tp 1 \
  --trust-remote-code
```



## 5. Benchmark

This section uses **industry-standard configurations** for comparable benchmark results.

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: MI300X GPU (8x)
- Model: mistralai/Ministral-3-14B-Instruct-2512
- Tensor Parallelism: 1
- SGLang Version: 0.5.7

**Benchmark Methodology:**

We use industry-standard benchmark configurations to ensure results are comparable across frameworks and hardware platforms.

#### 5.1.1 Standard Test Scenarios

Three core scenarios reflect real-world usage patterns:

| Scenario          | Input Length | Output Length | Use Case                                      |
| ----------------- | ------------ | ------------- | --------------------------------------------- |
| **Chat**          | 1K           | 1K            | Most common conversational AI workload        |
| **Reasoning**     | 1K           | 8K            | Long-form generation, complex reasoning tasks |
| **Summarization** | 8K           | 1K            | Document summarization, RAG retrieval         |

#### 5.1.2 Concurrency Levels

Test each scenario at different concurrency levels to capture the throughput vs. latency trade-off:

- **Low Concurrency**: `--max-concurrency 1` (Latency-optimized)
- **Medium Concurrency**: `--max-concurrency 16` (Balanced)
- **High Concurrency**: `--max-concurrency 100` (Throughput-optimized)

#### 5.1.3 Number of Prompts

For each concurrency level, configure `num_prompts` to simulate realistic user loads:

- **Quick Test**: `num_prompts = concurrency × 1` (minimal test)
- **Recommended**: `num_prompts = concurrency × 5` (standard benchmark)
- **Stable Measurements**: `num_prompts = concurrency × 10` (production-grade)

---

#### 5.1.4 Benchmark Commands

**Scenario 1: Chat (1K/1K) - Most Important**

- **Model Deployment**

```bash
python3 -m sglang.launch_server \
  --model-path mistralai/Ministral-3-14B-Instruct-2512 \
  --tp 1 \
  --trust-remote-code
```

- Low Concurrency (Latency-Optimized)

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model mistralai/Ministral-3-14B-Instruct-2512 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  65.08
Total input tokens:                      6101
Total input text tokens:                 6101
Total input vision tokens:               0
Total generated tokens:                  4220
Total generated tokens (retokenized):    4218
Request throughput (req/s):              0.15
Input token throughput (tok/s):          93.75
Output token throughput (tok/s):         64.84
Peak output token throughput (tok/s):    151.00
Peak concurrent requests:                2
Total token throughput (tok/s):          158.59
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   6505.51
Median E2E Latency (ms):                 3037.37
---------------Time to First Token----------------
Mean TTFT (ms):                          3709.33
Median TTFT (ms):                        53.72
P99 TTFT (ms):                           33320.77
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          6.63
Median TPOT (ms):                        6.64
P99 TPOT (ms):                           6.66
---------------Inter-Token Latency----------------
Mean ITL (ms):                           6.64
Median ITL (ms):                         6.65
P95 ITL (ms):                            6.75
P99 ITL (ms):                            6.82
Max ITL (ms):                            8.45
==================================================
```

- Medium Concurrency (Balanced)

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model mistralai/Ministral-3-14B-Instruct-2512 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  31.20
Total input tokens:                      39668
Total input text tokens:                 39668
Total input vision tokens:               0
Total generated tokens:                  40805
Total generated tokens (retokenized):    40783
Request throughput (req/s):              2.56
Input token throughput (tok/s):          1271.38
Output token throughput (tok/s):         1307.82
Peak output token throughput (tok/s):    1760.00
Peak concurrent requests:                22
Total token throughput (tok/s):          2579.20
Concurrency:                             13.72
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   5351.07
Median E2E Latency (ms):                 5626.45
---------------Time to First Token----------------
Mean TTFT (ms):                          280.87
Median TTFT (ms):                        68.16
P99 TTFT (ms):                           1194.79
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          10.47
Median TPOT (ms):                        10.10
P99 TPOT (ms):                           20.00
---------------Inter-Token Latency----------------
Mean ITL (ms):                           9.96
Median ITL (ms):                         9.10
P95 ITL (ms):                            9.87
P99 ITL (ms):                            51.39
Max ITL (ms):                            888.63
==================================================
```

- High Concurrency (Throughput-Optimized)

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model mistralai/Ministral-3-14B-Instruct-2512 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 500 \
  --max-concurrency 100 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 100
Successful requests:                     500
Benchmark duration (s):                  88.75
Total input tokens:                      249831
Total input text tokens:                 249831
Total input vision tokens:               0
Total generated tokens:                  252662
Total generated tokens (retokenized):    252547
Request throughput (req/s):              5.63
Input token throughput (tok/s):          2815.01
Output token throughput (tok/s):         2846.91
Peak output token throughput (tok/s):    4271.00
Peak concurrent requests:                110
Total token throughput (tok/s):          5661.93
Concurrency:                             93.04
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   16514.45
Median E2E Latency (ms):                 15834.45
---------------Time to First Token----------------
Mean TTFT (ms):                          148.57
Median TTFT (ms):                        99.15
P99 TTFT (ms):                           455.86
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          32.93
Median TPOT (ms):                        34.73
P99 TPOT (ms):                           38.05
---------------Inter-Token Latency----------------
Mean ITL (ms):                           32.45
Median ITL (ms):                         27.30
P95 ITL (ms):                            71.73
P99 ITL (ms):                            73.45
Max ITL (ms):                            328.10
==================================================
```


#### 5.1.5 Understanding the Results

**Key Metrics:**

- **Request Throughput (req/s)**: Number of requests processed per second
- **Output Token Throughput (tok/s)**: Total tokens generated per second
- **Mean TTFT (ms)**: Time to First Token - measures responsiveness
- **Mean TPOT (ms)**: Time Per Output Token - measures generation speed
- **Mean ITL (ms)**: Inter-Token Latency - measures streaming consistency

**Why These Configurations Matter:**

- **1K/1K (Chat)**: Represents the most common conversational AI workload. This is the highest priority scenario for most deployments.
- **1K/8K (Reasoning)**: Tests long-form generation capabilities crucial for complex reasoning, code generation, and detailed explanations.
- **8K/1K (Summarization)**: Evaluates performance with large context inputs, essential for RAG systems, document Q&A, and summarization tasks.
- **Variable Concurrency**: Captures the Pareto frontier - the optimal trade-off between throughput and latency at different load levels. Low concurrency shows best-case latency, high concurrency shows maximum throughput.

**Interpreting Results:**

- Compare your results against baseline numbers for your hardware
- Higher throughput at same latency = better performance
- Lower TTFT = more responsive user experience
- Lower TPOT = faster generation speed

### 5.2 Accuracy Benchmark

Document model accuracy on standard benchmarks:

#### 5.2.1 GSM8K Benchmark

- Benchmark Command

```bash
python3 benchmark/gsm8k/bench_sglang.py \
  --num-shots 8 \
  --num-questions 1316 \
  --parallel 1316
```

**Test Results:**

```
Accuracy: 0.959
Invalid: 0.000
Latency: 29.185 s
Output throughput: 4854.672 token/s
```
