---
sidebar_position: 1
---

# Qwen3

## 1. Model Introduction

[Qwen3 series](https://github.com/QwenLM/Qwen3) are the most powerful vision-language models in the Qwen series to date, featuring advanced capabilities in multi-modal understanding, reasoning, and agentic applications.

This generation delivers comprehensive upgrades across the board:

- **Stronger general intelligence**: Significant improvements in instruction following, logical reasoning, text comprehension, mathematics, science, coding, and tool usage.
- **Broader multilingual knowledge**: Substantial gains in long-tail knowledge coverage across multiple languages.
- **More helpful & aligned responses**: Markedly better alignment with user preferences in subjective and open-ended tasks, enabling higher-quality, more useful text generation.
- **Extended context length**: Enhanced capabilities in understanding and reasoning over 256K-token long contexts.
- **Stronger agent interaction capabilities**: Improved tool use and search-based agent performance
- **Flexible deployment options**: Available in Dense and MoE architectures that scale from edge to cloud, with Instruct and reasoning-enhanced Thinking editions

For more details, please refer to the [official Qwen3 GitHub Repository](https://github.com/QwenLM/Qwen3).

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

The Qwen3 series offers models in various sizes and architectures, optimized for different hardware platforms. The recommended launch configurations vary by hardware and model size.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model size, quantization method, and thinking capabilities.

import Qwen3ConfigGenerator from '@site/src/components/Qwen3ConfigGenerator';

<Qwen3ConfigGenerator />

### 3.2 Configuration Tips

- **Memory Management** : Set lower `--context-length` to conserve memory. A value of `128000` is sufficient for most scenarios, down from the default 262K.
- **Expert Parallelism** : SGLang supports Expert Parallelism (EP) via `--ep`, allowing experts in MoE models to be deployed on separate GPUs for better throughput. One thing to note is that, for quantized models, you need to set `--ep` to a value that satisfies the requirement: `(moe_intermediate_size / moe_tp_size) % weight_block_size_n == 0, where moe_tp_size is equal to tp_size divided by ep_size.` Note that EP may perform worse in low concurrency scenarios due to additional communication overhead. Check out [Expert Parallelism Deployment](https://github.com/sgl-project/sglang/blob/main/docs/advanced_features/expert_parallelism.md) for more details.
- **Kernel Tuning** : For MoE Triton kernel tuning on your specific hardware, refer to [fused_moe_triton](https://github.com/sgl-project/sglang/tree/main/benchmark/kernels/fused_moe_triton).
- **Speculative Decoding**: Using Speculative Decoding for latency-sensitive scenarios.
  - `--speculative-algorithm EAGLE3`: Speculative decoding algorithm
  - `--speculative-num-steps 3`: Number of speculative verification rounds
  - `--speculative-eagle-topk 1`: Top-k sampling for draft tokens
  - `--speculative-num-draft-tokens 4`: Number of draft tokens per step
  - `--speculative-draft-model-path`: The path of the draft model weights. This can be a local folder or a Hugging Face repo ID.

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)
- [SGLang OpenAI Vision API Guide](https://docs.sglang.ai/basic_usage/openai_api_vision.html)

### 4.2 Advanced Usage

#### 4.2.1 Reasoning Parser

Qwen3-235B-A22B supports reasoning mode. Enable the reasoning parser during deployment to separate the thinking and content sections:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-235B-A22B \
  --reasoning-parser qwen3 \
  --tp 8 \
  --host 0.0.0.0 \
  --port 8000
```

**Streaming with Thinking Process:**

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="EMPTY"
)

# Enable streaming to see the thinking process in real-time
response = client.chat.completions.create(
    model="Qwen/Qwen3-235B-A22B",
    messages=[
        {"role": "user", "content": "Solve this problem step by step: What is 15% of 240?"}
    ],
    temperature=0.7,
    max_tokens=2048,
    stream=True
)

# Process the stream
has_thinking = False
has_answer = False
thinking_started = False

for chunk in response:
    if chunk.choices and len(chunk.choices) > 0:
        delta = chunk.choices[0].delta

        # Print thinking process
        if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
            if not thinking_started:
                print("=============== Thinking =================", flush=True)
                thinking_started = True
            has_thinking = True
            print(delta.reasoning_content, end="", flush=True)

        # Print answer content
        if delta.content:
            # Close thinking section and add content header
            if has_thinking and not has_answer:
                print("\n=============== Content =================", flush=True)
                has_answer = True
            print(delta.content, end="", flush=True)

print()
```

**Output Example:**

```
=============== Thinking =================

Okay, so I need to figure out what 15% of 240 is. Hmm, percentages can sometimes trip me up, but I think I remember some basics. Let me start by recalling that "percent" means "per hundred," so 15% is the same as 15 per 100, or 15/100. So, maybe I can convert 15% into a decimal first? Yeah, I think that's a common method.
...
So conclusion: The answer is 36.

=============== Content =================


To determine what 15% of 240 is, we can follow a systematic approach that involves converting the percentage to a decimal and then performing multiplication. Here's a step-by-step breakdown of the solution:

....

### Final Answer:

$$
\boxed{36}
$$

Thus, 15% of 240 is **36**.
```

**Note:** The reasoning parser captures the model's step-by-step thinking process, allowing you to see how the model arrives at its conclusions.

#### 4.2.3 Tool Calling

Qwen3 supports tool calling capabilities. Enable the tool call parser:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-235B-A22B \
  --reasoning-parser qwen3 \
  --tool-call-parser qwen3 \
  --tp 8 \
  --host 0.0.0.0 \
  --port 8000
```

**Python Example (with Thinking Process):**

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="EMPTY"
)

# Define available tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a location",
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

# Make request with streaming to see thinking process
response = client.chat.completions.create(
    model="Qwen/Qwen3-235B-A22B",
    messages=[
        {"role": "user", "content": "What's the weather in Beijing?"}
    ],
    tools=tools,
    temperature=0.7,
    stream=True
)

# Process streaming response
thinking_started = False
has_thinking = False
tool_calls_accumulator = {}

for chunk in response:
    if chunk.choices and len(chunk.choices) > 0:
        delta = chunk.choices[0].delta

        # Print thinking process
        if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
            if not thinking_started:
                print("=============== Thinking =================", flush=True)
                thinking_started = True
            has_thinking = True
            print(delta.reasoning_content, end="", flush=True)

        # Accumulate tool calls
        if hasattr(delta, 'tool_calls') and delta.tool_calls:
            # Close thinking section if needed
            if has_thinking and thinking_started:
                print("\n=============== Content =================\n", flush=True)
                thinking_started = False

            for tool_call in delta.tool_calls:
                index = tool_call.index
                if index not in tool_calls_accumulator:
                    tool_calls_accumulator[index] = {
                        'name': None,
                        'arguments': ''
                    }

                if tool_call.function:
                    if tool_call.function.name:
                        tool_calls_accumulator[index]['name'] = tool_call.function.name
                    if tool_call.function.arguments:
                        tool_calls_accumulator[index]['arguments'] += tool_call.function.arguments

        # Print content
        if delta.content:
            print(delta.content, end="", flush=True)

# Print accumulated tool calls
for index, tool_call in sorted(tool_calls_accumulator.items()):
    print(f"🔧 Tool Call: {tool_call['name']}")
    print(f"   Arguments: {tool_call['arguments']}")

print()
```

**Output Example:**

```
=============== Thinking =================

Okay, the user is asking for the weather in Beijing. Let me check the tools available. There's a function called get_weather that takes location and unit parameters. The location is required, so I need to specify Beijing as the location. The unit is optional and can be either celsius or fahrenheit. Since the user didn't specify the unit, maybe I should default to a common one. In China, they usually use celsius, so I'll set unit to celsius. I'll call the get_weather function with location: Beijing and unit: celsius. That should get the current weather for them.



=============== Content =================

🔧 Tool Call: get_weather
   Arguments: {"location": "Beijing", "unit": "celsius"}
```

**Note:**

- The reasoning parser shows how the model decides to use a tool
- Tool calls are clearly marked with the function name and arguments
- You can then execute the function and send the result back to continue the conversation

**Handling Tool Call Results:**

```python
# After getting the tool call, execute the function
def get_weather(location, unit="celsius"):
    # Your actual weather API call here
    return f"The weather in {location} is 22°{unit[0].upper()} and sunny."

# Send tool result back to the model
messages = [
    {"role": "user", "content": "What's the weather in Beijing?"},
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": "call_123",
            "type": "function",
            "function": {
                "name": "get_weather",
                "arguments": '{"location": "Beijing", "unit": "celsius"}'
            }
        }]
    },
    {
        "role": "tool",
        "tool_call_id": "call_123",
        "content": get_weather("Beijing", "celsius")
    }
]

final_response = client.chat.completions.create(
    model="Qwen/Qwen3-235B-A22B",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# Output: "The current weather in Beijing is **22°C** and **sunny**. A perfect day to enjoy outdoor activities! 🌞"
```

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA B200 GPU (8x)
- Model: Qwen3-235B-A22B
- Tensor Parallelism: 8
- sglang version: 0.5.6

We use SGLang's built-in benchmarking tool to conduct performance evaluation on the [ShareGPT_Vicuna_unfiltered](https://huggingface.co/datasets/anon8231489123/ShareGPT_Vicuna_unfiltered) dataset. This dataset contains real conversation data and can better reflect performance in actual use scenarios.

#### 5.1.1 Standard Scenario Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-235B-A22B \
  --tp 8
```

##### 5.1.1.1 Low Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  44.16
Total input tokens:                      6101
Total input text tokens:                 6101
Total input vision tokens:               0
Total generated tokens:                  4210
Total generated tokens (retokenized):    4210
Request throughput (req/s):              0.23
Input token throughput (tok/s):          138.14
Output token throughput (tok/s):         95.32
Peak output token throughput (tok/s):    98.00
Peak concurrent requests:                2
Total token throughput (tok/s):          233.47
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   4414.85
Median E2E Latency (ms):                 3499.95
---------------Time to First Token----------------
Mean TTFT (ms):                          96.27
Median TTFT (ms):                        65.22
P99 TTFT (ms):                           359.71
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          10.27
Median TPOT (ms):                        10.28
P99 TPOT (ms):                           10.30
---------------Inter-Token Latency----------------
Mean ITL (ms):                           10.28
Median ITL (ms):                         10.28
P95 ITL (ms):                            10.34
P99 ITL (ms):                            10.40
Max ITL (ms):                            10.76
==================================================
```

##### 5.1.1.2 Medium Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  48.01
Total input tokens:                      39668
Total input text tokens:                 39668
Total input vision tokens:               0
Total generated tokens:                  40725
Total generated tokens (retokenized):    40725
Request throughput (req/s):              1.67
Input token throughput (tok/s):          826.27
Output token throughput (tok/s):         848.29
Peak output token throughput (tok/s):    1152.00
Peak concurrent requests:                20
Total token throughput (tok/s):          1674.56
Concurrency:                             13.58
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   8150.37
Median E2E Latency (ms):                 8608.58
---------------Time to First Token----------------
Mean TTFT (ms):                          219.77
Median TTFT (ms):                        76.69
P99 TTFT (ms):                           817.57
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          15.88
Median TPOT (ms):                        15.72
P99 TPOT (ms):                           21.37
---------------Inter-Token Latency----------------
Mean ITL (ms):                           15.61
Median ITL (ms):                         14.73
P95 ITL (ms):                            15.50
P99 ITL (ms):                            53.54
Max ITL (ms):                            335.18
==================================================
```

##### 5.1.1.3 High Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 500 \
  --max-concurrency 100
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 100
Successful requests:                     500
Benchmark duration (s):                  86.32
Total input tokens:                      249831
Total input text tokens:                 249831
Total input vision tokens:               0
Total generated tokens:                  252162
Total generated tokens (retokenized):    252131
Request throughput (req/s):              5.79
Input token throughput (tok/s):          2894.15
Output token throughput (tok/s):         2921.15
Peak output token throughput (tok/s):    4200.00
Peak concurrent requests:                111
Total token throughput (tok/s):          5815.30
Concurrency:                             89.76
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   15496.34
Median E2E Latency (ms):                 15116.24
---------------Time to First Token----------------
Mean TTFT (ms):                          325.26
Median TTFT (ms):                        98.25
P99 TTFT (ms):                           1484.77
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          30.52
Median TPOT (ms):                        31.62
P99 TPOT (ms):                           35.22
---------------Inter-Token Latency----------------
Mean ITL (ms):                           30.14
Median ITL (ms):                         23.78
P95 ITL (ms):                            63.71
P99 ITL (ms):                            80.10
Max ITL (ms):                            1019.75
==================================================
```

#### 5.1.2 Reasoning Scenario Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-235B-A22B \
  --tp 8
```

##### 5.1.2.1 Low Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  461.12
Total input tokens:                      6101
Total input text tokens:                 6101
Total input vision tokens:               0
Total generated tokens:                  44452
Total generated tokens (retokenized):    44419
Request throughput (req/s):              0.02
Input token throughput (tok/s):          13.23
Output token throughput (tok/s):         96.40
Peak output token throughput (tok/s):    98.00
Peak concurrent requests:                2
Total token throughput (tok/s):          109.63
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   46110.08
Median E2E Latency (ms):                 49701.17
---------------Time to First Token----------------
Mean TTFT (ms):                          91.23
Median TTFT (ms):                        64.99
P99 TTFT (ms):                           313.50
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          10.33
Median TPOT (ms):                        10.34
P99 TPOT (ms):                           10.38
---------------Inter-Token Latency----------------
Mean ITL (ms):                           10.35
Median ITL (ms):                         10.35
P95 ITL (ms):                            10.45
P99 ITL (ms):                            10.48
Max ITL (ms):                            11.68
==================================================
```

##### 5.1.2.2 Medium Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  340.59
Total input tokens:                      39668
Total input text tokens:                 39668
Total input vision tokens:               0
Total generated tokens:                  318226
Total generated tokens (retokenized):    318120
Request throughput (req/s):              0.23
Input token throughput (tok/s):          116.47
Output token throughput (tok/s):         934.33
Peak output token throughput (tok/s):    1136.00
Peak concurrent requests:                18
Total token throughput (tok/s):          1050.80
Concurrency:                             13.84
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   58925.28
Median E2E Latency (ms):                 58874.55
---------------Time to First Token----------------
Mean TTFT (ms):                          174.97
Median TTFT (ms):                        72.43
P99 TTFT (ms):                           596.87
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          14.83
Median TPOT (ms):                        14.90
P99 TPOT (ms):                           15.26
---------------Inter-Token Latency----------------
Mean ITL (ms):                           14.77
Median ITL (ms):                         14.77
P95 ITL (ms):                            15.30
P99 ITL (ms):                            15.67
Max ITL (ms):                            150.37
==================================================
```

##### 5.1.2.3 High Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 320 \
  --max-concurrency 64
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 64
Successful requests:                     320
Benchmark duration (s):                  534.33
Total input tokens:                      158939
Total input text tokens:                 158939
Total input vision tokens:               0
Total generated tokens:                  1300705
Total generated tokens (retokenized):    1300016
Request throughput (req/s):              0.60
Input token throughput (tok/s):          297.45
Output token throughput (tok/s):         2434.26
Peak output token throughput (tok/s):    2944.00
Peak concurrent requests:                68
Total token throughput (tok/s):          2731.71
Concurrency:                             56.33
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   94064.17
Median E2E Latency (ms):                 96651.55
---------------Time to First Token----------------
Mean TTFT (ms):                          291.24
Median TTFT (ms):                        86.55
P99 TTFT (ms):                           1218.49
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          23.22
Median TPOT (ms):                        23.49
P99 TPOT (ms):                           24.46
---------------Inter-Token Latency----------------
Mean ITL (ms):                           23.08
Median ITL (ms):                         22.85
P95 ITL (ms):                            23.59
P99 ITL (ms):                            59.35
Max ITL (ms):                            650.89
==================================================
```

#### 5.1.3 Summarization Scenario Benchmark

##### 5.1.3.1 Low Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  45.24
Total input tokens:                      41941
Total input text tokens:                 41941
Total input vision tokens:               0
Total generated tokens:                  4210
Total generated tokens (retokenized):    4210
Request throughput (req/s):              0.22
Input token throughput (tok/s):          927.04
Output token throughput (tok/s):         93.06
Peak output token throughput (tok/s):    98.00
Peak concurrent requests:                2
Total token throughput (tok/s):          1020.09
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   4522.50
Median E2E Latency (ms):                 3640.13
---------------Time to First Token----------------
Mean TTFT (ms):                          159.87
Median TTFT (ms):                        147.35
P99 TTFT (ms):                           334.09
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          10.38
Median TPOT (ms):                        10.39
P99 TPOT (ms):                           10.46
---------------Inter-Token Latency----------------
Mean ITL (ms):                           10.39
Median ITL (ms):                         10.39
P95 ITL (ms):                            10.47
P99 ITL (ms):                            10.50
Max ITL (ms):                            11.29
==================================================
```

##### 5.1.3.2 Medium Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  53.01
Total input tokens:                      300020
Total input text tokens:                 300020
Total input vision tokens:               0
Total generated tokens:                  41589
Total generated tokens (retokenized):    41579
Request throughput (req/s):              1.51
Input token throughput (tok/s):          5659.39
Output token throughput (tok/s):         784.51
Peak output token throughput (tok/s):    1152.00
Peak concurrent requests:                20
Total token throughput (tok/s):          6443.90
Concurrency:                             13.93
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   9234.00
Median E2E Latency (ms):                 9575.11
---------------Time to First Token----------------
Mean TTFT (ms):                          388.55
Median TTFT (ms):                        182.46
P99 TTFT (ms):                           1926.02
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          17.46
Median TPOT (ms):                        17.41
P99 TPOT (ms):                           28.28
---------------Inter-Token Latency----------------
Mean ITL (ms):                           17.05
Median ITL (ms):                         14.28
P95 ITL (ms):                            14.88
P99 ITL (ms):                            100.67
Max ITL (ms):                            1431.38
==================================================
```

##### 5.1.3.3 High Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 320 \
  --max-concurrency 64
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 64
Successful requests:                     320
Benchmark duration (s):                  103.23
Total input tokens:                      1273893
Total input text tokens:                 1273893
Total input vision tokens:               0
Total generated tokens:                  169680
Total generated tokens (retokenized):    169679
Request throughput (req/s):              3.10
Input token throughput (tok/s):          12340.40
Output token throughput (tok/s):         1643.72
Peak output token throughput (tok/s):    2750.00
Peak concurrent requests:                71
Total token throughput (tok/s):          13984.11
Concurrency:                             59.06
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   19051.11
Median E2E Latency (ms):                 18542.35
---------------Time to First Token----------------
Mean TTFT (ms):                          896.85
Median TTFT (ms):                        215.93
P99 TTFT (ms):                           6302.90
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          35.36
Median TPOT (ms):                        36.07
P99 TPOT (ms):                           57.59
---------------Inter-Token Latency----------------
Mean ITL (ms):                           34.30
Median ITL (ms):                         22.38
P95 ITL (ms):                            110.00
P99 ITL (ms):                            165.88
Max ITL (ms):                            5855.77
==================================================
```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

- **Benchmark Command:**

```shell
python3 -m sglang.test.few_shot_gsm8k --num-questions 200
```

- **Results**:

  - Qwen/Qwen3-235B-A22B
    ```
    Accuracy: 0.945
    Invalid: 0.000
    Latency: 11.980 s
    Output throughput: 2358.105 token/s
    ```
