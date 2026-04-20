# Kimi-K2.6

## 1. Model Introduction

[Kimi-K2.6](https://huggingface.co/moonshotai/Kimi-K2.6) is an open-source, native multimodal agentic model by Moonshot AI, delivering industry-leading coding, long-horizon execution, and agent swarm capabilities. It matches or surpasses GPT-5.4, Claude Opus 4.6, and Gemini 3.1 Pro across key benchmarks.

**Key Features:**

- **Long-Horizon Coding**: Excels at complex, end-to-end coding tasks with 13+ hours of continuous execution and 4,000+ lines of code modification, generalizing across languages (Rust, Go, Python) and tasks (frontend, devops, performance optimization).
- **Coding-Driven Design**: Transforms prompts and visual inputs into production-ready interfaces with motion-rich elements including WebGL shaders, GSAP + Framer Motion, and Three.js 3D.
- **Agent Swarms Elevated**: Scales to 300 parallel sub-agents executing 4,000 coordinated steps per run. One prompt, 100+ files.
- **Proactive Agents**: Powers OpenClaw, Hermes Agent, and other autonomous frameworks for 5-day continuous operation.
- **Native Multimodality**: Pre-trained on vision–language tokens with MoonViT (400M parameters) for visual understanding, cross-modal reasoning, and agentic tool use grounded in visual inputs.

**Benchmarks (Open-Source SOTA):**
- HLE w/ tools: 54.0
- SWE-Bench Pro: 58.6
- SWE-bench Multilingual: 76.7
- BrowseComp: 83.2
- Toolathlon: 50.0
- AIME 2026: 96.4
- GPQA-Diamond: 90.5
- LiveCodeBench: 89.6

**Architecture:**

| Component | Specification |
|-----------|---------------|
| Total Parameters | 1 Trillion |
| Activated Parameters | 32 Billion |
| Architecture | Mixture-of-Experts (MoE) |
| Number of Layers | 61 (including 1 dense layer) |
| Attention Mechanism | MLA |
| Attention Heads | 64 |
| Number of Experts | 384 |
| Experts per Token | 8 + 1 shared |
| Context Length | 256K tokens |
| Vocabulary Size | 160K |
| Vision Encoder | MoonViT (400M) |
| Activation Function | SwiGLU |

**Available Models**:
- INT4 (Initial Released): [moonshotai/Kimi-K2.6](https://huggingface.co/moonshotai/Kimi-K2.6)

For details, see [official documentation](https://huggingface.co/moonshotai/Kimi-K2.6) and [tech blog](https://kimi.com/blog/kimi-k2-6).

## 2. SGLang Installation

Refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html).

## 3. Model Deployment

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, deployment strategy, and capabilities.

import KimiK26ConfigGenerator from '@site/src/components/autoregressive/KimiK26ConfigGenerator';

<KimiK26ConfigGenerator />

### 3.2 Configuration Tips

- **Memory**: Requires GPUs with ≥140GB each. Supported platforms: H200 (8×, TP=8), B300 (8×, TP=8), MI300X/MI325X (4×, TP=4), MI350X/MI355X (4×, TP=4). Use `--context-length 128000` to conserve memory.
- **AMD GPU TP Constraint**: On AMD GPUs, TP must be ≤ 4 (not 8). Kimi-K2.6 has 64 attention heads; the AITER MLA kernel requires `heads_per_gpu % 16 == 0`. With TP=4, each GPU gets 16 heads (valid). With TP=8, each GPU gets 8 heads (invalid).
- **AMD Docker Image**: Use `lmsysorg/sglang:v0.5.9-rocm700-mi35x` for MI350X/MI355X and `lmsysorg/sglang:v0.5.9-rocm700-mi30x` for MI300X/MI325X.
- **DP Attention**: Enable with `--dp <N> --enable-dp-attention` for production throughput. A common choice is to set `--dp` equal to `--tp`, but this is not required.
- **Reasoning Parser**: Add `--reasoning-parser kimi_k2` to separate thinking and content in model outputs.
- **Tool Call Parser**: Add `--tool-call-parser kimi_k2` for structured tool calls.

## 4. Model Invocation

### 4.1 Basic Usage

See [Basic API Usage](https://docs.sglang.ai/basic_usage/send_request.html).

### 4.2 Advanced Usage

#### 4.2.1 Multimodal (Vision + Text) Input

Kimi-K2.6 supports native multimodal input with images:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY"
)

response = client.chat.completions.create(
    model="moonshotai/Kimi-K2.6",
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
    ]
)

print(response.choices[0].message.content)
```

#### 4.2.2 Reasoning Output

Kimi-K2.6 supports both thinking mode (default) and instant mode.

**Thinking Mode (default)** — reasoning content is automatically separated:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY"
)

response = client.chat.completions.create(
    model="moonshotai/Kimi-K2.6",
    messages=[
        {"role": "user", "content": "Which one is bigger, 9.11 or 9.9? Think carefully."}
    ]
)

print("====== Reasoning Content (Thinking Mode) ======")
print(response.choices[0].message.reasoning_content)
print("====== Response (Thinking Mode) ======")
print(response.choices[0].message.content)
```

**Instant Mode (thinking off)** — disable thinking for faster responses:

```python
response = client.chat.completions.create(
    model="moonshotai/Kimi-K2.6",
    messages=[
        {"role": "user", "content": "Which one is bigger, 9.11 or 9.9? Think carefully."}
    ],
    extra_body={"chat_template_kwargs": {"thinking": False}}
)

print("====== Response (Instant Mode) ======")
print(response.choices[0].message.content)
```

#### 4.2.3 Tool Calling

Kimi-K2.6 supports tool calling capabilities for agentic tasks:

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
    model="moonshotai/Kimi-K2.6",
    messages=[
        {"role": "user", "content": "What's the weather in Beijing?"}
    ],
    tools=tools,
    stream=True
)

