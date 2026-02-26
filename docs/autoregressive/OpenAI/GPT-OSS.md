# GPT-OSS

## 1.Model Introduction

[GPT-OSS](https://huggingface.co/openai/gpt-oss-20b) is an advanced large language model developed by OpenAI designed for power reasoning, agentic tasks, and versatile developer use cases. It has versions with two model sizes.

- **gpt-oss-120b** — for production, general purpose, high reasoning use cases that fit into a single 80GB GPU (like NVIDIA H100 80GB or AMD MI355X 288GB) (117B parameters with 5.1B active parameters)
- **gpt-oss-20b** — for lower latency, and local or specialized use cases (21B parameters with 3.6B active parameters)

GPT-OSS introduces several groundbreaking innovations:

- **Configurable reasoning effort**: Easily adjust the reasoning effort (low, medium, high) based on your specific use case and latency needs.
- **Full chain-of-thought**: Gain complete access to the model’s reasoning process, facilitating easier debugging and increased trust in outputs. It’s not intended to be shown to end users.
- **Fine-tunable**: Fully customize models to your specific use case through parameter fine-tuning.
- **Agentic capabilities**: Use the models’ native capabilities for function calling, web browsing, Python code execution, and Structured Outputs.
- **MXFP4 quantization**: The models were post-trained with MXFP4 quantization of the MoE weights, making gpt-oss-120b run on a single 80GB GPU (like NVIDIA H100 80GB or AMD MI300X 192GB) and the gpt-oss-20b model run within 16GB of memory. All evals were performed with the same MXFP4 quantization.

## 2.SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3.Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

The GPT-OSS series comes in two sizes. Recommended starting configurations vary depending on hardware.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model size, quantization method, and thinking capabilities.

import GPTOSSConfigGenerator from '@site/src/components/autoregressive/GPTOSSConfigGenerator';

<GPTOSSConfigGenerator />

### 3.2 Configuration Tips

For more detailed configuration tips, please refer to [GPS-OSS Usage](https://docs.sglang.io/basic_usage/gpt_oss.html).

**EAGLE Speculative Decoding:** SGLang supports speculative decoding for GPT-OSS models using EAGLE3 algorithm. This can significantly improve decoding speed, especially for small batch sizes. Add `--speculative-algorithm EAGLE3` along with the draft model path:

```bash
python3 -m sglang.launch_server \
  --model-path openai/gpt-oss-120b \
  --speculative-algorithm EAGLE3 \
  --speculative-draft-model-path lmsys/EAGLE3-gpt-oss-120b-bf16 \
  --tp 2
```

**Tip:** To enable the experimental overlap scheduler for EAGLE3 speculative decoding, set the environment variable `SGLANG_ENABLE_SPEC_V2=1`. This can improve performance by enabling overlap scheduling between draft and verification stages.

## 4.Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

### 4.1.1 Responses API

GPT‑OSS is compatible with the OpenAI Responses API. Use `client.responses.create(...)` with
`model`, `instructions`, `input`, and optional `tools` to enable built‑in tool use. You can
set reasoning level via `instructions`, e.g., "Reasoning: high" (also supports "medium" and
"low") — levels: low (fast), medium (balanced), high (deep).

### 4.2 Advanced Usage

#### 4.2.1 Reasoning Parser

GPT-OSS supports reasoning mode. Enable the reasoning parser during deployment to separate the thinking and content sections:

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

GPT-OSS supports tool calling capabilities. Enable the tool call parser:

**Built-in Tools**

GPT‑OSS can call built‑in tools for web search and Python execution. You can use the demo tool
server or connect to external MCP tool servers.

**Python Tool**

- Executes short Python snippets for calculations, parsing, and quick scripts.
- By default runs in a Docker-based sandbox. To run on the host, set
  `PYTHON_EXECUTION_BACKEND=UV` (this executes model-generated code locally; use with care).
- Ensure Docker is available if you are not using the UV backend. It is recommended to run
  `docker pull python:3.11` in advance.

**Web Search Tool**

- Uses the Exa backend for web search.
- Requires an Exa API key; set `EXA_API_KEY` in your environment. Create a key at
  `https://exa.ai`.

**Tool & Reasoning Parser**

- We support OpenAI Reasoning and Tool Call parser, as well as our SGLang native api for tool
  call and reasoning. Refer to [reasoning parser](https://docs.sglang.io/advanced_features/separate_reasoning.html)
  and [tool call parser](https://docs.sglang.io/advanced_features/function_calling.html) for more details.

**Notes**

- Use **Python 3.12** for the demo tools. And install the required `gpt-oss` packages.
- The default demo integrates the web search tool (Exa backend) and a demo Python interpreter
  via Docker.
- For search, set `EXA_API_KEY`. For Python execution, either have Docker available or set
  `PYTHON_EXECUTION_BACKEND=UV`.

Examples:
```bash
export EXA_API_KEY=YOUR_EXA_KEY
# Optional: run Python tool locally instead of Docker (use with care)
export PYTHON_EXECUTION_BACKEND=UV
```

Launch the server with the demo tool server:

```bash
python3 -m sglang.launch_server \
  --model-path openai/gpt-oss-120b \
  --tool-server demo \
  --tp 2
```

For production usage, sglang can act as an MCP client for multiple services. An
[example tool server](https://github.com/openai/gpt-oss/tree/main/gpt-oss-mcp-server) is
provided. Start the servers and point sglang to them:

```bash
mcp run -t sse browser_server.py:mcp
mcp run -t sse python_server.py:mcp

python -m sglang.launch_server ... --tool-server ip-1:port-1,ip-2:port-2
```

The URLs should be MCP SSE servers that expose server information and well-documented tools.
These tools are added to the system prompt so the model can use them.

**Quick Demo**

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="sk-123456"
)

tools = [
    {"type": "code_interpreter"},
    {"type": "web_search_preview"},
]

# Reasoning level example
response = client.responses.create(
    model="openai/gpt-oss-120b",
    instructions="You are a helpful assistant.",
    reasoning_effort="high",  # Supports high, medium, or low
    input="In one sentence, explain the transformer architecture.",
)
print("====== reasoning: high ======")
print(response.output_text)

# Test python tool
response = client.responses.create(
    model="openai/gpt-oss-120b",
    instructions="You are a helpful assistant, you could use python tool to execute code.",
    input="Use python tool to calculate the sum of 29138749187 and 29138749187", # 58,277,498,374
    tools=tools
)
print("====== test python tool ======")
print(response.output_text)

# Test browser tool
response = client.responses.create(
    model="openai/gpt-oss-120b",
    instructions="You are a helpful assistant, you could use browser to search the web",
    input="Search the web for the latest news about Nvidia stock price",
    tools=tools
)
print("====== test browser tool ======")
print(response.output_text)
```

Example output:
```
====== test python tool ======
The sum of 29,138,749,187 and 29,138,749,187 is **58,277,498,374**.
====== test browser tool ======
**Recent headlines on Nvidia (NVDA) stock**

| Date (2025) | Source | Key news points | Stock‑price detail |
|-------------|--------|----------------|--------------------|
| **May 13** | Reuters | The market data page shows Nvidia trading "higher" at **$116.61** with no change from the previous close. | **$116.61** – latest trade (delayed ≈ 15 min)【14†L34-L38】 |
| **Aug 18** | CNBC | Morgan Stanley kept an **overweight** rating and lifted its price target to **$206** (up from $200), implying a 14 % upside from the Friday close. The firm notes Nvidia shares have already **jumped 34 % this year**. | No exact price quoted, but the article signals strong upside expectations【9†L27-L31】 |
| **Aug 20** | The Motley Fool | Nvidia is set to release its Q2 earnings on Aug 27. The article lists the **current price of $175.36**, down 0.16 % on the day (as of 3:58 p.m. ET). | **$175.36** – current price on Aug 20【10†L12-L15】【10†L53-L57】 |

**What the news tells us**

* Nvidia's share price has risen sharply this year – up roughly a third according to Morgan Stanley – and analysts are still raising targets (now $206).
* The most recent market quote (Reuters, May 13) was **$116.61**, but the stock has surged since then, reaching **$175.36** by mid‑August.
* Upcoming earnings on **Aug 27** are a focal point; both the Motley Fool and Morgan Stanley expect the results could keep the rally going.

**Bottom line:** Nvidia's stock is on a strong upward trajectory in 2025, with price targets climbing toward $200‑$210 and the market price already near $175 as of late August.

```

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
🔧 Tool Call: get_weather
   Arguments: {"location": "Beijing", "unit": "celsius"}
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
=============== Thinking =================
User asks: "What's the weather in Beijing?" We need to get current weather. Use function get_weather with location "Beijing". No unit specified; default? Probably use default (maybe Celsius). We can specify unit as "celsius". We'll call function.
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
    model="openai/gpt-oss-120b",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# Output: "The current weather in Beijing is 22 °C and sunny. Let me know if you’d like a forecast for the next few days or any other details!"
```

## 5.Benchmark

### 5.1 Speed Benchmark

- Hardware: NVIDIA B200 GPU (8x)
- Tensor Parallelism: 8
- Model: openai/gpt-oss-120b
- sglang version: 0.5.6

We use SGLang's built-in benchmarking tool to conduct performance evaluation on the [ShareGPT_Vicuna_unfiltered](https://huggingface.co/datasets/anon8231489123/ShareGPT_Vicuna_unfiltered) dataset. This dataset contains real conversation data and can better reflect performance in actual use scenarios.

#### 5.1.1 Latency-Sensitive Benchmark

- Server Command:

```
python -m sglang.launch_server \
  --model openai/gpt-oss-120b \
  --tp 8
```

- Test Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --num-prompt 100 \
  --max-concurrency 1
```

- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     100
Benchmark duration (s):                  52.35
Total input tokens:                      33178
Total input text tokens:                 33178
Total input vision tokens:               0
Total generated tokens:                  21251
Total generated tokens (retokenized):    20868
Request throughput (req/s):              1.91
Input token throughput (tok/s):          633.76
Output token throughput (tok/s):         405.93
Peak output token throughput (tok/s):    433.00
Peak concurrent requests:                8
Total token throughput (tok/s):          1039.69
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   523.30
Median E2E Latency (ms):                 389.91
---------------Time to First Token----------------
Mean TTFT (ms):                          33.71
Median TTFT (ms):                        31.79
P99 TTFT (ms):                           108.98
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          2.31
Median TPOT (ms):                        2.31
P99 TPOT (ms):                           2.39
---------------Inter-Token Latency----------------
Mean ITL (ms):                           2.31
Median ITL (ms):                         2.31
P95 ITL (ms):                            2.35
P99 ITL (ms):                            2.38
Max ITL (ms):                            3.54
==================================================
```

#### 5.1.2 Throughput-Sensitive Benchmark

- Server Command:

```
python -m sglang.launch_server \
  --model openai/gpt-oss-120b \
  --tp 8
```

- Test Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --num-prompt 1000 \
  --max-concurrency 100
```

**Test Results:**

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 100
Successful requests:                     1000
Benchmark duration (s):                  24.76
Total input tokens:                      297156
Total input text tokens:                 297156
Total input vision tokens:               0
Total generated tokens:                  192432
Total generated tokens (retokenized):    187145
Request throughput (req/s):              40.39
Input token throughput (tok/s):          12003.57
Output token throughput (tok/s):         7773.26
Peak output token throughput (tok/s):    13780.00
Peak concurrent requests:                156
Total token throughput (tok/s):          19776.83
Concurrency:                             89.23
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   2208.97
Median E2E Latency (ms):                 1591.11
---------------Time to First Token----------------
Mean TTFT (ms):                          102.94
Median TTFT (ms):                        31.53
P99 TTFT (ms):                           674.32
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          14.31
Median TPOT (ms):                        11.00
P99 TPOT (ms):                           91.28
---------------Inter-Token Latency----------------
Mean ITL (ms):                           11.00
Median ITL (ms):                         5.75
P95 ITL (ms):                            25.35
P99 ITL (ms):                            43.18
Max ITL (ms):                            621.42
==================================================
```

### 5.2 Accuracy Benchmark

### 5.2.1 GSM8K Benchmark

- **Benchmark Command:**

```shell
python3 -m sglang.test.few_shot_gsm8k --num-questions 200 --port 8000
```

- **Results**:

  - GPT-OSS-120b

    ```
    Accuracy: 0.880
    Invalid: 0.005
    Latency: 5.262 s
    Output throughput: 12143.675 token/s
    ```

  - GPT-OSS-20b

    ```
    Accuracy: 0.535
    Invalid: 0.165
    Latency: 4.157 s
    Output throughput: 19589.165 token/s
    ```
