# GLM-4.5V

## 1. Model Introduction

[GLM-4.5V](https://huggingface.co/zai-org/GLM-4.5V) is a state-of-the-art multimodal vision-language model from ZhipuAI, built on the next-generation flagship text foundation model GLM-4.5-Air (106B parameters, 12B active). It achieves SOTA performance among models of the same scale across 42 public vision-language benchmarks. Through efficient hybrid training, GLM-4.5V focuses on real-world usability and enables full-spectrum vision reasoning across diverse visual content types.

GLM-4.5V introduces several key features:

- **Image Reasoning & Grounding** Scene understanding, complex multi-image analysis, and spatial recognition with precise visual element localization. Supports bounding box predictions with normalized coordinates (0-1000) for accurate object detection.
- **Video Understanding** Long video segmentation and event recognition, supporting comprehensive temporal analysis across extended video sequences.
- **GUI Agent Tasks** Screen reading, icon recognition, and desktop operation assistance for agent-based applications. Enables natural interaction with graphical user interfaces.
- **Complex Chart & Long Document Parsing** Research report analysis and information extraction from documents with text, charts, tables, and figures. Processes up to 64K tokens of multimodal context.
- **Thinking Mode Switch** Allows users to balance between quick responses and deep reasoning. Users can enable/disable Chain-of-Thought reasoning based on task requirements for improved accuracy and interpretability.

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

The GLM-4.5V offers models in various sizes and architectures, optimized for different hardware platforms. The recommended launch configurations vary by hardware and model size.

**Interactive Command Generator**: Use the interactive configuration generator below to customize your deployment settings. Select your hardware platform, model size, quantization method, and other options to generate the appropriate launch command.

import GLM45VConfigGenerator from '@site/src/components/GLM45VConfigGenerator';

<GLM45VConfigGenerator />

### 3.2 Configuration Tips

For more detailed configuration tips, please refer to [GLM-4.5V/GLM-4.6V Usage](https://docs.sglang.io/basic_usage/glmv.html).

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)
- [SGLang OpenAI Vision API Guide](https://docs.sglang.ai/basic_usage/openai_api_vision.html)

### 4.2 Advanced Usage

#### 4.2.1 Multi-Modal Inputs

GLM-4.5V supports both image and video inputs. Here's a basic example with image input:

```python
import time
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:30000/v1",
    timeout=3600
)

messages = [
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
                "text": "Describe this image in detail."
            }
        ]
    }
]

start = time.time()
response = client.chat.completions.create(
    model="zai-org/GLM-4.5V",
    messages=messages,
    max_tokens=2048
)
print(f"Response costs: {time.time() - start:.2f}s")
print(f"Generated text: {response.choices[0].message.content}")
```

**Example Output:**

```text
Response costs: 3.37s
Generated text: Auntie Anne's

CINNAMON SUGAR
1 x 17,000                    17,000

SUB TOTAL                    17,000

GRAND TOTAL                  17,000

CASH IDR                     20,000

CHANGE DUE                  3,000
```

**Multi-Image Input Example:**

GLM-4.5V can process multiple images in a single request for comparison or analysis:

```python
import time
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:30000/v1",
    timeout=3600
)

messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {
                    "url": "https://www.civitatis.com/f/china/hong-kong/guia/taxi.jpg"
                }
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": "https://cdn.cheapoguides.com/wp-content/uploads/sites/7/2025/05/GettyImages-509614603-1280x600.jpg"
                }
            },
            {
                "type": "text",
                "text": "Compare these two images and describe the differences in 100 words or less. Focus on the key visual elements, colors, textures, and any notable contrasts between the two scenes. Be specific about what you see in each image."
            }
        ]
    }
]

start = time.time()
response = client.chat.completions.create(
    model="zai-org/GLM-4.5V",
    messages=messages,
    max_tokens=2048
)
print(f"Response costs: {time.time() - start:.2f}s")
print(f"Generated text: {response.choices[0].message.content}")
```

**Example Output:**

```text
Response costs: 3.86s
Generated text: The first image shows a close - up of a few red taxis on a street with storefronts in the background. The taxis are in a line, and the scene has an urban, busy feel with visible shop displays. The second image is an aerial view of a large taxi parking area with numerous red and green taxis, some with hoods open. The scene is more open, with a parking lot layout, and includes elements like a bridge and grassy areas. Key differences: number of taxis (few vs many), perspective (close - up vs aerial), color variety (mostly red vs red and green), and setting (street with shops vs parking lot).
```

**Video Input Example:**

GLM-4.5V supports video understanding by processing video URLs:

```python
import time
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:30000/v1",
    timeout=3600
)

messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "video_url",
                "video_url": {
                    "url": "https://videos.pexels.com/video-files/4114797/4114797-uhd_3840_2160_25fps.mp4"
                }
            },
            {
                "type": "text",
                "text": "Describe what happens in this video."
            }
        ]
    }
]

start = time.time()
response = client.chat.completions.create(
    model="zai-org/GLM-4.5V",
    messages=messages,
    max_tokens=2048
)
print(f"Response costs: {time.time() - start:.2f}s")
print(f"Generated text: {response.choices[0].message.content}")
```

**Note:**

- For video processing, ensure you have sufficient context length configured (up to 64K tokens)
- Video processing may require more memory; adjust `--mem-fraction-static` accordingly
- You can also provide local file paths using `file://` protocol

**Example Output:**

```text
Response costs: 3.89s
Generated text: A person wearing blue gloves is using a microscope. They are adjusting the focus knob with one hand while holding a pipette with the other, suggesting they are preparing or examining a sample on the slide beneath the objective lens. The microscope's 40x objective lens is positioned over the slide, indicating a high-magnification observation. The person carefully manipulates the slide and the microscope controls, likely to achieve a clear view of the specimen.
```

#### 4.2.2 Thinking Mode

GLM-4.5V supports thinking mode for enhanced reasoning. Enable thinking mode during deployment:

```shell
python -m sglang.launch_server \
  --model-path zai-org/GLM-4.5V \
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
    model="zai-org/GLM-4.5V",
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
    model="zai-org/GLM-4.5V",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    extra_body={"chat_template_kwargs": {"enable_thinking": False}}
)
```

#### 4.2.3 Tool Calling

GLM-4.5V supports tool calling capabilities. Enable the tool call parser:

```shell
python -m sglang.launch_server \
  --model-path zai-org/GLM-4.5V \
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
    model="zai-org/GLM-4.5V",
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

```text
=============== Thinking =================
The user is asking about the weather in Beijing. I need to use the get_weather function to retrieve this information.
I should call the function with location="Beijing".
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
    model="zai-org/GLM-4.5V",
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

- Hardware: NVIDIA B200 GPU (8x)
- Model: GLM-4.5V
- Tensor Parallelism: 4
- SGLang Version: 0.5.6.post2

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
  --model zai-org/GLM-4.5V \
  --tp 4
```

- Low Concurrency (Latency-Optimized)

  ```bash
  python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/GLM-4.5V \
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
  Benchmark duration (s):                  31.73
  Total input tokens:                      6101
  Total input text tokens:                 6101
  Total input vision tokens:               0
  Total generated tokens:                  4220
  Total generated tokens (retokenized):    4220
  Request throughput (req/s):              0.32
  Input token throughput (tok/s):          192.27
  Output token throughput (tok/s):         132.99
  Peak output token throughput (tok/s):    137.00
  Peak concurrent requests:                2
  Total token throughput (tok/s):          325.27
  Concurrency:                             1.00
  ----------------End-to-End Latency----------------
  Mean E2E Latency (ms):                   3171.43
  Median E2E Latency (ms):                 2541.60
  ---------------Time to First Token----------------
  Mean TTFT (ms):                          78.10
  Median TTFT (ms):                        79.17
  P99 TTFT (ms):                           85.28
  -----Time per Output Token (excl. 1st token)------
  Mean TPOT (ms):                          7.34
  Median TPOT (ms):                        7.34
  P99 TPOT (ms):                           7.36
  ---------------Inter-Token Latency----------------
  Mean ITL (ms):                           7.35
  Median ITL (ms):                         7.35
  P95 ITL (ms):                            7.65
  P99 ITL (ms):                            7.84
  Max ITL (ms):                            10.81
  ==================================================
  ```
- Medium Concurrency (Balanced)

  ```bash
  python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/GLM-4.5V \
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
  Benchmark duration (s):                  39.58
  Total input tokens:                      39668
  Total input text tokens:                 39668
  Total input vision tokens:               0
  Total generated tokens:                  40805
  Total generated tokens (retokenized):    40789
  Request throughput (req/s):              2.02
  Input token throughput (tok/s):          1002.13
  Output token throughput (tok/s):         1030.85
  Peak output token throughput (tok/s):    1387.00
  Peak concurrent requests:                21
  Total token throughput (tok/s):          2032.98
  Concurrency:                             13.86
  ----------------End-to-End Latency----------------
  Mean E2E Latency (ms):                   6857.22
  Median E2E Latency (ms):                 7337.89
  ---------------Time to First Token----------------
  Mean TTFT (ms):                          122.50
  Median TTFT (ms):                        86.04
  P99 TTFT (ms):                           268.66
  -----Time per Output Token (excl. 1st token)------
  Mean TPOT (ms):                          13.44
  Median TPOT (ms):                        13.59
  P99 TPOT (ms):                           17.64
  ---------------Inter-Token Latency----------------
  Mean ITL (ms):                           13.23
  Median ITL (ms):                         11.81
  P95 ITL (ms):                            12.83
  P99 ITL (ms):                            68.46
  Max ITL (ms):                            425.47
  ==================================================
  ```
- High Concurrency (Throughput-Optimized)

  ```bash
  python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/GLM-4.5V \
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
  Benchmark duration (s):                  76.34
  Total input tokens:                      249831
  Total input text tokens:                 249831
  Total input vision tokens:               0
  Total generated tokens:                  252662
  Total generated tokens (retokenized):    252555
  Request throughput (req/s):              6.55
  Input token throughput (tok/s):          3272.53
  Output token throughput (tok/s):         3309.62
  Peak output token throughput (tok/s):    5600.00
  Peak concurrent requests:                111
  Total token throughput (tok/s):          6582.15
  Concurrency:                             91.02
  ----------------End-to-End Latency----------------
  Mean E2E Latency (ms):                   13897.88
  Median E2E Latency (ms):                 13367.64
  ---------------Time to First Token----------------
  Mean TTFT (ms):                          178.94
  Median TTFT (ms):                        107.10
  P99 TTFT (ms):                           481.15
  -----Time per Output Token (excl. 1st token)------
  Mean TPOT (ms):                          27.43
  Median TPOT (ms):                        28.84
  P99 TPOT (ms):                           33.89
  ---------------Inter-Token Latency----------------
  Mean ITL (ms):                           27.20
  Median ITL (ms):                         18.35
  P95 ITL (ms):                            81.30
  P99 ITL (ms):                            93.92
  Max ITL (ms):                            419.54
  ==================================================
  ```

**Scenario 2: Reasoning (1K/8K)**

- Low Concurrency

  ```bash
  python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/GLM-4.5V \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
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
  Benchmark duration (s):                  331.40
  Total input tokens:                      6101
  Total input text tokens:                 6101
  Total input vision tokens:               0
  Total generated tokens:                  44462
  Total generated tokens (retokenized):    44437
  Request throughput (req/s):              0.03
  Input token throughput (tok/s):          18.41
  Output token throughput (tok/s):         134.16
  Peak output token throughput (tok/s):    137.00
  Peak concurrent requests:                2
  Total token throughput (tok/s):          152.57
  Concurrency:                             1.00
  ----------------End-to-End Latency----------------
  Mean E2E Latency (ms):                   33138.51
  Median E2E Latency (ms):                 35722.39
  ---------------Time to First Token----------------
  Mean TTFT (ms):                          111.25
  Median TTFT (ms):                        82.99
  P99 TTFT (ms):                           357.33
  -----Time per Output Token (excl. 1st token)------
  Mean TPOT (ms):                          7.40
  Median TPOT (ms):                        7.41
  P99 TPOT (ms):                           7.46
  ---------------Inter-Token Latency----------------
  Mean ITL (ms):                           7.43
  Median ITL (ms):                         7.43
  P95 ITL (ms):                            7.74
  P99 ITL (ms):                            7.90
  Max ITL (ms):                            12.78
  ==================================================
  ```
- Medium Concurrency

  ```bash
  python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/GLM-4.5V \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
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
  Benchmark duration (s):                  275.93
  Total input tokens:                      39668
  Total input text tokens:                 39668
  Total input vision tokens:               0
  Total generated tokens:                  318306
  Total generated tokens (retokenized):    318123
  Request throughput (req/s):              0.29
  Input token throughput (tok/s):          143.76
  Output token throughput (tok/s):         1153.58
  Peak output token throughput (tok/s):    1360.00
  Peak concurrent requests:                19
  Total token throughput (tok/s):          1297.34
  Concurrency:                             13.99
  ----------------End-to-End Latency----------------
  Mean E2E Latency (ms):                   48266.89
  Median E2E Latency (ms):                 48964.69
  ---------------Time to First Token----------------
  Mean TTFT (ms):                          97.61
  Median TTFT (ms):                        89.42
  P99 TTFT (ms):                           135.12
  -----Time per Output Token (excl. 1st token)------
  Mean TPOT (ms):                          12.15
  Median TPOT (ms):                        12.27
  P99 TPOT (ms):                           12.46
  ---------------Inter-Token Latency----------------
  Mean ITL (ms):                           12.11
  Median ITL (ms):                         12.04
  P95 ITL (ms):                            12.59
  P99 ITL (ms):                            13.36
  Max ITL (ms):                            84.53
  ==================================================
  ```
- High Concurrency

  ```bash
  python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/GLM-4.5V \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 320 \
  --max-concurrency 64 \
  --request-rate inf
  ```

  ```
  ============ Serving Benchmark Result ============
  Backend:                                 sglang
  Traffic request rate:                    inf
  Max request concurrency:                 64
  Successful requests:                     320
  Benchmark duration (s):                  441.00
  Total input tokens:                      158939
  Total input text tokens:                 158939
  Total input vision tokens:               0
  Total generated tokens:                  1301025
  Total generated tokens (retokenized):    1300139
  Request throughput (req/s):              0.73
  Input token throughput (tok/s):          360.40
  Output token throughput (tok/s):         2950.15
  Peak output token throughput (tok/s):    3737.00
  Peak concurrent requests:                68
  Total token throughput (tok/s):          3310.56
  Concurrency:                             56.52
  ----------------End-to-End Latency----------------
  Mean E2E Latency (ms):                   77896.94
  Median E2E Latency (ms):                 81037.84
  ---------------Time to First Token----------------
  Mean TTFT (ms):                          195.87
  Median TTFT (ms):                        113.26
  P99 TTFT (ms):                           533.00
  -----Time per Output Token (excl. 1st token)------
  Mean TPOT (ms):                          19.21
  Median TPOT (ms):                        19.60
  P99 TPOT (ms):                           20.50
  ---------------Inter-Token Latency----------------
  Mean ITL (ms):                           19.12
  Median ITL (ms):                         18.63
  P95 ITL (ms):                            20.22
  P99 ITL (ms):                            71.08
  Max ITL (ms):                            395.76
  ==================================================
  ```

**Scenario 3: Summarization (8K/1K)**

- Low Concurrency

  ```bash
  python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/GLM-4.5V \
  --dataset-name random \
  --random-input-len 8000 \
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
  Benchmark duration (s):                  32.56
  Total input tokens:                      41941
  Total input text tokens:                 41941
  Total input vision tokens:               0
  Total generated tokens:                  4220
  Total generated tokens (retokenized):    4220
  Request throughput (req/s):              0.31
  Input token throughput (tok/s):          1287.96
  Output token throughput (tok/s):         129.59
  Peak output token throughput (tok/s):    136.00
  Peak concurrent requests:                2
  Total token throughput (tok/s):          1417.55
  Concurrency:                             1.00
  ----------------End-to-End Latency----------------
  Mean E2E Latency (ms):                   3254.73
  Median E2E Latency (ms):                 2645.21
  ---------------Time to First Token----------------
  Mean TTFT (ms):                          106.04
  Median TTFT (ms):                        98.62
  P99 TTFT (ms):                           170.16
  -----Time per Output Token (excl. 1st token)------
  Mean TPOT (ms):                          7.46
  Median TPOT (ms):                        7.48
  P99 TPOT (ms):                           7.60
  ---------------Inter-Token Latency----------------
  Mean ITL (ms):                           7.48
  Median ITL (ms):                         7.48
  P95 ITL (ms):                            7.83
  P99 ITL (ms):                            7.98
  Max ITL (ms):                            11.18
  ==================================================
  ```
- Medium Concurrency

  ```bash
  python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/GLM-4.5V \
  --dataset-name random \
  --random-input-len 8000 \
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
  Benchmark duration (s):                  42.16
  Total input tokens:                      300020
  Total input text tokens:                 300020
  Total input vision tokens:               0
  Total generated tokens:                  41669
  Total generated tokens (retokenized):    41662
  Request throughput (req/s):              1.90
  Input token throughput (tok/s):          7116.21
  Output token throughput (tok/s):         988.35
  Peak output token throughput (tok/s):    1328.00
  Peak concurrent requests:                21
  Total token throughput (tok/s):          8104.56
  Concurrency:                             14.06
  ----------------End-to-End Latency----------------
  Mean E2E Latency (ms):                   7410.61
  Median E2E Latency (ms):                 7902.77
  ---------------Time to First Token----------------
  Mean TTFT (ms):                          157.80
  Median TTFT (ms):                        134.71
  P99 TTFT (ms):                           541.01
  -----Time per Output Token (excl. 1st token)------
  Mean TPOT (ms):                          14.29
  Median TPOT (ms):                        14.38
  P99 TPOT (ms):                           21.88
  ---------------Inter-Token Latency----------------
  Mean ITL (ms):                           13.95
  Median ITL (ms):                         12.08
  P95 ITL (ms):                            12.75
  P99 ITL (ms):                            75.56
  Max ITL (ms):                            420.91
  ==================================================
  ```
- High Concurrency

  ```bash
  python -m sglang.bench_serving \
  --backend sglang \
  --model zai-org/GLM-4.5V \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 320 \
  --max-concurrency 64 \
  --request-rate inf
  ```

  ```
  ============ Serving Benchmark Result ============
  Backend:                                 sglang
  Traffic request rate:                    inf
  Max request concurrency:                 64
  Successful requests:                     320
  Benchmark duration (s):                  79.79
  Total input tokens:                      1273893
  Total input text tokens:                 1273893
  Total input vision tokens:               0
  Total generated tokens:                  170000
  Total generated tokens (retokenized):    169973
  Request throughput (req/s):              4.01
  Input token throughput (tok/s):          15965.69
  Output token throughput (tok/s):         2130.61
  Peak output token throughput (tok/s):    3209.00
  Peak concurrent requests:                71
  Total token throughput (tok/s):          18096.30
  Concurrency:                             58.71
  ----------------End-to-End Latency----------------
  Mean E2E Latency (ms):                   14639.63
  Median E2E Latency (ms):                 14680.40
  ---------------Time to First Token----------------
  Mean TTFT (ms):                          221.20
  Median TTFT (ms):                        154.33
  P99 TTFT (ms):                           812.17
  -----Time per Output Token (excl. 1st token)------
  Mean TPOT (ms):                          27.44
  Median TPOT (ms):                        28.54
  P99 TPOT (ms):                           34.12
  ---------------Inter-Token Latency----------------
  Mean ITL (ms):                           27.19
  Median ITL (ms):                         19.10
  P95 ITL (ms):                            81.03
  P99 ITL (ms):                            116.53
  Max ITL (ms):                            410.46
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
- **Variable Concurrency**: Captures the Pareto frontier - the optimal tradeoff between throughput and latency at different load levels. Low concurrency shows best-case latency, high concurrency shows maximum throughput.

**Interpreting Results:**

- Compare your results against baseline numbers for your hardware
- Higher throughput at same latency = better performance
- Lower TTFT = more responsive user experience
- Lower TPOT = faster generation speed

### 5.2 Accuracy Benchmark

Document model accuracy on standard benchmarks:

#### 5.2.1 MMMU Benchmark

- Benchmark Command

```bash
python3 benchmark/mmmu/bench_sglang.py --port 30000 --concurrency 64 --extra-request-body '{"max_tokens": 4096}'
```

- Test Result

```
Benchmark time: 971.1949279410765
answers saved to: ./answer_sglang.json
Evaluating...
answers saved to: ./answer_sglang.json
{'Accounting': {'acc': 0.867, 'num': 30},
 'Agriculture': {'acc': 0.567, 'num': 30},
 'Architecture_and_Engineering': {'acc': 0.567, 'num': 30},
 'Art': {'acc': 0.7, 'num': 30},
 'Art_Theory': {'acc': 0.9, 'num': 30},
 'Basic_Medical_Science': {'acc': 0.767, 'num': 30},
 'Biology': {'acc': 0.567, 'num': 30},
 'Chemistry': {'acc': 0.567, 'num': 30},
 'Clinical_Medicine': {'acc': 0.667, 'num': 30},
 'Computer_Science': {'acc': 0.8, 'num': 30},
 'Design': {'acc': 0.833, 'num': 30},
 'Diagnostics_and_Laboratory_Medicine': {'acc': 0.667, 'num': 30},
 'Economics': {'acc': 0.9, 'num': 30},
 'Electronics': {'acc': 0.467, 'num': 30},
 'Energy_and_Power': {'acc': 0.633, 'num': 30},
 'Finance': {'acc': 0.8, 'num': 30},
 'Geography': {'acc': 0.7, 'num': 30},
 'History': {'acc': 0.733, 'num': 30},
 'Literature': {'acc': 0.9, 'num': 30},
 'Manage': {'acc': 0.733, 'num': 30},
 'Marketing': {'acc': 0.9, 'num': 30},
 'Materials': {'acc': 0.667, 'num': 30},
 'Math': {'acc': 0.759, 'num': 29},
 'Mechanical_Engineering': {'acc': 0.567, 'num': 30},
 'Music': {'acc': 0.267, 'num': 30},
 'Overall': {'acc': 0.721, 'num': 899},
 'Overall-Art and Design': {'acc': 0.675, 'num': 120},
 'Overall-Business': {'acc': 0.84, 'num': 150},
 'Overall-Health and Medicine': {'acc': 0.773, 'num': 150},
 'Overall-Humanities and Social Science': {'acc': 0.767, 'num': 120},
 'Overall-Science': {'acc': 0.705, 'num': 149},
 'Overall-Tech and Engineering': {'acc': 0.61, 'num': 210},
 'Pharmacy': {'acc': 0.9, 'num': 30},
 'Physics': {'acc': 0.933, 'num': 30},
 'Psychology': {'acc': 0.767, 'num': 30},
 'Public_Health': {'acc': 0.867, 'num': 30},
 'Sociology': {'acc': 0.667, 'num': 30}}
eval out saved to ./val_sglang.json
Overall accuracy: 0.721
```
