# GLM-4.5

## 1. Model Introduction

[GLM-4.5](https://huggingface.co/zai-org/GLM-4.5) is a powerful language model developed by Zhipu AI, featuring advanced capabilities in reasoning, function calling, and multi-modal understanding.

**Key Features:**

- **Advanced Reasoning**: Built-in reasoning capabilities for complex problem-solving
- **Multiple Quantizations**: BF16 and FP8 variants for different performance/memory trade-offs
- **Hardware Optimization**: Specifically tuned for AMD MI300X/MI325X/MI355X GPUs
- **High Performance**: Optimized for both throughput and latency scenarios

**Available Models:**

- **BF16 (Full precision)**: [zai-org/GLM-4.5](https://huggingface.co/zai-org/GLM-4.5) - Recommended for MI300X/MI325X/MI355X
- **FP8 (8-bit quantized)**: [zai-org/GLM-4.5-FP8](https://huggingface.co/zai-org/GLM-4.5-FP8) - Recommended for MI300X/MI325X/MI355X

**License:**

Please refer to the [official GLM-4.5 model card](https://huggingface.co/zai-org/GLM-4.5) for license details.

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, quantization method, deployment strategy, and thinking capabilities.

import GLM45ConfigGenerator from '@site/src/components/autoregressive/GLM45ConfigGenerator';

<GLM45ConfigGenerator />

### 3.2 Configuration Tips

For more detailed configuration tips, please refer to [GLM-4.5/GLM-4.6 Usage](https://docs.sglang.io/basic_usage/glm45.html).

**EAGLE Speculative Decoding:** SGLang supports GLM-4.5 with [EAGLE speculative decoding](https://docs.sglang.io/advanced_features/speculative_decoding.html#EAGLE-Decoding). Add arguments `--speculative-algorithm`, `--speculative-num-steps`, `--speculative-eagle-topk` and `--speculative-num-draft-tokens` to enable this feature. For example:

```bash
python3 -m sglang.launch_server \
  --model-path zai-org/GLM-4.5-FP8 \
  --tp-size 8 \
  --tool-call-parser glm45 \
  --reasoning-parser glm45 \
  --speculative-algorithm EAGLE \
  --speculative-num-steps 3 \
  --speculative-eagle-topk 1 \
  --speculative-num-draft-tokens 4 \
  --mem-fraction-static 0.9 \
  --served-model-name glm-4.5-fp8 \
  --enable-custom-logit-processor
```

**Tip:** To enable the experimental overlap scheduler for EAGLE speculative decoding, set the environment variable `SGLANG_ENABLE_SPEC_V2=1`. This can improve performance by enabling overlap scheduling between draft and verification stages.

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

### 4.2 Advanced Usage

#### 4.2.1 Reasoning Parser

GLM-4.5 supports Thinking mode by default. Enable the reasoning parser during deployment to separate the thinking and the content sections:

```shell
python -m sglang.launch_server \
  --model zai-org/GLM-4.5 \
  --reasoning-parser glm45 \
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
    model="zai-org/GLM-4.5",
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
To solve this problem, I need to calculate 15% of 240.
Step 1: Convert 15% to decimal: 15% = 0.15
Step 2: Multiply 240 by 0.15
Step 3: 240 × 0.15 = 36
=============== Content =================

The answer is 36. To find 15% of 240, we multiply 240 by 0.15, which equals 36.
```

**Note:** The reasoning parser captures the model's step-by-step thinking process, allowing you to see how the model arrives at its conclusions.

#### 4.2.2 Tool Calling

GLM-4.5 supports tool calling capabilities. Enable the tool call parser:

```shell
python -m sglang.launch_server \
  --model zai-org/GLM-4.5 \
  --reasoning-parser glm45 \
  --tool-call-parser glm45 \
  --tp 8 \
  --host 0.0.0.0 \
  --port 8000
```

**Note:** For GLM-4.5, `--tool-call-parser` should be set to `glm45`.

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
    model="zai-org/GLM-4.5",
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
                    print(f"Tool Call: {tool_call.function.name}")
                    print(f"   Arguments: {tool_call.function.arguments}")

        # Print content
        if delta.content:
            print(delta.content, end="", flush=True)

print()
```

**Output Example:**

```
=============== Thinking =================
The user is asking about the weather in Beijing. I need to use the get_weather function to retrieve this information.
I should call the function with location="Beijing".
=============== Content =================

Tool Call: get_weather
   Arguments: {"location": "Beijing", "unit": "celsius"}
```

#### 4.2.3 Thinking Budget

In SGLang, you can implement thinking budget for GLM-4.5 with `CustomLogitProcessor`.

Launch a server with `--enable-custom-logit-processor` flag on.

Sample Request:

```python
import openai
from rich.pretty import pprint
from sglang.srt.sampling.custom_logit_processor import Glm4MoeThinkingBudgetLogitProcessor


client = openai.Client(base_url="http://127.0.0.1:30000/v1", api_key="*")
response = client.chat.completions.create(
    model="zai-org/GLM-4.5",
    messages=[
        {
            "role": "user",
            "content": "Question: Is Paris the Capital of France?",
        }
    ],
    max_tokens=1024,
    extra_body={
        "custom_logit_processor": Glm4MoeThinkingBudgetLogitProcessor().to_str(),
        "custom_params": {
            "thinking_budget": 512,
        },
    },
)
pprint(response)
```

## 5. Benchmark

This section uses **industry-standard configurations** for comparable benchmark results.

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: AMD MI300X (8x), AMD MI325X (8x), AMD MI355X (8x)
- Model: GLM-4.5
- Tensor Parallelism: 8
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
  --model zai-org/GLM-4.5 \
  --tp 8
```


- Low Concurrency (Latency-Optimized)

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/GLM-4.5 \
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
  --model zai-org/GLM-4.5 \
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
  --model zai-org/GLM-4.5 \
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
  --model zai-org/GLM-4.5 \
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
  --model zai-org/GLM-4.5 \
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
  --model zai-org/GLM-4.5 \
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
  --model zai-org/GLM-4.5 \
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
  --model zai-org/GLM-4.5 \
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
  --model zai-org/GLM-4.5 \
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
  --port 30000
```
