# Kimi-K2.5

## 1. Model Introduction

[Kimi-K2.5](https://huggingface.co/moonshotai/Kimi-K2.5) is an open-source, native multimodal agentic model by Moonshot AI, built through continual pretraining on approximately 15 trillion mixed visual and text tokens atop Kimi-K2-Base. It seamlessly integrates vision and language understanding with advanced agentic capabilities, instant and thinking modes.

**Key Features:**

- **Native Multimodality**: Pre-trained on vision–language tokens, K2.5 excels in visual knowledge, cross-modal reasoning, and agentic tool use grounded in visual inputs.
- **Coding with Vision**: K2.5 generates code from visual specifications (UI designs, video workflows) and autonomously orchestrates tools for visual data processing.
- **Agent Swarm**: K2.5 transitions from single-agent scaling to a self-directed, coordinated swarm-like execution scheme. It decomposes complex tasks into parallel sub-tasks executed by dynamically instantiated, domain-specific agents.

For details, see [official documentation](https://huggingface.co/moonshotai/Kimi-K2.5) and [deployment guidance](https://huggingface.co/moonshotai/Kimi-K2.5/blob/main/docs/deploy_guidance.md).

## 2. SGLang Installation

Refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html).

## 3. Model Deployment

This section provides a progressive guide from quick deployment to performance optimization, suitable for users at different levels.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model variant, deployment strategy, and capabilities.

import KimiK25ConfigGenerator from '@site/src/components/autoregressive/KimiK25ConfigGenerator';

<KimiK25ConfigGenerator />

### 3.2 Configuration Tips

- **Reasoning Parser**: Add `--reasoning-parser kimi_k2` for thinking mode to separate thinking and content.
- **Tool Call Parser**: Add `--tool-call-parser kimi_k2` for structured tool calls.
- **Chat Template**: Use `--chat-template kimi_k2` if needed for proper message formatting.

## 4. Model Invocation

### 4.1 Basic Usage

See [Basic API Usage](https://docs.sglang.ai/get_started/quick_start.html).

### 4.2 Advanced Usage

#### 4.2.1 Multimodal (Vision + Text) Input

Kimi-K2.5 supports native multimodal input with images:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY"
)

response = client.chat.completions.create(
    model="moonshotai/Kimi-K2.5",
    messages=[
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
                    "text": "What is in this image? Describe it in detail."
                }
            ]
        }
    ],
    temperature=0.7,
    max_tokens=2048
)

print(response.choices[0].message.content)
```
**Output Example:**
```text

```

#### 4.2.2 Reasoning Output

Kimi-K2.5 supports both thinking mode and instant mode. You can get the reasoning content by calling the `reasoning_content` field in the response.

**Usage:**

```python
import openai
import base64
import requests
def simple_chat(client: openai.OpenAI, model_name: str):
    messages = [
        {'role': 'system', 'content': 'You are Kimi, an AI assistant created by Moonshot AI.'},
        {
            'role': 'user',
            'content': [
                {'type': 'text', 'text': 'which one is bigger, 9.11 or 9.9? think carefully.'}
            ],
        },
    ]
    response = client.chat.completions.create(
        model=model_name, messages=messages, stream=False, max_tokens=4096
    )
    print('====== Below is reasoning_content in Thinking Mode ======')
    print(f'reasoning content: {response.choices[0].message.reasoning_content}')
    print('====== Below is response in Thinking Mode ======')
    print(f'response: {response.choices[0].message.content}')

    response = client.chat.completions.create(
        model=model_name,
        messages=messages,
        stream=False,
        max_tokens=4096,
        extra_body= {'chat_template_kwargs': {"thinking": False}} # To use instant mode
    )
    print('====== Below is response in Instant Mode ======')
    print(f'response: {response.choices[0].message.content}')

if __name__ == "__main__":
    client = openai.OpenAI(api_key="sk-123456", base_url="http://localhost:30000/v1")
    simple_chat(client, "moonshotai/Kimi-K2.5")
```

**Output Example:**
```text
====== Below is reasoning_content in Thinking Mode ======
reasoning content: The user is asking which number is bigger, 9.11 or 9.9. This is a classic "trick" question that plays on how people sometimes compare decimals incorrectly by treating them like strings or whole numbers.

Let me think through this carefully:

9.11 vs 9.9

When comparing decimals, I need to look at the place values:
- 9.11 = 9 + 1/10 + 1/100 = 9 + 0.1 + 0.01 = 9.11
- 9.9 = 9 + 9/10 = 9 + 0.9 = 9.90

Now comparing 9.11 and 9.90:
- The integer parts are both 9, so we look at the tenths place.
- 9.11 has 1 in the tenths place
- 9.90 has 9 in the tenths place
- Since 9 > 1, we have 9.9 > 9.11

Alternatively, thinking about it as money:
- $9.11 is nine dollars and eleven cents
- $9.90 is nine dollars and ninety cents
- 90 cents is more than 11 cents, so $9.90 > $9.11

Another way:
- 9.9 = 9.90
- 9.90 > 9.11

Common mistake: People might think 11 > 9, so 9.11 > 9.9, but that's wrong because 9.9 is actually 9.90, not 9.09 or something. The decimal places need to be aligned.

So the answer is 9.9 is bigger than 9.11.

