# DeepSeek-V3.1

## 1. Model Introduction

[DeepSeek V3.1](https://huggingface.co/deepseek-ai/DeepSeek-V3.1) is an advanced Mixture-of-Experts (MoE) large language model developed by DeepSeek, representing a major capability and usability upgrade over DeepSeek V3. As a refined iteration in the DeepSeek V3 family, DeepSeek V3.1 introduces a hybrid reasoning paradigm that supports both fast non-thinking responses and explicit multi-step reasoning, alongside significantly improved tool calling and agentic behavior. The model demonstrates strong performance across reasoning, mathematics, coding, long-context understanding, and real-world agent workflows, benefiting from continued training, alignment optimization, and inference-time refinements. DeepSeek V3.1 is designed to serve as a robust general-purpose foundation model, well suited for conversational AI, structured tool invocation, search-augmented generation, and complex multi-step tasks, while maintaining high efficiency through its sparse MoE architecture.

**[DeepSeek-V3.1-Terminus](https://huggingface.co/deepseek-ai/DeepSeek-V3.1-Terminus)** is an experimental version designed for general conversations and long-context processing. It features hybrid thinking capabilities, allowing you to toggle between "Think" mode for deliberate reasoning and "Non-Think" mode for faster responses. Recommended for general conversations, long-context processing, and experimental use cases.



## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides a progressive guide from quick deployment to performance optimization, suitable for users at different levels.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model variant, deployment strategy, and thinking capabilities.

import DeepSeekConfigGenerator from '@site/src/components/autoregressive/DeepSeekV31ConfigGenerator';

<DeepSeekConfigGenerator />

### 3.2 Configuration Tips
For more detailed configuration tips, please refer to [DeepSeek V3/V3.1/R1 Usage](https://docs.sglang.io/basic_usage/deepseek_v3.html).

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [Basic API Usage](https://docs.sglang.ai/get_started/quick_start.html)

### 4.2 Advanced Usage

#### 4.2.1 Reasoning Parser

DeepSeek-V3.1 supports reasoning mode. Enable the reasoning parser during deployment to separate the thinking and content sections:

```shell
python -m sglang.launch_server \
  --model deepseek-ai/DeepSeek-V3.1-Terminus \
  --reasoning-parser deepseek-v3 \
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
    model="deepseek-ai/DeepSeek-V3.1-Terminus",
    messages=[
        {"role": "user", "content": "Solve this problem step by step: What is 15% of 240?"}
    ],
    temperature=0.7,
    max_tokens=2048,
    extra_body = {"chat_template_kwargs": {"thinking": True}},
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
First, the problem is asking for 15% of 240. Percent means per hundred, so 15% is the same as 15 out of 100, or 15/100.

To find a percentage of a number, I can multiply the number by the percentage expressed as a decimal. So, I need to convert 15% to a decimal. To do that, I divide 15 by 100, which gives me 0.15.

Now, I multiply 0.15 by 240. So, the calculation is 0.15 × 240.

I can compute this step by step. First, I know that 15% of 100 is 15, but since 240 is larger, I need to adjust. Alternatively, I can think of 10% of 240, which is easy because 10% is just 240 divided by 10, which is 24. Then, 5% is half of 10%, so half of 24 is 12. Therefore, 15% is 10% plus 5%, so 24 plus 12, which equals 36.

I should also do the multiplication to confirm. 0.15 × 240. I can break it down: 0.15 × 200 = 30, and 0.15 × 40 = 6, so 30 + 6 = 36. Same answer.

So, 15% of 240 is 36.

The problem says "step by step," so I should present it clearly.
=============== Content =================
To find 15% of 240, follow these steps:

1. Understand that "percent" means "per hundred," so 15% is equivalent to \( \frac{15}{100} \).
2. Convert 15% to a decimal by dividing by 100: \( 15\% = \frac{15}{100} = 0.15 \).
3. Multiply the decimal by 240: \( 0.15 \times 240 \).
4. Perform the multiplication:
   - \( 0.15 \times 200 = 30 \)
   - \( 0.15 \times 40 = 6 \)
   - Add the results: \( 30 + 6 = 36 \).

Alternatively, you can find 15% by breaking it into parts:
- 10% of 240 is \( \frac{10}{100} \times 240 = 0.10 \times 240 = 24 \).
- 5% of 240 is half of 10%, so \( \frac{24}{2} = 12 \).
- Add 10% and 5%: \( 24 + 12 = 36 \).

Thus, 15% of 240 is 36.
```

**Note:** The reasoning parser captures the model's step-by-step thinking process, allowing you to see how the model arrives at its conclusions.

#### 4.2.2 Tool Calling

DeepSeek-V3.1 and DeepSeek-V3.1-Terminus support tool calling capabilities. Enable the tool call parser:

**Note:** DeepSeek-V3.1-Speciale does **NOT** support tool calling. It is designed exclusively for deep reasoning tasks.

**Deployment Command:**

```shell
python -m sglang.launch_server \
  --model deepseek-ai/DeepSeek-V3.1-Terminus \
  --tool-call-parser deepseekv31 \
  --reasoning-parser deepseek-v3 \
  --chat-template ./examples/chat_template/tool_chat_template_deepseekv31.jinja \
  --tp 8 \
  --host 0.0.0.0 \
  --port 8000
```

For DeepSeek-V3.1, use `--tool-call-parser deepseekv31` as well.

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
    model="deepseek-ai/DeepSeek-V3.1-Terminus",
    messages=[
        {"role": "user", "content": "What's the weather in Beijing?"}
    ],
    tools=tools,
    extra_body = {"chat_template_kwargs": {"thinking": True}},
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

```
=============== Thinking =================
Hmm, the user is asking for the weather in Beijing. This is a straightforward request that matches exactly what the weather tool can provide.

I need to call the get_weather function with Beijing as the location parameter. The user didn't specify a temperature unit, so I'll default to Celsius since that's commonly used in most parts of the world.

The tool call format needs to be precise - just the city name and unit selection. Once I get the weather data back, I'll present it clearly to the user.I'll check the weather in Beijing for you.
=============== Content =================

🔧 Tool Call: get_weather
   Arguments: {"location": "Beijing", "unit": "celsius"}
```

**Note:**

- The reasoning parser shows how the model decides to use a tool
- Tool calls are clearly marked with the function name and arguments
- You can then execute the function and send the result back to continue the conversation

**Handling Tool Call Results:**

Please attach the code blocks below to the previous Python script.

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
    model="deepseek-ai/DeepSeek-V3.1-Terminus",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# Output: "Currently, it is **22°C and sunny** in Beijing."
```

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: AMD MI300X GPU (8x)
- Model: DeepSeek-V3.1-Terminus
- Tensor Parallelism: 8
- sglang version: 0.5.7

We use SGLang's built-in benchmarking tool to conduct performance evaluation on the [ShareGPT_Vicuna_unfiltered](https://huggingface.co/datasets/anon8231489123/ShareGPT_Vicuna_unfiltered) dataset. This dataset contains real conversation data and can better reflect performance in actual use scenarios. To simulate real-world usage patterns, we configure each request with 1024 input tokens and 1024 output tokens, representing typical medium-length conversations with detailed responses.

#### 5.1.1 Latency-Sensitive Benchmark

- Model Deployment Command:

```shell
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.1-Terminus \
  --tp 8 \
  --speculative-algorithm EAGLE \
  --speculative-num-steps 3 \
  --speculative-eagle-topk 1 \
  --speculative-num-draft-tokens 4 \
  --host 0.0.0.0 \
  --port 8000
```

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 8000 \
  --model deepseek-ai/DeepSeek-V3.1-Terminus \
  --random-input-len 1024 \
  --random-output-len 1024 \
  --num-prompts 10 \
  --max-concurrency 1
```

- **Test Results:**

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  35.57
Total input tokens:                      1972
Total input text tokens:                 1972
Total input vision tokens:               0
Total generated tokens:                  2784
Total generated tokens (retokenized):    2774
Request throughput (req/s):              0.28
Input token throughput (tok/s):          55.44
Output token throughput (tok/s):         78.26
Peak output token throughput (tok/s):    119.00
Peak concurrent requests:                2
Total token throughput (tok/s):          133.70
Concurrency:                             1.00
Accept length:                           2.58
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   3555.16
Median E2E Latency (ms):                 3869.17
---------------Time to First Token----------------
Mean TTFT (ms):                          421.85
Median TTFT (ms):                        144.83
P99 TTFT (ms):                           1035.12
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          11.00
Median TPOT (ms):                        11.00
P99 TPOT (ms):                           14.61
---------------Inter-Token Latency----------------
Mean ITL (ms):                           11.31
Median ITL (ms):                         9.75
P95 ITL (ms):                            29.16
P99 ITL (ms):                            29.48
Max ITL (ms):                            29.81
==================================================
```

#### 5.1.2 Throughput-Sensitive Benchmark

- Model Deployment Command:

```shell
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.1-Terminus \
  --tp 8 \
  --ep 8 \
  --dp 8 \
  --enable-dp-attention \
  --host 0.0.0.0 \
  --port 8000
```

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 8000 \
  --model deepseek-ai/DeepSeek-V3.1-Terminus \
  --random-input-len 1024 \
  --random-output-len 1024 \
  --num-prompts 1000 \
  --max-concurrency 100
```

- **Test Results:**

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 100
Successful requests:                     1000
Benchmark duration (s):                  262.73
Total input tokens:                      301701
Total input text tokens:                 301701
Total input vision tokens:               0
Total generated tokens:                  188375
Total generated tokens (retokenized):    187420
Request throughput (req/s):              3.81
Input token throughput (tok/s):          1148.31
Output token throughput (tok/s):         716.98
Peak output token throughput (tok/s):    1285.00
Peak concurrent requests:                110
Total token throughput (tok/s):          1865.29
Concurrency:                             80.69
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   21200.05
Median E2E Latency (ms):                 13409.82
---------------Time to First Token----------------
Mean TTFT (ms):                          764.97
Median TTFT (ms):                        426.36
P99 TTFT (ms):                           4533.98
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          114.09
Median TPOT (ms):                        112.41
P99 TPOT (ms):                           332.56
---------------Inter-Token Latency----------------
Mean ITL (ms):                           109.41
Median ITL (ms):                         78.45
P95 ITL (ms):                            209.04
P99 ITL (ms):                            285.63
Max ITL (ms):                            2626.92
==================================================
```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

- **Benchmark Command:**

```shell
python3 -m sglang.test.few_shot_gsm8k --num-questions 200 --port 8000
```

- **Test Results**:
  - DeepSeek-V3.1-Terminus
    ```
    Accuracy: 0.975
    Invalid: 0.000
    Latency: 27.445 s
    Output throughput: 673.719 token/s
    ```

#### 5.2.2 MMLU Benchmark

- **Benchmark Command:**

```shell
cd sglang
bash benchmark/mmlu/download_data.sh
python3 benchmark/mmlu/bench_sglang.py --nsub 10 --port 8000
```

- **Test Results**:
  - DeepSeek-V3.1-Terminus
    ```
    subject: abstract_algebra, #q:100, acc: 0.790
    subject: anatomy, #q:135, acc: 0.867
    subject: astronomy, #q:152, acc: 0.941
    subject: business_ethics, #q:100, acc: 0.850
    subject: clinical_knowledge, #q:265, acc: 0.928
    subject: college_biology, #q:144, acc: 0.972
    subject: college_chemistry, #q:100, acc: 0.650
    subject: college_computer_science, #q:100, acc: 0.870
    subject: college_mathematics, #q:100, acc: 0.820
    subject: college_medicine, #q:173, acc: 0.861
    Total latency: 36.948
    Average accuracy: 0.871
    ```
