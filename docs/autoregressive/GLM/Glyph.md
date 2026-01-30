# GLM Glyph

## 1. Model Introduction

[Glyph](https://huggingface.co/zai-org/Glyph) is a powerful language model developed by Zhipu AI, featuring advanced capabilities in reasoning, function calling, and multi-modal understanding.

**Hardware Support:** NVIDIA B200/H100/H200, AMD MI300X/MI325X/MI355X

**Key Features:**

- **Advanced Reasoning**: Built-in reasoning capabilities for complex problem-solving
- **Multiple Quantizations**: BF16 and FP8 variants for different performance/memory trade-offs
- **High Performance**: Optimized for both throughput and latency scenarios

**Available Models:**

- **BF16 (Full precision)**: [zai-org/Glyph](https://huggingface.co/zai-org/Glyph)
- **FP8 (8-bit quantized)**: [zai-org/Glyph-FP8](https://huggingface.co/zai-org/Glyph-FP8)

**License:**

Please refer to the [official Glyph model card](https://huggingface.co/zai-org/Glyph) for license details.

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, quantization method, and other options.

import GlyphConfigGenerator from '@site/src/components/autoregressive/GlyphConfigGenerator';

<GlyphConfigGenerator />

### 3.2 Configuration Tips

For more detailed configuration tips, please refer to [GLM-4.5/GLM-4.6 Usage](https://docs.sglang.io/basic_usage/glm45.html).

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

### 4.2 Advanced Usage

#### 4.2.1 Thinking Mode

Glyph supports thinking mode for enhanced reasoning. Enable the reasoning parser during deployment to separate the thinking and content sections:

```shell
python -m sglang.launch_server \
  --model-path zai-org/Glyph \
  --reasoning-parser glm45 \
  --tp 4 \
  --host 0.0.0.0 \
  --port 30000
```

**Streaming with Thinking Process:**

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY"
)

# Enable streaming to see the thinking process in real-time
response = client.chat.completions.create(
    model="zai-org/Glyph",
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

**Note:** The reasoning parser captures the model's step-by-step thinking process, allowing you to see how the model arrives at its conclusions.

**Disable Thinking Mode:**

To disable thinking mode for a specific request:

```python
response = client.chat.completions.create(
    model="zai-org/Glyph",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    extra_body={"chat_template_kwargs": {"enable_thinking": False}}
)
```

#### 4.2.2 Tool Calling

Glyph supports tool calling capabilities. Enable the tool call parser:

```shell
python -m sglang.launch_server \
  --model-path zai-org/Glyph \
  --reasoning-parser glm45 \
  --tool-call-parser glm45 \
  --tp 4 \
  --host 0.0.0.0 \
  --port 30000
```

**Python Example (with Thinking Process):**

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

# Make request with streaming to see thinking process
response = client.chat.completions.create(
    model="zai-org/Glyph",
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
    print(f"Tool Call: {tool_call['name']}")
    print(f"   Arguments: {tool_call['arguments']}")

print()
```

**Output Example:**

```text
=============== Thinking =================
The user is asking about the weather in Beijing. I need to use the get_weather function to retrieve this information.
I should call the function with location="Beijing".
=============== Content =================

Tool Call: get_weather
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
    model="zai-org/Glyph",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# Output: "The weather in Beijing is currently 22°C and sunny."
```

## 5. Benchmark

This section uses **industry-standard configurations** for comparable benchmark results.

### 5.1 Speed Benchmark

**Test Environment:**

- Model: Glyph
- SGLang Version: 0.5.6.post1

**Benchmark Methodology:**

We use industry-standard benchmark configurations to ensure results are comparable across frameworks and hardware platforms.

#### 5.1.1 Standard Test Scenarios

Three core scenarios reflect real-world usage patterns:

| Scenario                | Input Length | Output Length | Use Case                                      |
| ----------------------- | ------------ | ------------- | --------------------------------------------- |
| **Chat**          | 1K           | 1K            | Most common conversational AI workload        |
| **Reasoning**     | 1K           | 8K            | Long-form generation, complex reasoning tasks |
| **Summarization** | 8K           | 1K            | Document summarization, RAG retrieval         |

#### 5.1.2 Benchmark Commands

**Scenario 1: Chat (1K/1K)**

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/Glyph \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

**Scenario 2: Reasoning (1K/8K)**

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/Glyph \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

**Scenario 3: Summarization (8K/1K)**

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/Glyph \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

```bash
python -m sglang.test.few_shot_gsm8k \
  --num-questions 200 \
  --port 30000
```