Wait, I should make sure I'm not falling into any traps here. The user said "think carefully" which suggests they know about the common confusion between 9.11 and 9.9 (similar to the famous 0.999... = 1 debates, or the "9.11 vs 9.9" meme that went around regarding version numbers or dates).

Let me double-check:
- 9.11 = 9.110
- 9.9 = 9.900
- 9.900 > 9.110

Yes, 9.9 is definitely bigger.

I should explain this clearly by showing the decimal expansion or using the money analogy, as that's intuitive.
====== Below is response in Thinking Mode ======
response: **9.9 is bigger** than 9.11.

Here's why people often get this wrong: They compare the numbers after the decimal point as if they were whole numbers ("11" vs "9") and think 11 > 9, so 9.11 must be larger. But that's incorrect because **9.9 is actually 9.90**, not 9.09.

Think of it like money:
- **9.11** = $\$9.11$ (9 dollars and 11 cents)
- **9.9** = $\$9.90$ (9 dollars and 90 cents)

Comparing the decimal places:
- 9.**1**1 vs 9.**9**0
- The tenths place: **1** vs **9**
- Since 9 > 1, we have 9.90 > 9.11

Or mathematically:
$$9.9 - 9.11 = 0.79$$

So **9.9 is larger by 0.79**.
====== Below is response in Instant Mode ======
response:  I need to compare 9.11 and 9.9.

Let me think carefully. This is a common trick question because of how we read version numbers vs. decimal numbers.

**As decimal numbers:**
- 9.11 = 9 + 11/100 = 9.11
- 9.9 = 9 + 9/10 = 9.90

Since 9.90 > 9.11, **9.9 is bigger** (as decimals).

**However**, if this were software version numbers (like "version 9.11" vs "version 9.9"), then 9.11 would be newer/bigger (11 > 9 in the versioning scheme).

Given the notation with decimal points, the most natural interpretation is **decimal numbers**, so **9.9 is bigger**.
```

#### 4.2.3 Tool Calling

Kimi-K2.5 supports tool calling capabilities for agentic tasks. Enable the tool call parser during deployment:

**Deployment Command:**

```shell
python -m sglang.launch_server \
  --model moonshotai/Kimi-K2.5 \
  --tool-call-parser kimi_k2 \
  --tp 8 \
  --trust-remote-code
```

**Python Example:**

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

# Make request with streaming
response = client.chat.completions.create(
    model="moonshotai/Kimi-K2.5",
    messages=[
        {"role": "user", "content": "What's the weather in Beijing?"}
    ],
    tools=tools,
    temperature=0.7,
    stream=True
)

# Process streaming response
tool_calls_accumulator = {}

for chunk in response:
    if chunk.choices and len(chunk.choices) > 0:
        delta = chunk.choices[0].delta

        # Accumulate tool calls
        if hasattr(delta, 'tool_calls') and delta.tool_calls:
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

```text
🔧 Tool Call: get_weather
   Arguments: {"location":"Beijing"}
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
    model="moonshotai/Kimi-K2.5",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# Output: "The weather in Beijing is currently 22°C and sunny."
```

#### 4.2.4 Multimodal + Tool Calling (Agentic Vision)

Combine vision understanding with tool calling for advanced agentic tasks:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="EMPTY"
)

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_product",
            "description": "Search for a product by name or description",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The product name or description to search for"
                    }
                },
                "required": ["query"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="moonshotai/Kimi-K2.5",
    messages=[
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
                    "text": "Can you identify this product and search for similar items?"
                }
            ]
        }
    ],
    tools=tools,
    temperature=0.7,
    max_tokens=2048
)

print(response.choices[0].message)
```
**Output Example:**
```text

```


## 5. Benchmark

This section uses **industry-standard configurations** for comparable benchmark results.

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA H200/B300 GPU (8x)
- Model: Kimi-K2.5
- Tensor Parallelism: 8
- SGLang Version: Latest

#### 5.1.1 Benchmark Commands

**Scenario 1: Chat (1K/1K) - Most Important**

- **Model Deployment**

```bash
python -m sglang.launch_server \
  --model moonshotai/Kimi-K2.5 \
  --tp 8 \
  --trust-remote-code
```

- Low Concurrency (Latency-Optimized)

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.5 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

- Medium Concurrency (Balanced)

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.5 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16 \
  --request-rate inf
```

- High Concurrency (Throughput-Optimized)

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.5 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 500 \
  --max-concurrency 100 \
  --request-rate inf
```

**Scenario 2: Reasoning (1K/8K)**

- Low Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.5 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

- Medium Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.5 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 80 \
  --max-concurrency 16 \
  --request-rate inf
```

- High Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.5 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 320 \
  --max-concurrency 64 \
  --request-rate inf
```

**Scenario 3: Summarization (8K/1K)**

- Low Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.5 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

- Medium Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.5 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16 \
  --request-rate inf
```

- High Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.5 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 320 \
  --max-concurrency 64 \
  --request-rate inf
```

### 5.2 Accuracy Benchmark

Document model accuracy on standard benchmarks:

#### 5.2.1 GSM8K Benchmark

- Benchmark Command

```bash
python -m sglang.test.few_shot_gsm8k \
  --num-questions 200 \
  --port 8000
```
