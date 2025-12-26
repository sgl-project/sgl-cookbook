# Devstral 2 (Mistral)

## 1. Model Introduction

**Devstral 2** is an agentic LLM family for software engineering tasks. It is designed for agentic workflows such as tool use, codebase exploration, and multi-file edits, and achieves strong performance on **SWE-bench**.

The **Devstral 2 Instruct** checkpoints are instruction-tuned **FP8** models, making them a good fit for chat, tool-using agents, and instruction-following SWE workloads.

**Key Features:**

- **Agentic coding**: Optimized for tool-driven coding and software engineering agents
- **Improved performance**: A step up compared to earlier Devstral models
- **Better generalization**: More robust across diverse prompts and coding environments
- **Long context**: Up to a **256K** context window

**Use Cases:**
AI code assistants, agentic coding, and software engineering tasks that require deep codebase understanding and tool integration.

For enterprises requiring specialized capabilities (increased context, domain-specific knowledge, etc.), please reach out to Mistral.

**Models:**

- **Collection**: [mistralai/devstral-2 (Hugging Face)](https://huggingface.co/collections/mistralai/devstral-2)
- **FP8 Instruct**:
  - **[mistralai/Devstral-2-123B-Instruct-2512](https://huggingface.co/mistralai/Devstral-2-123B-Instruct-2512)**
  - **[mistralai/Devstral-Small-2-24B-Instruct-2512](https://huggingface.co/mistralai/Devstral-Small-2-24B-Instruct-2512)**

---

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

:::caution Transformers version requirement
Devstral 2 requires a recent `transformers`. Please verify `transformers >= 5.0.0.rc`:

```shell
python -c "import transformers; print(transformers.__version__)"
```

If your version is lower, upgrade:

```shell
pip install -U --pre "transformers>=5.0.0rc0"
```
:::

---

## 3. Model Deployment

### 3.1 Basic configuration

**Interactive Command Generator**: Use the configuration selector below to generate a launch command for Devstral Small 2 (24B) or Devstral 2 (123B).

:::note
The TP size is set to the minimum required for the selected model size.
:::

import Devstral2ConfigGenerator from '@site/src/components/Devstral2ConfigGenerator';

<Devstral2ConfigGenerator />

### 3.2 Configuration tips

- **Context length vs memory**: Devstral 2 advertises a long context window; if you are memory-constrained, start by lowering `--context-length` (for example `32768`) and increase once things are stable.
- **FP8 checkpoints**: Both Devstral Small 2 and Devstral 2 are published as **FP8** weights. If you hit kernel / dtype issues, try a newer SGLang build and recent CUDA drivers.

---

## 4. Model Invocation

### 4.1 Basic Usage (OpenAI-Compatible API)

SGLang exposes an OpenAI-compatible endpoint. Example:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY",
)

resp = client.chat.completions.create(
    model="mistralai/Devstral-Small-2-24B-Instruct-2512",
    messages=[
        {"role": "system", "content": "You are a helpful coding assistant."},
        {"role": "user", "content": "Write a Python function that retries a request with exponential backoff."},
    ],
    temperature=0.2,
    max_tokens=512,
)

print(resp.choices[0].message.content)
```

**Output Example:**

```
  Here's a Python function that implements exponential backoff for retrying a request. This function uses the `requests` library to make HTTP requests and includes error handling for common HTTP and connection errors.

  ```python
  import time
  import requests
  from requests.exceptions import RequestException

  def retry_with_exponential_backoff(
      url,
      max_retries=3,
      initial_delay=1,
      backoff_factor=2,
      method="GET",
      **kwargs
  ):
      """
      Retry a request with exponential backoff.

      Parameters:
      - url: The URL to request.
      - max_retries: Maximum number of retry attempts (default: 3).
      - initial_delay: Initial delay in seconds (default: 1).
      - backoff_factor: Multiplier for the delay between retries (default: 2).
      - method: HTTP method to use (default: "GET").
      - **kwargs: Additional arguments to pass to the request function (e.g., headers, data, etc.).

      Returns:
      - Response object if the request succeeds.
      - Raises an exception if all retries fail.
      """
      retry_count = 0
      delay = initial_delay

      while retry_count < max_retries:
          try:
              response = requests.request(method, url, **kwargs)
              # Check if the response status code indicates success
              if response.status_code < 400:
                  return response
              else:
                  raise RequestException(f"HTTP {response.status_code}: {response.text}")

          except RequestException as e:
              if retry_count == max_retries - 1:
                  raise Exception(f"All retries failed. Last error: {e}")

              print(f"Attempt {retry_count + 1} failed. Retrying in {delay} seconds...")
              time.sleep(delay)
...
```

### 4.2 Tool calling (optional)

Devstral 2 supports tool calling capabilities. Enable the tool call parser:

```shell
python -m sglang.launch_server \
  --model mistralai/Devstral-2-123B-Instruct-2512 \
  --tp 2 \
  --tool-call-parser mistral
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
    model="mistralai/Devstral-2-123B-Instruct-2512",
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
🔧 Tool Call: get_weather
   Arguments: {"location": "Beijing"}
```
