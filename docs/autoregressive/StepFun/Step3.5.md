---
sidebar_position: 16
---

# Step3.5

## 1. Model Introduction

Step3.5 is StepFun's cutting-edge multimodal reasoning model—built on a Mixture-of-Experts architecture with 321B total parameters and 38B active. The model is available in multiple quantization formats optimized for different hardware platforms.

This generation delivers comprehensive upgrades across the board:
- **Multi-Layer Multi-Token Prediction (MTP)**: Equipped with a lightweight multi-layer MTP module using dense FFNs. This triples output speed during inference and will be good to accelerates rollout in RL training.
- **Enhanced Multimodal Reasoning**: Excels in STEM/Math—causal analysis and logical, evidence-based answers.

## 2.SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3.Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

The GPT-OSS series comes in two sizes. Recommended starting configurations vary depending on hardware.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model size, quantization method, and thinking capabilities.

import Step3_5ConfigGenerator from '@site/src/components/autoregressive/Step3_5ConfigGenerator';

<Step3_5ConfigGenerator />

## 4.Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

### 4.2 Advanced Usage

#### 4.2.1 Reasoning Parser

Step3.5 only supports reasoning mode. Enable the reasoning parser during deployment to separate the thinking and content sections:

```shell
python -m sglang.launch_server \
  --model openai/gpt-oss-120b \
  --reasoning-parser gpt-oss \
  --tp 8
```

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="EMPTY"
)

# Enable streaming to see the thinking process in real-time
response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
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
The user asks: "Solve this problem step by step: What is 15% of 240?" So we need to provide step-by-step solution. Compute 15% of 240: 0.15 * 240 = 36. Provide steps: convert percent to decimal, multiply, maybe use fraction. Provide answer.
=============== Content =================
**Step‑by‑step solution**

1. **Understand what “percent” means**
   “15 %” means 15 out of every 100 parts, i.e. the fraction \(\displaystyle \frac{15}{100}\).

2. **Convert the percent to a decimal (or fraction)**
   \[
   \frac{15}{100}=0.15
   \]

3. **Set up the multiplication**
   To find 15 % of 240 we multiply 240 by the decimal 0.15:
   \[
   240 \times 0.15
   \]

4. **Do the multiplication**
   One convenient way is to break it into two easier parts:
   \[
   240 \times 0.15 = 240 \times \left(\frac{15}{100}\right)
                = \frac{240 \times 15}{100}
   \]

   - First compute \(240 \times 15\):
     \[
     240 \times 15 = 240 \times (10 + 5) = 2400 + 1200 = 3600
     \]

   - Then divide by 100:
     \[
     \frac{3600}{100} = 36
     \]

5. **Write the result**
   \[
   15\% \text{ of } 240 = 36
   \]

---

**Answer:** \(36\)
```

#### 4.2.2 Tool Calling

Step3.5 supports tool calling capabilities. Enable the tool call parser:

**Python Example (without Thinking Process):**

Start sglang server:

```shell
python -m sglang.launch_server \
  --model openai/gpt-oss-120b \
  --tool-call-parser gpt-oss \
  --tp 8
```

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
    model="openai/gpt-oss-120b",
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

        # Print tool calls
        if hasattr(delta, 'tool_calls') and delta.tool_calls:
            # Close thinking section if needed
            if has_thinking and thinking_started:
                print("\n=============== Content =================", flush=True)
                thinking_started = False

            for tool_call in delta.tool_calls:
                if tool_call.function:
                    print(f"🔧 Tool Call: {tool_call.function.name}")
                    print(f"   Arguments: {tool_call.function.arguments}")

        # Print content
        if delta.content:
            print(delta.content, end="", flush=True)

print()
```

**Output Example:**

```

```

**Python Example (with Thinking Process):**

Start sglang server:

```shell
python -m sglang.launch_server \
  --model openai/gpt-oss-120b \
  --reasoning-parser gpt-oss \
  --tool-call-parser gpt-oss \
  --tp 8
```

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
    model="openai/gpt-oss-120b",
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

        # Print tool calls
        if hasattr(delta, 'tool_calls') and delta.tool_calls:
            # Close thinking section if needed
            if has_thinking and thinking_started:
                print("\n=============== Content =================", flush=True)
                thinking_started = False

            for tool_call in delta.tool_calls:
                if tool_call.function:
                    print(f"🔧 Tool Call: {tool_call.function.name}")
                    print(f"   Arguments: {tool_call.function.arguments}")

        # Print content
        if delta.content:
            print(delta.content, end="", flush=True)

print()
```

**Output Example:**

```

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
    model="openai/gpt-oss-120b",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# Output: "The current weather in Beijing is 22 °C and sunny. Let me know if you’d like a forecast for the next few days or any other details!"
```

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA B200 GPU (8x)
- Model: Qwen3-235B-A22B-Instruct-2507
- Tensor Parallelism: 8
- sglang version: 0.5.6

We use SGLang's built-in benchmarking tool to conduct performance evaluation on the [ShareGPT_Vicuna_unfiltered](https://huggingface.co/datasets/anon8231489123/ShareGPT_Vicuna_unfiltered) dataset. This dataset contains real conversation data and can better reflect performance in actual use scenarios.

#### 5.1.1 Standard Scenario Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --tp 8
```

##### 5.1.1.1 Low Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Test Results:

```

```

##### 5.1.1.2 Medium Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Test Results:

```

```

##### 5.1.1.3 High Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 500 \
  --max-concurrency 100
```

- Test Results:

```

```

#### 5.1.2 Reasoning Scenario Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --tp 8
```

##### 5.1.2.1 Low Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Test Results:

```

```

##### 5.1.2.2 Medium Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Test Results:

```

```

##### 5.1.2.3 High Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 320 \
  --max-concurrency 64
```

- Test Results:

```

```

#### 5.1.3 Summarization Scenario Benchmark

##### 5.1.3.1 Low Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Test Results:

```

```

##### 5.1.3.2 Medium Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Test Results:

```

```

##### 5.1.3.3 High Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-235B-A22B-Instruct-2507 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 320 \
  --max-concurrency 64
```

- Test Results:

```

```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

- **Benchmark Command:**

```shell
python3 -m sglang.test.few_shot_gsm8k --num-questions 200
```

- **Results**:

  - Step3.5
    ```

    ```
