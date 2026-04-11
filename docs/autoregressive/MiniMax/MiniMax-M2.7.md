# MiniMax-M2.7

## 1. Model Introduction

[MiniMax-M2.7](https://huggingface.co/MiniMaxAI/MiniMax-M2.7) is MiniMax's first model deeply participating in its own evolution. Built for real-world productivity, M2.7 excels at building complex agent harnesses and completing highly elaborate productivity tasks, leveraging Agent Teams, complex Skills, and dynamic tool search.

Key highlights:

- **Model Self-Evolution**: During development, M2.7 updates its own memory, builds complex skills for RL experiments, and improves its own learning process. An internal version autonomously optimized a programming scaffold over 100+ rounds, achieving a **30% performance improvement**. On MLE Bench Lite, M2.7 achieved a **66.6% medal rate**.
- **Professional Software Engineering**: Delivers outstanding real-world programming capabilities. On SWE-Pro, M2.7 achieved **56.22%**, with strong results on SWE Multilingual (76.5) and Multi SWE Bench (52.7). On Terminal Bench 2 (57.0%) and NL2Repo (39.8%), M2.7 demonstrates deep understanding of complex engineering systems.
- **Professional Work**: Achieved an ELO score of **1495** on GDPval-AA (highest among open-source models). On Toolathon, M2.7 reached **46.3%** accuracy (global top tier).
- **Native Agent Teams**: Supports multi-agent collaboration with stable role identity and autonomous decision-making.

For more details, see the [official MiniMax-M2.7 blog post](https://www.minimax.io/news/minimax-m27-en).

**License**: [Modified-MIT (MiniMax Model License)](https://github.com/MiniMax-AI/MiniMax-M2.7/blob/main/LICENSE)

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

**For AMD MI300X/MI325X/MI355X GPUs:**

```bash
# Docker (AMD MI300X/MI325X)
docker pull lmsysorg/sglang:v0.5.10.post1-rocm720-mi30x

# Docker (AMD MI355X)
docker pull lmsysorg/sglang:v0.5.10.post1-rocm720-mi35x
```

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, deployment strategy, and feature capabilities.

import MiniMaxM27ConfigGenerator from '@site/src/components/autoregressive/MiniMaxM27ConfigGenerator';

<MiniMaxM27ConfigGenerator />

### 3.2 Configuration Tips

**Key Parameters:**

| Parameter                    | Description                                    | Recommended Value                |
| ---------------------------- | ---------------------------------------------- | -------------------------------- |
| `--tool-call-parser`        | Tool call parser for function calling support   | `minimax-m2`                    |
| `--reasoning-parser`        | Reasoning parser for thinking mode              | `minimax-append-think`          |
| `--trust-remote-code`       | Required for MiniMax model loading              | Always enabled                   |
| `--mem-fraction-static`     | Static memory fraction for KV cache             | `0.85`                          |
| `--tp`                      | Tensor parallelism size                         | `2` / `4` / `8` depending on hardware |
| `--ep`                      | Expert parallelism size                         | `8` (NVIDIA 8-GPU) or EP=TP (AMD) |
| `--kv-cache-dtype`          | KV cache data type (AMD only)                   | `fp8_e4m3`                      |
| `--attention-backend`       | Attention backend (AMD only)                    | `triton`                        |

**Hardware Requirements: NVIDIA**

- **4-GPU deployment**: Requires 4× high-memory GPUs (e.g., H200, B200, A100, H100) with TP=4
- **8-GPU deployment**: Requires 8× GPUs (e.g., H200, B200, A100, H100) with TP=8 and EP=8

**Hardware Requirements: NVIDIA GB300**

- **2-GPU deployment**: GB300 (275GB per die) can host the model with TP=2
- **4-GPU / 8-GPU deployment**: Also supported for higher throughput

**Hardware Requirements: AMD**

- **2-GPU deployment**: Requires 2× high-memory GPUs (e.g., MI300X, MI325X, MI355X) with TP=2, EP=2
- **4-GPU deployment**: Requires 4× GPUs (e.g., MI300X, MI325X, MI355X) with TP=4, EP=4
- **8-GPU deployment**: Requires 8× GPUs (e.g., MI300X, MI325X, MI355X) with TP=8, EP=8

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

**Deployment Command:**

```bash
sglang serve \
  --model-path MiniMaxAI/MiniMax-M2.7 \
  --tp 4 \
  --tool-call-parser minimax-m2 \
  --reasoning-parser minimax-append-think \
  --trust-remote-code \
  --mem-fraction-static 0.85
```

**Testing Deployment:**

After startup, you can test the SGLang OpenAI-compatible API with the following command:

```bash
curl http://localhost:30000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "MiniMaxAI/MiniMax-M2.7",
        "messages": [
            {"role": "system", "content": [{"type": "text", "text": "You are a helpful assistant."}]},
            {"role": "user", "content": [{"type": "text", "text": "Who won the world series in 2020?"}]}
        ]
    }'
```

**Simple Completion Example:**

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY"
)

response = client.chat.completions.create(
    model="MiniMaxAI/MiniMax-M2.7",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Who won the world series in 2020?"}
    ],
    max_tokens=1024
)

print(response.choices[0].message.content)
```

**Example Output**:
```
<think>The user asks: "Who won the World Series in 2020?" That's a simple factual question. The answer: the Los Angeles Dodgers won the 2020 MLB World Series, defeating the Tampa Bay Rays. So answer accordingly.

We must be mindful of policy: it's a factual question about sports. It's allowed. Provide answer with brief context.

We should answer concisely.

Hence final answer: The Los Angeles Dodgers won the 2020 World Series, defeating the Tampa Bay Rays in six games (best-of-seven series). Possibly mention it was played at a neutral site due to COVID-19, at Globe Life Field in Arlington, Texas.

We must avoid disallowed content, no issue.

Thus final.
</think>

The **Los Angeles Dodgers** won the 2020 World Series. They defeated the **Tampa Bay Rays** in six games (4‑2) in a best‑of‑seven series that was played at Globe Life Field in Arlington, Texas, under the MLB bubble‑like arrangements for the COVID‑19 pandemic.
```

### 4.2 Advanced Usage

#### 4.2.1 Reasoning Parser

MiniMax-M2.7 supports Thinking mode. Enable the reasoning parser during deployment to separate the thinking and the content sections:

```bash
sglang serve \
  --model-path MiniMaxAI/MiniMax-M2.7 \
  --tp 4 \
  --reasoning-parser minimax-append-think \
  --trust-remote-code \
  --mem-fraction-static 0.85
```

**Streaming with Thinking Process**

With `minimax-append-think`, the thinking content is wrapped in `<think>...</think>` tags within the `content` field. You can parse these tags on the client side to separate the thinking and content sections:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY"
)

# Enable streaming to see the thinking process in real-time
response = client.chat.completions.create(
    model="MiniMaxAI/MiniMax-M2.7",
    messages=[
        {"role": "user", "content": "Solve this problem step by step: What is 15% of 240?"}
    ],
    max_tokens=2048,
    stream=True
)

# Process the stream, separating <think>...</think> from content
in_think = False
think_printed_header = False
content_printed_header = False
buffer = ""

for chunk in response:
    if chunk.choices and len(chunk.choices) > 0:
        delta = chunk.choices[0].delta
        if delta.content:
            buffer += delta.content

            while buffer:
                if in_think:
                    # Look for closing </think> tag
                    end_idx = buffer.find("</think>")
                    if end_idx != -1:
                        print(buffer[:end_idx], end="", flush=True)
                        buffer = buffer[end_idx + len("</think>"):]
                        in_think = False
                    else:
                        # Still in thinking, print what we have
                        print(buffer, end="", flush=True)
                        buffer = ""
                else:
                    # Look for opening <think> tag
                    start_idx = buffer.find("<think>")
                    if start_idx != -1:
                        # Print any content before <think>
                        before = buffer[:start_idx]
                        if before:
                            if not content_printed_header:
                                print("=============== Content =================", flush=True)
                                content_printed_header = True
                            print(before, end="", flush=True)
                        buffer = buffer[start_idx + len("<think>"):]
                        in_think = True
                        if not think_printed_header:
                            print("=============== Thinking =================", flush=True)
                            think_printed_header = True
                    else:
                        # No <think> tag, print as content
                        if not content_printed_header and think_printed_header:
                            print("\n=============== Content =================", flush=True)
                            content_printed_header = True
                        print(buffer, end="", flush=True)
                        buffer = ""

print()
```

**Output Example:**

```text
=============== Thinking =================
The user asks: "Solve this problem step by step: What is 15% of 240?" Straightforward. Provide solution: 15% = 15/100 = 0.15. Multiply 240 * 0.15 = 36. Show steps. So answer: 36. Provide explanation.

But also ensure we follow any policy? No issues. Just straightforward.

I'll provide a step-by-step solution.

Also could show fraction: 15% = 15/100 = 3/20, multiply 240 * 3/20 = (240/20)*3 = 12*3 = 36.

Yes. Provide final answer. Also show verification: 10% of 240 is 24, 5% is 12, total 36.

All good.

=============== Content =================

**Step‑by‑step solution**

1. **Convert the percent to a decimal (or a fraction).**

   15% = 15/100 = 0.15 = 3/20

2. **Multiply the original number (240) by this decimal/fraction.**

   Using the decimal:
   240 × 0.15 = 36

   Or using the fraction:
   240 × 3/20 = (240/20) × 3 = 12 × 3 = 36

3. **Result:**

   15% of 240 = **36**

*Check:*
- 10% of 240 = 24
- 5% of 240 = 12
- Adding them: 24 + 12 = 36, which matches the calculation.
```

**Note:** The `minimax-append-think` reasoning parser embeds the thinking process in `<think>...</think>` tags within the `content` field. The code above parses these tags in real-time to display thinking and content separately.

#### 4.2.2 Tool Calling

MiniMax-M2.7 supports tool calling capabilities. Enable the tool call parser:

```bash
sglang serve \
  --model-path MiniMaxAI/MiniMax-M2.7 \
  --tp 4 \
  --tool-call-parser minimax-m2 \
  --reasoning-parser minimax-append-think \
  --trust-remote-code \
  --mem-fraction-static 0.85
```

**Python Example:**

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
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

# Non-streaming request
response = client.chat.completions.create(
    model="MiniMaxAI/MiniMax-M2.7",
    messages=[
        {"role": "user", "content": "What's the weather in Beijing?"}
    ],
    tools=tools
)

message = response.choices[0].message

# Check for tool calls
if message.tool_calls:
    for tool_call in message.tool_calls:
        print(f"Tool Call: {tool_call.function.name}")
        print(f"   Arguments: {tool_call.function.arguments}")
else:
    print(message.content)
```

**Output Example**:
```
Tool Call: get_weather
   Arguments: {"location": "Beijing"}
```

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
    model="MiniMaxAI/MiniMax-M2.7",
    messages=messages
)

print(final_response.choices[0].message.content)
```

## 5. Benchmark

This section uses **industry-standard configurations** for comparable benchmark results.

### 5.1 Speed Benchmark

**Test Environment**:

- Hardware: TODO
- Model: MiniMax-M2.7
- Tensor Parallelism: TODO
- Expert Parallelism: TODO
- sglang version: 0.5.10.post1

#### 5.1.1 Low Concurrency

- Benchmark Command:
```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model MiniMaxAI/MiniMax-M2.7 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1
```
- Test Results:
```
TODO
```

#### 5.1.2 High Concurrency

- Benchmark Command:
```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model MiniMaxAI/MiniMax-M2.7 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 500 \
  --max-concurrency 100
```
- Test Results:
```
TODO
```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark
- Benchmark Command:
```
python3 benchmark/gsm8k/bench_sglang.py --port 30000
```
- Test Results:
```
TODO
```

#### 5.2.2 MMLU Benchmark
- Benchmark Command:
```
cd benchmark/mmlu
bash download_data.sh
python3 bench_sglang.py --port 30000
```
- Test Results:
```
TODO
```
