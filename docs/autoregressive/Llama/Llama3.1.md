# Llama3.1 Usage Guide

## 1. Model Introduction
The Meta Llama 3.1 large language models are a collection of pretrained and instruction tuned generative models, released in July 2024. These models are available in 8B, 70B and 405B sizes, with the 405B variant being the most capable fully-open source model at the time.

These models bring open intelligence to all, with several new features and improvements:

- **Stronger General Intelligence**: These models showcase significant improvements in coding, state-of-the-art tool use, and overall stronger reasoning capabilities.
- **Extended Context Length**: Llama 3.1 extends the context length to 128K tokens to improve performance over long context tasks such as summarization and code reasoning.
- **Tool Use**: Llama 3.1 is trained to interact with a search engine, python interpreter and mathematical engine, and also improves zero-shot tool use capabilities to interact with potentially unseen tools.
- **Multilinguality**: Llama 3.1 supports 7 languages in addition to English: French, German, Hindi, Italian, Portuguese, Spanish, and Thai.

For further details, please refer to the [Llama 3.1 blog](https://ai.meta.com/blog/meta-llama-3-1/) and the [Llama 3.1 model card](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md)

## 2. SGLang Installation
SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment
TODO: Hardware can be just H100 for now.

Model sizes: 8B, 70B, 405B

Type: Base, Instruct

Quantization: Check if provided

Tool Call parser: Does it work?

### 3.1 Basic Configuration

### 3.2 Configuration Tips

## 4. Model Invocation

### 4.1 Basic Usage

### 4.2 Advanced Usage
#### 4.2.1 Tool Calling
Llama3 supports tool calling capabilities. First, start the server with tool call parser enabled:

```shell
python -m sglang.launch_server \
  --model  Meta-Llama/Llama-3.1-405B-Instruct \
  --tool-call-parser llama3 \
  --tp 8 \
  --host 0.0.0.0 \
  --port 8000
```

**Python Example**

```python
from openai import OpenAI

client = OpenAI(api_key="None", base_url=f"http://0.0.0.0:8000/v1")

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city to find the weather for, e.g. 'San Francisco'",
                    },
                    "unit": {
                        "type": "string",
                        "description": "The unit to fetch the temperature in",
                        "enum": ["celsius", "fahrenheit"],
                    },
                },
                "required": ["city", "unit"],
            },
        },
    }
]

response = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct",
    messages=[
        {
            "role": "user",
            "content": "What's the weather like in Boston today?",
        }
    ],
    temperature=0.7,
    stream=True,
    tools=tools,
)


arguments = []

tool_calls_accumulator = {}

for chunk in response:
    if chunk.choices and len(chunk.choices) > 0:
        delta = chunk.choices[0].delta

        if hasattr(delta, 'tool_calls') and delta.tool_calls:
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

Reference: [SGLang Tool Parser Documentation](https://docs.sglang.io/advanced_features/tool_parser.html#OpenAI-Compatible-API)

**Output Example**
```
🔧 Tool Call: get_weather
   Arguments: {"city": "Boston", "unit": "fahrenheit"}
```

**Handling Tool Call Results**
After getting the tool call, you can execute the function:

```python
def get_weather(location, unit="celsius"):
    # Your actual weather API call here
    return f"The weather in {location} is 22°{unit[0].upper()} and sunny."

# Send tool result back to the model
messages = [
    {"role": "user", "content": "What's the weather like in Boston today?"},
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": "call_123",
            "type": "function",
            "function": {
                "name": "get_weather",
                "arguments": '{"location": "Boston", "unit": "fahrenheit"}'
            }
        }]
    },
    {
        "role": "tool",
        "tool_call_id": "call_123",
        "content": get_weather("Boston", "fahrenheit")
    }
]

final_response = client.chat.completions.create(
    model="Meta-Llama/Llama-3.1-405B-Instruct",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# Output: "The current weather in Boston is **22°C** and **sunny**. A perfect day to spend outside"
```


## 5. Benchmark

### 5.1 Speed Benchmark


#### 5.1.1 Standard Scenario Benchmark

##### 5.1.1.1 Low Concurrency

##### 5.1.1.2 Medium Concurrency

##### 5.1.1.3 High Concurrency

#### 5.1.2 Summarization Scenario Benchmark
##### 5.1.2.1 Low Concurrency

##### 5.1.2.2 Medium Concurrency

##### 5.1.2.3 High Concurrency

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark


## 📝 Community Contribution Welcome

This guide is currently under development. We welcome community contributions!

If you have experience deploying **Llama3.3-70B** with SGLang, please help us complete this documentation.

