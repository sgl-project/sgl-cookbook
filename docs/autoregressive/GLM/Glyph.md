# GLM Glyph

## 1. Model Introduction

[Glyph](https://huggingface.co/zai-org/Glyph) is a powerful language model developed by Zhipu AI, featuring advanced capabilities in reasoning, function calling, and multi-modal understanding.

**Hardware Support:** AMD MI300X/MI325X/MI355X

**Key Features:**

- **Advanced Reasoning**: Built-in reasoning capabilities for complex problem-solving
- **Multiple Quantizations**: BF16 and FP8 variants for different performance/memory trade-offs
- **Hardware Optimization**: Specifically tuned for AMD MI300X/MI325X/MI355X GPUs
- **High Performance**: Optimized for both throughput and latency scenarios

**Available Models:**

- **BF16 (Full precision)**: [zai-org/Glyph](https://huggingface.co/zai-org/Glyph) - Recommended for MI300X/MI325X/MI355X
- **FP8 (8-bit quantized)**: [zai-org/Glyph-FP8](https://huggingface.co/zai-org/Glyph-FP8) - Recommended for MI300X/MI325X/MI355X

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

#### 4.2.1 Reasoning Parser

Glyph supports Thinking mode by default. Enable the reasoning parser during deployment to separate the thinking and the content sections:

```shell
python3 -m sglang.launch_server \
  --model-path zai-org/Glyph \
  --reasoning-parser glm45 \
  --tp-size 4
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

#### 4.2.2 Tool Calling

Glyph supports tool calling capabilities. Enable the tool call parser:

```shell
python3 -m sglang.launch_server \
  --model-path zai-org/Glyph \
  --reasoning-parser glm45 \
  --tool-call-parser glm45 \
  --tp-size 4
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

response = client.chat.completions.create(
    model="zai-org/Glyph",
    messages=[
        {"role": "user", "content": "What's the weather in Beijing?"}
    ],
    tools=tools,
    temperature=0.7
)

print(response.choices[0].message)
```

## 5. Benchmark

This section uses **industry-standard configurations** for comparable benchmark results.

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: AMD MI300X (8x), AMD MI325X (8x), AMD MI355X (8x)
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
