# Intern-S1

## 1. Model Introduction

[Intern-S1 series](https://github.com/InternLM/Intern-S1) are the scientific multimodal large models with both strong general capabilities and the SOTA performance on various scientific tasks.

This generation delivers comprehensive upgrades across the board:

- Strong performance across language and vision reasoning benchmarks, especially scientific tasks.

- Continuously pretrained on a massive 5T token dataset, with over 50% specialized scientific data, embedding deep domain expertise.

- Dynamic tokenizer enables native understanding of molecular formulas, protein sequences, and seismic signals.

For more details, please refer to the [official Intern-S1 GitHub Repository](https://github.com/InternLM/Intern-S1).

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

The Intern-S1 series offers models in various sizes and architectures, optimized for different hardware platforms. The recommended launch configurations vary by hardware and model size.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model size, quantization method, and thinking capabilities.

import InternS1ConfigGenerator from '@site/src/components/InternS1ConfigGenerator';

<InternS1ConfigGenerator />

### 3.2 Configuration Tips

- **Multimodal attention backend** : Usually, `--mm-attention-backend` is default to `fa3` on H100/H200/A100 for better performance, but it is default to `triton_attn` on B200 for compatibility.
- **TTFT Optimization** : Set `SGLANG_USE_CUDA_IPC_TRANSPORT=1` to use CUDA IPC for transferring multimodal features, which significantly improves TTFT. This consumes additional memory and may require adjusting `--mem-fraction-static` and/or `--max-running-requests`. (additional memory is proportional to image size \* number of images in current running requests.)
- **Memory Management** : Set lower `--context-length` to conserve memory. A value of `128000` is sufficient for most scenarios, down from the default 262K.
- **Only For Intern-S1**:
  - **Expert Parallelism** : SGLang supports Expert Parallelism (EP) via `--ep`, allowing experts in MoE models to be deployed on separate GPUs for better throughput. One thing to note is that, for quantized models, you need to set `--ep` to a value that satisfies the requirement: `(moe_intermediate_size / moe_tp_size) % weight_block_size_n == 0, where moe_tp_size is equal to tp_size divided by ep_size.` Note that EP may perform worse in low concurrency scenarios due to additional communication overhead. Check out [Expert Parallelism Deployment](https://github.com/sgl-project/sglang/blob/main/docs/advanced_features/expert_parallelism.md) for more details.
  - **Kernel Tuning** : For MoE Triton kernel tuning on your specific hardware, refer to [fused_moe_triton](https://github.com/sgl-project/sglang/tree/main/benchmark/kernels/fused_moe_triton).

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)
- [SGLang OpenAI Vision API Guide](https://docs.sglang.ai/basic_usage/openai_api_vision.html)

### 4.2 Advanced Usage

#### 4.2.1 Multi-Modal Inputs

Intern-S1 supports both image and video inputs. Here's a basic example with image input:

```python
import time
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:8000/v1",
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
                "text": "Read all the text in the image."
            }
        ]
    }
]

start = time.time()
response = client.chat.completions.create(
    model="internlm/Intern-S1",
    messages=messages,
    max_tokens=2048,

)
print(f"Response costs: {time.time() - start:.2f}s")
print(f"Generated text: {response.choices[0].message.content}")
```

**Example Output:**

```text
Response costs: 5.53s
Generated text:
Okay, let's see. I need to read all the text from this receipt image. The receipt is from Auntie Anne's, which I know is a pretzel chain. The top part has the logo with a pretzel and the name blurred a bit. Then there are some blurred lines, probably the address and other details.

Looking at the items, it shows "CINNAMON SUGAR" with a quantity of 1 and a price of 17,000. The sub total and grand total are both 17,000, which makes sense since there's only one item. Then under payment, it says CASH IDR 20,000 and change due of 3,000. There's some more blurred text at the bottom.

Wait, the currency here is IDR, which is Indonesian Rupiah. So the numbers are in thousands. Let me make sure I got all the numbers right. The item is 17k, total 17k, paid 20k cash, change 3k. The rest of the text is probably standard stuff like date, time, maybe a receipt number, but it's blurred out. I should note that some parts are blurred but the key info is visible.
 </think>

Here is the readable text from the receipt:

---

**Auntie Anne's**
*(Logo: Pretzel with a heart above it)*

CINNAMON SUGAR
1 x 17,000
**SUB TOTAL**
17,000

**GRAND TOTAL**
17,000

**CASH IDR**
20,000

**CHANGE DUE**
3,000

---

*Note: The address, date, time, and other details at the top and bottom of the receipt are blurred and unreadable.*
```

**Multi-Image Input Example:**

Intern-S1 can process multiple images in a single request for comparison or analysis:

```python
import time
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:8000/v1",
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
    model="internlm/Intern-S1",
    messages=messages,
    max_tokens=2048
)
print(f"Response costs: {time.time() - start:.2f}s")
print(f"Generated text: {response.choices[0].message.content}")
```

**Example Output:**

```text
Response costs: 4.98s
Generated text:
Okay, let's tackle this. The user wants a comparison of two images with differences in key elements, colors, textures, and contrasts within 100 words.

First, I need to analyze both images. The first image shows several red taxis on a city street, in motion, with a store backdrop. They're uniform in color, mostly red, with some having advertising. The setting is urban with a taxi license plate visible.

The second image is an aerial view of a chaotic traffic jam with many taxis, most with hoods open, suggesting breakdowns or maintenance. The taxis are a mix of red and green, and there's a pedestrian overpass nearby. The scene is more chaotic and static compared to the first's movement.

Differences to note: the first is dynamic, the second static and disorganized. Colors: mainly red vs. red and green. Textures: shiny cars vs. more cluttered, open hoods. Environment: city street vs. highway with overpass. Notable contrasts: movement vs. congestion, uniformity vs. variety in taxi colors, and the context of the scenes (normal traffic vs. possible taxi protest or breakdowns due to the number with hoods up).
 </think>

The first image shows vibrant red taxis driving on a city street, with one prominently displaying a Toyota grille and taxi sign. The scene is dynamic, with a background of storefronts and a taxi license plate "RX 5004." The second image depicts a chaotic traffic jam of mostly red taxis, many with hoods opened, suggesting mechanical issues or a protest. A few green taxis are visible, adding color contrast. The aerial view reveals a pedestrian bridge and metal barriers, emphasizing disorder. The first image conveys organized urban movement, while the second captures static congestion and disarray. The taxis' shiny exteriors in the first contrast with the haphazard, open-engine chaos of the second.
```

**Video Input Example:(WIP)**

<!-- Intern-S1 supports video understanding by processing video URLs:

```python
import time
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:8000/v1",
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
    model="internlm/Intern-S1",
    messages=messages,
    max_tokens=2048
)
print(f"Response costs: {time.time() - start:.2f}s")
print(f"Generated text: {response.choices[0].message.content}")
```

**Note:**

- For video processing, ensure you have sufficient context length configured (up to 262K tokens)
- Video processing may require more memory; adjust `--mem-fraction-static` accordingly
- You can also provide local file paths using `file://` protocol

**Example Output:**

```text

```

#### TODO： video input has some bug in sglang. -->

#### 4.2.2 Reasoning Parser

Intern-S1 supports reasoning mode. Enable the reasoning parser during deployment to separate the thinking and content sections:

```
python -m sglang.launch_server \
  --model internlm/Intern-S1 \
  --reasoning-parser interns1 \
  --trust-remote-code \
  --tp 8
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
    model="internlm/Intern-S1",
    messages=[
        {"role": "user", "content": "Solve this problem step by step: What is 15% of 240?"}
    ],
    temperature=0.7,
    max_tokens=2048,
    stream=True,
    extra_body={
        "chat_template_kwargs": {"enable_thinking": True},
    }
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

Okay, so I need to figure out what 15% of 240 is. Hmm, percentages can sometimes be tricky, but I remember that "percent" means "per hundred." So, 15% is like 15 per 100. But how do I actually calculate that for 240?

Maybe I can start by recalling the formula for percentages. I think the basic formula is (percentage/100) * total number. So in this case, it would be (15/100) * 240. Let me check if that makes sense. If I have 10% of 240, that's 24, right? Because 10% is easy, you just move the decimal point. So 10% of 240 is 24. Then 5% would be half of that, which is 12. So 10% + 5% = 15%, so 24 + 12 = 36. So maybe the answer is 36? Wait, but let me do it the formula way to confirm.

Using the formula: 15 divided by 100 is 0.15. Then multiply that by 240. Let me do the multiplication. 0.15 * 240. Hmm, 0.1 * 240 is 24, and 0.05 * 240 is 12. So adding those together, 24 + 12 = 36. Yep, same answer. So that seems right.

Alternatively, maybe I can break down 15% into fractions. 15% is the same as 15/100, which can be simplified. Let's see, both 15 and 100 are divisible by 5. So dividing numerator and denominator by 5 gives 3/20. So 3/20 of 240. Then, how do I compute that? Well, 240 divided by 20 is 12, and then multiplied by 3 is 36. Again, same result. Okay, so three different methods give me 36. That seems solid.

Wait, another way: Maybe using proportions. If 100% of 240 is 240, then 1% of 240 is 2.4. Then 15% would be 15 times that. So 15 * 2.4. Let's compute that. 10 * 2.4 is 24, 5 * 2.4 is 12, so again 24 + 12 = 36. Yep, still 36.

Is there a chance I made a mistake in all these methods? Let me check with a calculator. Wait, I don't have a calculator here, but all the manual calculations give me 36. So that's probably correct.

Wait, just to make sure, let's reverse it. If 15% of 240 is 36, then 36 divided by 240 should be 0.15, which is 15%. Let's see: 36 ÷ 240. Well, 240 divided by 100 is 2.4, so 36 divided by 2.4 is 15. Yep, that works. So the reverse check also gives me 15%, so that must be right.

I think that's thorough enough. All different approaches lead to the same answer, so I'm confident it's 36.

**Final Answer**
The 15% of 240 is \boxed{36}.

=============== Content =================


To determine **15% of 240**, we can use the standard method for calculating percentages:

---

### Step 1: Understand the Formula

The general formula for finding a percentage of a number is:

$$
\text{Percentage of a number} = \left( \frac{\text{Percentage}}{100} \right) \times \text{Number}
$$

In this case, the percentage is 15 and the number is 240.

---

### Step 2: Apply the Formula

$$
15\% \text{ of } 240 = \left( \frac{15}{100} \right) \times 240
$$

$$
= 0.15 \times 240
$$

$$
= 36
$$

---

### Step 3: Verification (Optional but Helpful)

To confirm, we can break it down further:

- 10% of 240 = 24
- 5% of 240 = 12
- So, 15% = 10% + 5% = 24 + 12 = 36

Or, using fractions:

- 15% = 3/20
- $ \frac{3}{20} \times 240 = 3 \times 12 = 36 $

Or, using proportions:

- 1% of 240 = 2.4
- 15% = 15 × 2.4 = 36

All methods consistently yield the same result.

---

### Final Answer

$$
\boxed{36}
$$
```

**Streaming with non-Thinking Process:**

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="EMPTY"
)

# Enable streaming to see the thinking process in real-time
response = client.chat.completions.create(
    model="internlm/Intern-S1",
    messages=[
        {"role": "user", "content": "Solve this problem step by step: What is 15% of 240?"}
    ],
    temperature=0.7,
    max_tokens=2048,
    stream=True,
    extra_body={
        "chat_template_kwargs": {"enable_thinking": False},
    }
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
36
```

#### 4.2.3 Tool Calling

Intern-S1 supports tool calling capabilities. Enable the tool call parser:

```shell
python -m sglang.launch_server \
  --model internlm/Intern-S1 \
  --tool-call-parser interns1 \
  --reasoning-parser interns1 \
  --trust-remote-code \
  --tp 8
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
    model="internlm/Intern-S1",
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
```

**Output Example:**

```
=============== Thinking =================

Okay, the user is asking for the weather in Beijing. Let me check the tools available. There's a get_weather function that requires the location and an optional unit. Since the user didn't specify Celsius or Fahrenheit, I should default to one. Maybe Celsius is more commonly used in Beijing? Or perhaps I should pick the default as per the tool's setup. Wait, the tool's parameters say "unit" is an enum with both options, but it's not required. The required field is only "location". So I can call get_weather with just the location. But maybe the user expects a specific unit. Hmm, but since they didn't specify, maybe I should just use Celsius as the default. Let me structure the function call with location set to Beijing and unit as celsius. That should cover it. Let me make sure the JSON is correctly formatted. The name is get_weather, parameters include location: "Beijing" and unit: "celsius". Alright, that should work.



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
    model="internlm/Intern-S1",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# The current weather in Beijing is **22°C** and **sunny**. Perfect weather to enjoy outdoor activities! Let me know if you need more details.
```

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA B200 GPU (8x)
- Model: internlm/Intern-S1
- Tensor Parallelism: 8
- sglang version: 0.5.6.post2

We use SGLang's built-in benchmarking tool to conduct performance evaluation on the [ShareGPT_Vicuna_unfiltered](https://huggingface.co/datasets/anon8231489123/ShareGPT_Vicuna_unfiltered) dataset. This dataset contains real conversation data and can better reflect performance in actual use scenarios.

#### 5.1.1 Standard Scenario Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model internlm/Intern-S1 \
  --tp 8 \
  --trust-remote-code
```

##### 5.1.1.1 Low Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model internlm/Intern-S1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  43.22
Total input tokens:                      6101
Total input text tokens:                 6101
Total input vision tokens:               0
Total generated tokens:                  4220
Total generated tokens (retokenized):    4221
Request throughput (req/s):              0.23
Input token throughput (tok/s):          141.16
Output token throughput (tok/s):         97.64
Peak output token throughput (tok/s):    100.00
Peak concurrent requests:                2
Total token throughput (tok/s):          238.80
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   4320.33
Median E2E Latency (ms):                 3449.98
---------------Time to First Token----------------
Mean TTFT (ms):                          61.05
Median TTFT (ms):                        62.51
P99 TTFT (ms):                           69.72
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          10.11
Median TPOT (ms):                        10.11
P99 TPOT (ms):                           10.14
---------------Inter-Token Latency----------------
Mean ITL (ms):                           10.12
Median ITL (ms):                         10.12
P95 ITL (ms):                            10.16
P99 ITL (ms):                            10.22
Max ITL (ms):                            30.28
==================================================
```

##### 5.1.1.2 Medium Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model internlm/Intern-S1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  45.59
Total input tokens:                      39668
Total input text tokens:                 39668
Total input vision tokens:               0
Total generated tokens:                  40805
Total generated tokens (retokenized):    40726
Request throughput (req/s):              1.75
Input token throughput (tok/s):          870.09
Output token throughput (tok/s):         895.03
Peak output token throughput (tok/s):    1136.00
Peak concurrent requests:                21
Total token throughput (tok/s):          1765.11
Concurrency:                             13.51
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   7701.22
Median E2E Latency (ms):                 8032.41
---------------Time to First Token----------------
Mean TTFT (ms):                          136.06
Median TTFT (ms):                        70.04
P99 TTFT (ms):                           470.29
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          15.05
Median TPOT (ms):                        15.10
P99 TPOT (ms):                           19.20
---------------Inter-Token Latency----------------
Mean ITL (ms):                           15.06
Median ITL (ms):                         14.06
P95 ITL (ms):                            16.46
P99 ITL (ms):                            41.89
Max ITL (ms):                            275.19
==================================================
```

##### 5.1.1.3 High Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model internlm/Intern-S1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 500 \
  --max-concurrency 100
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 100
Successful requests:                     500
Benchmark duration (s):                  82.22
Total input tokens:                      249831
Total input text tokens:                 249831
Total input vision tokens:               0
Total generated tokens:                  252662
Total generated tokens (retokenized):    251731
Request throughput (req/s):              6.08
Input token throughput (tok/s):          3038.63
Output token throughput (tok/s):         3073.06
Peak output token throughput (tok/s):    4400.00
Peak concurrent requests:                111
Total token throughput (tok/s):          6111.69
Concurrency:                             89.25
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   14675.27
Median E2E Latency (ms):                 14256.43
---------------Time to First Token----------------
Mean TTFT (ms):                          314.24
Median TTFT (ms):                        89.38
P99 TTFT (ms):                           1550.89
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          28.78
Median TPOT (ms):                        29.57
P99 TPOT (ms):                           33.59
---------------Inter-Token Latency----------------
Mean ITL (ms):                           29.07
Median ITL (ms):                         22.96
P95 ITL (ms):                            58.72
P99 ITL (ms):                            90.32
Max ITL (ms):                            1283.75
==================================================
```

#### 5.1.2 Reasoning Scenario Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model internlm/Intern-S1 \
  --tp 8 \
  --trust-remote-code
```

##### 5.1.2.1 Low Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model internlm/Intern-S1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  456.72
Total input tokens:                      6101
Total input text tokens:                 6101
Total input vision tokens:               0
Total generated tokens:                  44462
Total generated tokens (retokenized):    44226
Request throughput (req/s):              0.02
Input token throughput (tok/s):          13.36
Output token throughput (tok/s):         97.35
Peak output token throughput (tok/s):    100.00
Peak concurrent requests:                2
Total token throughput (tok/s):          110.71
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   45670.64
Median E2E Latency (ms):                 49186.88
---------------Time to First Token----------------
Mean TTFT (ms):                          60.94
Median TTFT (ms):                        62.36
P99 TTFT (ms):                           71.53
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          10.22
Median TPOT (ms):                        10.23
P99 TPOT (ms):                           10.32
---------------Inter-Token Latency----------------
Mean ITL (ms):                           14.17
Median ITL (ms):                         10.22
P95 ITL (ms):                            31.21
P99 ITL (ms):                            31.40
Max ITL (ms):                            164.27
==================================================
```

##### 5.1.2.2 Medium Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model internlm/Intern-S1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Test Results:

```============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  331.64
Total input tokens:                      39668
Total input text tokens:                 39668
Total input vision tokens:               0
Total generated tokens:                  318306
Total generated tokens (retokenized):    300978
Request throughput (req/s):              0.24
Input token throughput (tok/s):          119.61
Output token throughput (tok/s):         959.80
Peak output token throughput (tok/s):    1136.00
Peak concurrent requests:                18
Total token throughput (tok/s):          1079.41
Concurrency:                             13.83
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   57332.46
Median E2E Latency (ms):                 57790.93
---------------Time to First Token----------------
Mean TTFT (ms):                          120.19
Median TTFT (ms):                        65.77
P99 TTFT (ms):                           395.59
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          14.45
Median TPOT (ms):                        14.56
P99 TPOT (ms):                           15.05
---------------Inter-Token Latency----------------
Mean ITL (ms):                           17.96
Median ITL (ms):                         14.52
P95 ITL (ms):                            42.33
P99 ITL (ms):                            44.24
Max ITL (ms):                            529.80
==================================================
```

##### 5.1.2.3 High Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model internlm/Intern-S1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 320 \
  --max-concurrency 64
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 64
Successful requests:                     320
Benchmark duration (s):                  517.82
Total input tokens:                      158939
Total input text tokens:                 158939
Total input vision tokens:               0
Total generated tokens:                  1301025
Total generated tokens (retokenized):    1232129
Request throughput (req/s):              0.62
Input token throughput (tok/s):          306.94
Output token throughput (tok/s):         2512.53
Peak output token throughput (tok/s):    3200.00
Peak concurrent requests:                68
Total token throughput (tok/s):          2819.47
Concurrency:                             56.27
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   91062.42
Median E2E Latency (ms):                 94658.44
---------------Time to First Token----------------
Mean TTFT (ms):                          234.89
Median TTFT (ms):                        78.42
P99 TTFT (ms):                           1079.06
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          22.47
Median TPOT (ms):                        22.90
P99 TPOT (ms):                           23.50
---------------Inter-Token Latency----------------
Mean ITL (ms):                           27.70
Median ITL (ms):                         22.40
P95 ITL (ms):                            67.09
P99 ITL (ms):                            68.21
Max ITL (ms):                            965.45
==================================================
```

#### 5.1.3 Summarization Scenario Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model internlm/Intern-S1 \
  --tp 8 \
  --trust-remote-code
```

##### 5.1.3.1 Low Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model internlm/Intern-S1 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  44.97
Total input tokens:                      41941
Total input text tokens:                 41941
Total input vision tokens:               0
Total generated tokens:                  4220
Total generated tokens (retokenized):    4222
Request throughput (req/s):              0.22
Input token throughput (tok/s):          932.67
Output token throughput (tok/s):         93.84
Peak output token throughput (tok/s):    99.00
Peak concurrent requests:                2
Total token throughput (tok/s):          1026.51
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   4495.18
Median E2E Latency (ms):                 3655.41
---------------Time to First Token----------------
Mean TTFT (ms):                          150.46
Median TTFT (ms):                        137.21
P99 TTFT (ms):                           265.08
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          10.30
Median TPOT (ms):                        10.32
P99 TPOT (ms):                           10.49
---------------Inter-Token Latency----------------
Mean ITL (ms):                           10.32
Median ITL (ms):                         10.32
P95 ITL (ms):                            10.51
P99 ITL (ms):                            10.53
Max ITL (ms):                            10.98
==================================================
```

##### 5.1.3.2 Medium Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model internlm/Intern-S1 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  53.34
Total input tokens:                      300020
Total input text tokens:                 300020
Total input vision tokens:               0
Total generated tokens:                  41669
Total generated tokens (retokenized):    41622
Request throughput (req/s):              1.50
Input token throughput (tok/s):          5625.04
Output token throughput (tok/s):         781.25
Peak output token throughput (tok/s):    1104.00
Peak concurrent requests:                20
Total token throughput (tok/s):          6406.29
Concurrency:                             13.98
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   9318.26
Median E2E Latency (ms):                 9680.82
---------------Time to First Token----------------
Mean TTFT (ms):                          393.30
Median TTFT (ms):                        193.10
P99 TTFT (ms):                           1895.60
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          17.57
Median TPOT (ms):                        17.58
P99 TPOT (ms):                           28.00
---------------Inter-Token Latency----------------
Mean ITL (ms):                           17.26
Median ITL (ms):                         14.60
P95 ITL (ms):                            31.59
P99 ITL (ms):                            92.24
Max ITL (ms):                            1410.16
==================================================
```

##### 5.1.3.3 High Concurrency

- Benchmark Command:

```
python3 -m sglang.bench_serving \
  --backend sglang-oai-chat \
  --model internlm/Intern-S1 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 320 \
  --max-concurrency 64
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang-oai-chat
Traffic request rate:                    inf
Max request concurrency:                 64
Successful requests:                     320
Benchmark duration (s):                  103.49
Total input tokens:                      1273893
Total input text tokens:                 1273893
Total input vision tokens:               0
Total generated tokens:                  170000
Total generated tokens (retokenized):    168950
Request throughput (req/s):              3.09
Input token throughput (tok/s):          12309.72
Output token throughput (tok/s):         1642.72
Peak output token throughput (tok/s):    2749.00
Peak concurrent requests:                70
Total token throughput (tok/s):          13952.44
Concurrency:                             58.91
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   19051.58
Median E2E Latency (ms):                 18535.86
---------------Time to First Token----------------
Mean TTFT (ms):                          1020.30
Median TTFT (ms):                        244.52
P99 TTFT (ms):                           6702.14
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          34.95
Median TPOT (ms):                        35.78
P99 TPOT (ms):                           55.42
---------------Inter-Token Latency----------------
Mean ITL (ms):                           35.19
Median ITL (ms):                         22.76
P95 ITL (ms):                            102.93
P99 ITL (ms):                            212.74
Max ITL (ms):                            5001.12
==================================================
```

### 5.2 Accuracy Benchmark

#### 5.2.1 MMMU Benchmark

You can evaluate the model's accuracy using the MMMU dataset with `lmms_eval`:

- Benchmark Command:

```shell
uv pip install lmms_eval

python3 -m lmms_eval \
  --model openai_compatible \
  --model_args "model=internlm/Intern-S1,api_key=EMPTY,base_url=http://127.0.0.1:8000/v1/" \
  --tasks mmmu_val \
  --batch_size 128 \
  --log_samples \
  --log_samples_suffix "openai_compatible" \
  --output_path ./logs \
  --gen_kwargs "max_new_tokens=4096"
```

- **Test Results:**

```
| Tasks  |Version|Filter|n-shot| Metric |   |Value |   |Stderr|
|--------|------:|------|-----:|--------|---|-----:|---|------|
|mmmu_val|      0|none  |     0|mmmu_acc|↑  |0.5011|±  |   N/A|
```