# Process streaming response
tool_calls_accumulator = {}

for chunk in response:
    if chunk.choices and len(chunk.choices) > 0:
        delta = chunk.choices[0].delta

        if hasattr(delta, 'tool_calls') and delta.tool_calls:
            for tool_call in delta.tool_calls:
                index = tool_call.index
                if index not in tool_calls_accumulator:
                    tool_calls_accumulator[index] = {'name': None, 'arguments': ''}
                if tool_call.function:
                    if tool_call.function.name:
                        tool_calls_accumulator[index]['name'] = tool_call.function.name
                    if tool_call.function.arguments:
                        tool_calls_accumulator[index]['arguments'] += tool_call.function.arguments

        if delta.content:
            print(delta.content, end="", flush=True)

for index, tool_call in sorted(tool_calls_accumulator.items()):
    print(f"Tool Call: {tool_call['name']}")
    print(f"  Arguments: {tool_call['arguments']}")
```

**Handling Tool Call Results:**

```python
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
        "content": "The weather in Beijing is 22°C and sunny."
    }
]

final_response = client.chat.completions.create(
    model="moonshotai/Kimi-K2.6",
    messages=messages
)

print(final_response.choices[0].message.content)
```

#### 4.2.4 Multimodal + Tool Calling (Agentic Vision)

Combine vision understanding with tool calling for advanced agentic tasks:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
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
    model="moonshotai/Kimi-K2.6",
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
    tools=tools
)

msg = response.choices[0].message

# Print reasoning process
if msg.reasoning_content:
    print("=== Reasoning ===")
    print(msg.reasoning_content)

# Print response content
if msg.content:
    print("=== Content ===")
    print(msg.content)

# Print tool calls
if msg.tool_calls:
    print("=== Tool Calls ===")
    for tc in msg.tool_calls:
        print(f"  Function: {tc.function.name}")
        print(f"  Arguments: {tc.function.arguments}")
```

#### 4.2.5 Speculative Decoding

**Nvidia**

Deploy Kimi-K2.6 with the following command (H200/B200, all features enabled):

```shell
SGLANG_ENABLE_SPEC_V2=1 sglang serve \
  --model-path moonshotai/Kimi-K2.6 \
  --tp 8 \
  --reasoning-parser kimi_k2 \
  --tool-call-parser kimi_k2 \
  --speculative-algorithm=EAGLE3 \
  --speculative-num-steps 3 \
  --speculative-eagle-topk 1 \
  --speculative-num-draft-tokens 4 \
  --speculative-draft-model-path lightseekorg/kimi-k2.6-eagle3 \
  --trust-remote-code \
  --host 0.0.0.0 \
  --port 30000
```

## 5. Benchmark

### 5.1 Accuracy Benchmark

#### 5.1.1 MMMU Benchmark

You can evaluate the model's accuracy using the MMMU benchmark, which tests multimodal understanding and reasoning across various subjects:

- **Benchmark Command:**

```shell
python3 benchmark/mmmu/bench_sglang.py \
    --response-answer-regex "(?i)(?:answer|ans)[:\s]*(?:\*\*)?[\(\[]?([A-Za-z])[\)\]]?(?:\*\*)?" \
    --port 30000 \
    --concurrency 64
```

- **Result:**

```text
Pending update...
```

### 5.2 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA H200 GPU (8x)
- Model: Kimi-K2.6
- Tensor Parallelism: 8
- SGLang Version: 0.5.9

We use SGLang's built-in benchmarking tool with the `random` dataset for standardized performance evaluation.

#### 5.2.1 Latency Benchmark

- **Model Deployment:**

```bash
sglang serve \
  --model-path moonshotai/Kimi-K2.6 \
  --tp 8 \
  --trust-remote-code \
  --host 0.0.0.0 \
  --port 30000
```

- **Benchmark Command:**

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.6 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

- **Results:**

```
Pending update...
```

- Medium Concurrency (Balanced)

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.6 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16 \
  --request-rate inf
```

```
Pending update...
```

- High Concurrency (Throughput-Optimized)

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2.6 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 500 \
  --max-concurrency 100 \
  --request-rate inf
```

```
Pending update...
```
