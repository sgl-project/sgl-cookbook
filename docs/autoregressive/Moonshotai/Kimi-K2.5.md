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
    base_url="http://localhost:8000/v1",
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
                        "url": "https://example.com/image.jpg"
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

#### 4.2.2 Reasoning Parser (Thinking Mode)

Enable reasoning parser to see the model's step-by-step thinking process:

**Deployment Command:**

```shell
python -m sglang.launch_server \
  --model moonshotai/Kimi-K2.5 \
  --reasoning-parser kimi_k2 \
  --tp 8 \
  --trust-remote-code \
  --host 0.0.0.0 \
  --port 8000
```

**Example:**

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="EMPTY"
)

# Enable streaming to see the thinking process in real-time
response = client.chat.completions.create(
    model="moonshotai/Kimi-K2.5",
    messages=[
        {"role": "user", "content": "Solve this problem step by step: What is 15% of 240?"}
    ],
    temperature=0.6,
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

```text
=============== Thinking =================
  The user asks: "What is 15% of 240?" This is a straightforward percentage calculation problem. I need to solve it step by step.

Step 1: Understand what "percent" means.
- "Percent" means "per hundred". So 15% means 15 per 100, or 15/100, or 0.15.

Step 2: Convert the percentage to a decimal.
- 15% = 15 / 100 = 0.15

Step 3: Multiply the decimal by the number.
- 0.15 * 240 = 36

=============== Content =================
 Here is the step-by-step solution:

**Step 1: Convert the percentage to a decimal**
15% means 15 per 100, which is 15 ÷ 100 = **0.15**

**Step 2: Multiply the decimal by the number**
0.15 × 240 = **36**

**Answer:** 15% of 240 is **36**.
```

#### 4.2.3 Tool Calling

Kimi-K2.5 supports tool calling capabilities for agentic tasks. Enable the tool call parser during deployment:

**Deployment Command:**

```shell
python -m sglang.launch_server \
  --model moonshotai/Kimi-K2.5 \
  --tool-call-parser kimi_k2 \
  --tp 8 \
  --trust-remote-code \
  --host 0.0.0.0 \
  --port 8000
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
                        "url": "https://example.com/product_image.jpg"
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

## 5. Benchmark

This section uses **industry-standard configurations** for comparable benchmark results.

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA H200/B200 GPU (8x)
- Model: Kimi-K2.5
- Tensor Parallelism: 8
- SGLang Version: Latest

**Benchmark Methodology:**

We use industry-standard benchmark configurations to ensure results are comparable across frameworks and hardware platforms.

#### 5.1.1 Standard Test Scenarios

Three core scenarios reflect real-world usage patterns:

| Scenario                | Input Length | Output Length | Use Case                                      |
| ----------------------- | ------------ | ------------- | --------------------------------------------- |
| **Chat**          | 1K           | 1K            | Most common conversational AI workload        |
| **Reasoning**     | 1K           | 8K            | Long-form generation, complex reasoning tasks |
| **Summarization** | 8K           | 1K            | Document summarization, RAG retrieval         |

#### 5.1.2 Concurrency Levels

Test each scenario at three concurrency levels to capture the throughput vs. latency tradeoff (Pareto frontier):

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
- **Variable Concurrency**: Captures the Pareto frontier - the optimal tradeoff between throughput and latency at different load levels. Low concurrency shows best-case latency, high concurrency shows maximum throughput.

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
python -m sglang.test.few_shot_gsm8k \
  --num-questions 200 \
  --port 8000
```