---
sidebar_position: 5
---
# Qwen3-Coder-Next

## 1. Model Introduction

[Qwen3-Coder-Next](https://huggingface.co/collections/Qwen/qwen3-coder-next) is an advanced large language model architecture developed by Alibaba's Qwen team, specifically optimized for coding tasks and software development. It features enhanced capabilities in code generation, debugging, reasoning about code, and multi-language programming support.

Qwen3-Coder-Next introduces several groundbreaking innovations:

- **Hybrid Attention Mechanism**: Replaces standard attention with a combination of **Gated DeltaNet** (linear attention) and **Full Attention**, enabling efficient processing of context lengths up to 262,144 tokens. This hybrid approach makes it ideal for analyzing large codebases, entire repositories, or extensive documentation.
- **Highly Sparse Mixture-of-Experts (MoE)**: Features an 80-billion parameter architecture where only 3 billion parameters are active during inference. This design reduces computational costs by up to 90% while maintaining high performance, drastically reducing FLOPs per token without compromising model capacity.
- **Multi-Token Prediction (MTP)**: Enables generation of multiple tokens per inference step, significantly reducing latency and enhancing user experience in real-time coding applications. This innovation boosts both pretraining performance and inference speed.
- **Multi-Programming Language Support**: Natively supports 100+ programming languages and frameworks, facilitating seamless cross-language development and making it versatile for diverse coding tasks.
- **Enterprise-Ready Deployment**: Released under the Apache 2.0 license, offering flexible deployment options including on-premises, virtual private cloud (VPC), and private cloud environments, ensuring security and compliance for enterprise use.
- **Advanced Code Reasoning & Stability**: Demonstrates clear improvement in code reasoning performance with support for tool use during inference. Includes stability optimizations such as **zero-centered** and **weight-decayed layernorm** for robust pre-training and post-training.

For more details, please refer to the [official Qwen3-Coder-Next blog](https://qwen.ai/blog).

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

The Qwen3-Coder-Next series comes in only one size but offers different thinking modes. Recommended starting configurations vary depending on hardware.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model size, quantization method, and thinking capabilities.

import Qwen3CoderNextConfigGenerator from '@site/src/components/autoregressive/Qwen3CoderNextConfigGenerator';

<Qwen3CoderNextConfigGenerator />

### 3.2 Configuration Tips

- `--max-mamba-cache-size`: Adjust `--max-mamba-cache-size` to increase mamba cache space and max running requests capability. It will decrease KV cache space as a trade-off. You can adjust it according to workload.
- `--mamba-ssm-dtype`: `bfloat16` or `float32`, use `bfloat16` to save mamba cache size and `float32` to get more accurate results. The default setting is `float32`.
- `--mamba-full-memory-ratio`: Adjust `--mamba-full-memory-ratio` to set the ratio of mamba state memory to full kv cache memory. The default setting is `0.9`.

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

### 4.2 Advanced Usage

#### 4.2.1 Reasoning Parser

1. **Streaming with Thinking Process:**

   Qwen3-Coder-Next-80B-A3B-Thinking only supports thinking mode. Enable the reasoning parser during deployment to separate the thinking and the content sections.

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-Coder-Next-80B-A3B-Thinking \
  --reasoning-parser qwen3 \
  --tp 8 \
  --host 0.0.0.0 \
  --port 8000
```

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="EMPTY"
)

# Enable streaming to see the thinking process in real-time
response = client.chat.completions.create(
    model="Qwen/Qwen3-Coder-Next-80B-A3B-Thinking",
    messages=[
        {"role": "user", "content": "Write a Python function to find the longest palindromic substring in a given string using dynamic programming."}
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

````
=============== Thinking =================
Okay, the user wants a Python function to find the longest palindromic substring using dynamic programming. Let me think about this step by step.

First, I need to understand what a palindrome is. A palindrome reads the same forwards and backwards. For example, "aba" or "racecar" are palindromes.

The problem is to find the longest such substring in a given string. I need to use dynamic programming for this.

Let me recall the DP approach. I'll create a 2D DP table where dp[i][j] is True if the substring from index i to j is a palindrome.

The base cases are:
- Single characters are palindromes: dp[i][i] = True
- Two characters are palindromes if they're equal: dp[i][i+1] = True if s[i] == s[i+1]

For longer substrings, a substring s[i:j+1] is a palindrome if:
- s[i] == s[j] (first and last characters match)
- AND dp[i+1][j-1] is True (the inner substring is a palindrome)

I'll need to iterate through all possible substring lengths, starting from 1 and going up to the length of the string. For each length, I'll check all possible starting positions.

I should keep track of the longest palindrome found so far. Let me code this up.

Actually, I need to be careful with the indexing. Let me use length-based iteration to make it clearer.

=============== Content =================

Here's a Python function to find the longest palindromic substring using dynamic programming:

```python
def longest_palindromic_substring(s: str) -> str:
    """
    Find the longest palindromic substring using dynamic programming.

    Args:
        s: Input string

    Returns:
        The longest palindromic substring
    """
    if not s:
        return ""

    n = len(s)
    # dp[i][j] will be True if substring s[i:j+1] is a palindrome
    dp = [[False] * n for _ in range(n)]

    # Track the longest palindrome found
    max_length = 1
    start = 0

    # Every single character is a palindrome
    for i in range(n):
        dp[i][i] = True

    # Check for two-character palindromes
    for i in range(n - 1):
        if s[i] == s[i + 1]:
            dp[i][i + 1] = True
            max_length = 2
            start = i

    # Check for palindromes of length 3 and more
    for length in range(3, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1

            # Check if s[i:j+1] is a palindrome
            if s[i] == s[j] and dp[i + 1][j - 1]:
                dp[i][j] = True
                if length > max_length:
                    max_length = length
                    start = i

    return s[start:start + max_length]


# Test the function
if __name__ == "__main__":
    test_cases = [
        "babad",      # Expected: "bab" or "aba"
        "cbbd",       # Expected: "bb"
        "racecar",    # Expected: "racecar"
        "a",          # Expected: "a"
        "ac",         # Expected: "a" or "c"
    ]

    for test in test_cases:
        result = longest_palindromic_substring(test)
        print(f"Input: '{test}' -> Longest palindrome: '{result}'")
```

**Time Complexity:** O(n²) where n is the length of the string
**Space Complexity:** O(n²) for the DP table

**How it works:**

1. **Initialize DP table**: Create a 2D boolean table where `dp[i][j]` indicates if substring from index i to j is a palindrome

2. **Base cases**:
   - Single characters (length 1) are always palindromes
   - Two-character substrings are palindromes if both characters are equal

3. **Build up solutions**: For each substring length from 3 to n, check if it's a palindrome by:
   - Verifying the first and last characters match
   - Checking if the inner substring is already marked as a palindrome

4. **Track maximum**: Keep track of the longest palindrome found during the process

5. **Return result**: Return the substring using the stored start position and maximum length
````

**Note:** The reasoning parser captures the model's step-by-step thought process about the algorithm design, showing how it arrives at the solution.

2. **Turn off Thinking:**

   Qwen3-Coder-Next-80B-A3B-Instruct only supports instruct (non-thinking) mode.

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-Coder-Next-80B-A3B-Instruct \
  --tp 8
```

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="EMPTY"
)

# Turn off thinking process
response = client.chat.completions.create(
    model="Qwen/Qwen3-Coder-Next-80B-A3B-Instruct",
    messages=[
        {"role": "user", "content": "Write a Python function to find the longest palindromic substring in a given string using dynamic programming."}
    ],
    temperature=0.7,
    max_tokens=2048,
    stream=True,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}}
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
Here's a Python function to find the longest palindromic substring using dynamic programming:

```python
def longest_palindromic_substring(s: str) -> str:
    """
    Find the longest palindromic substring using dynamic programming.

    Time Complexity: O(n²)
    Space Complexity: O(n²)
    """
    if not s:
        return ""

    n = len(s)
    dp = [[False] * n for _ in range(n)]

    max_length = 1
    start = 0

    # Single characters are palindromes
    for i in range(n):
        dp[i][i] = True

    # Check two-character palindromes
    for i in range(n - 1):
        if s[i] == s[i + 1]:
            dp[i][i + 1] = True
            max_length = 2
            start = i

    # Check palindromes of length 3+
    for length in range(3, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j] and dp[i + 1][j - 1]:
                dp[i][j] = True
                if length > max_length:
                    max_length = length
                    start = i

    return s[start:start + max_length]
```

**Example usage:**

```python
print(longest_palindromic_substring("babad"))    # "bab" or "aba"
print(longest_palindromic_substring("cbbd"))     # "bb"
print(longest_palindromic_substring("racecar"))  # "racecar"
```

#### 4.2.2 Tool Calling

Qwen/Qwen3-Coder-Next-80B-A3B-Instruct | Qwen/Qwen3-Coder-Next-80B-A3B-Thinking both support tool calling capabilities. Enable the tool call parser using `--tool-call-parser qwen_coder`:

**Python Example (without Thinking Process):**

Start sglang server:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-Coder-Next-80B-A3B-Instruct \
  --tool-call-parser qwen_coder \
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
            "name": "execute_code",
            "description": "Execute Python code and return the output",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "The Python code to execute"
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Maximum execution time in seconds",
                        "default": 30
                    }
                },
                "required": ["code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_documentation",
            "description": "Search programming documentation and API references",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query"
                    },
                    "language": {
                        "type": "string",
                        "description": "Programming language",
                        "enum": ["python", "javascript", "java", "cpp", "go", "rust"]
                    }
                },
                "required": ["query", "language"]
            }
        }
    }
]

# Make request with streaming
response = client.chat.completions.create(
    model="Qwen/Qwen3-Coder-Next-80B-A3B-Instruct",
    messages=[
        {"role": "user", "content": "Can you help me test if my fibonacci function works correctly for n=10?"}
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
<tool_call>
{"name": "execute_code", "arguments": {"code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(f'fibonacci(10) = {fibonacci(10)}')"}}
</tool_call>
```

**Python Example (with Thinking Process):**

Start sglang server:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-Coder-Next-80B-A3B-Thinking \
  --reasoning-parser qwen3 \
  --tool-call-parser qwen_coder \
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
            "name": "execute_code",
            "description": "Execute Python code and return the output",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "The Python code to execute"
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "Maximum execution time in seconds",
                        "default": 30
                    }
                },
                "required": ["code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_documentation",
            "description": "Search programming documentation and API references",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query"
                    },
                    "language": {
                        "type": "string",
                        "description": "Programming language",
                        "enum": ["python", "javascript", "java", "cpp", "go", "rust"]
                    }
                },
                "required": ["query", "language"]
            }
        }
    }
]

# Make request with streaming to see thinking process
response = client.chat.completions.create(
    model="Qwen/Qwen3-Coder-Next-80B-A3B-Thinking",
    messages=[
        {"role": "user", "content": "Can you help me test if my fibonacci function works correctly for n=10?"}
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
Okay, the user wants to test a fibonacci function for n=10. Let me think about what they're asking. They mentioned "my fibonacci function," but they haven't provided the code yet. I should help them test it.

To test the function, I need to execute it. I have the execute_code tool available. I should write a standard fibonacci implementation and run it for n=10 to show them what the expected output should be.

The fibonacci sequence for n=10 should be 55. Let me write a clean recursive implementation first, though I know it's not the most efficient. Then I can execute it to verify.

So I'll call execute_code with a fibonacci function and print the result for n=10.

=============== Content =================

<tool_call>
{"name": "execute_code", "arguments": {"code": "def fibonacci(n):\n    \"\"\"Calculate the nth Fibonacci number using recursion.\"\"\"\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# Test for n=10\nresult = fibonacci(10)\nprint(f'fibonacci(10) = {result}')\nprint(f'\\nExpected: 55')\n\n# Show the sequence up to n=10\nprint('\\nFibonacci sequence (0 to 10):')\nfor i in range(11):\n    print(f'F({i}) = {fibonacci(i)}')"}}
</tool_call>
```

**Note:**

- The `qwen_coder` parser is specifically designed for code-related tool calls
- The reasoning parser shows how the model decides which tool to use and what code to execute
- Tool calls are clearly marked with the function name and arguments
- You can then execute the function and send the result back to continue the conversation

**Handling Tool Call Results:**

```python
# After getting the tool call, execute the function
def execute_code(code, timeout=30):
    # Your actual code execution logic here
    # This is a simplified example
    import sys
    from io import StringIO

    old_stdout = sys.stdout
    sys.stdout = StringIO()

    try:
        exec(code)
        output = sys.stdout.getvalue()
    except Exception as e:
        output = f"Error: {str(e)}"
    finally:
        sys.stdout = old_stdout

    return output

# Send tool result back to the model
messages = [
    {"role": "user", "content": "Can you help me test if my fibonacci function works correctly for n=10?"},
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": "call_123",
            "type": "function",
            "function": {
                "name": "execute_code",
                "arguments": '{"code": "def fibonacci(n):\\n    if n <= 1:\\n        return n\\n    return fibonacci(n-1) + fibonacci(n-2)\\n\\nprint(f\'fibonacci(10) = {fibonacci(10)}\')"}'
            }
        }]
    },
    {
        "role": "tool",
        "tool_call_id": "call_123",
        "content": execute_code("def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(f'fibonacci(10) = {fibonacci(10)}')")
    }
]

final_response = client.chat.completions.create(
    model="Qwen/Qwen3-Coder-Next-80B-A3B-Thinking",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# Output: "Great! The fibonacci function works correctly. For n=10, it returns 55, which is the correct 10th Fibonacci number."
```

#### 4.2.3 Processing Large Codebases

Qwen3-Coder-Next natively supports context lengths of up to 262,144 tokens, making it ideal for analyzing entire codebases, large repositories, or comprehensive documentation. For conversations where the total length (including both input and output) significantly exceeds this limit, we recommend using RoPE scaling techniques to handle ultra-long contexts effectively. We have validated the model's performance on context lengths of up to 1 million tokens using the YaRN method.

**Qwen3-Coder-Next-80B-A3B-Instruct**

```
SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1 python -m sglang.launch_server --model Qwen/Qwen3-Coder-Next-80B-A3B-Instruct    --tp 8   --host 0.0.0.0   --port 8000 --json-model-override-args '{"rope_scaling":{"rope_type":"yarn","factor":4.0,"original_max_position_embeddings":262144}}' --context-length 1010000

```

**Qwen3-Coder-Next-80B-A3B-Thinking**

```
SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1 python -m sglang.launch_server --model Qwen/Qwen3-Coder-Next-80B-A3B-Thinking   --reasoning-parser qwen3     --tp 8   --host 0.0.0.0   --port 8000 --json-model-override-args '{"rope_scaling":{"rope_type":"yarn","factor":4.0,"original_max_position_embeddings":262144}}' --context-length 1010000

```

## 5. Benchmark

### 5.1 Speed Benchmark

- Hardware: NVIDIA B200 GPU (8x)
- Model: Qwen3-Coder-Next
- Tensor Parallelism: 8
- sglang version: 0.5.8

We use SGLang's built-in benchmarking tool to conduct performance evaluation.

#### 5.1.1 Standard Scenario Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-Coder-Next \
  --tp 8
```

##### 5.1.1.1 Low Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-Coder-Next \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Result
```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  29.26
Total input tokens:                      6101
Total input text tokens:                 6101
Total generated tokens:                  4220
Total generated tokens (retokenized):    4218
Request throughput (req/s):              0.34
Input token throughput (tok/s):          208.50
Output token throughput (tok/s):         144.22
Peak output token throughput (tok/s):    156.00
Peak concurrent requests:                2
Total token throughput (tok/s):          352.71
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   2924.54
Median E2E Latency (ms):                 2346.49
P90 E2E Latency (ms):                    5236.54
P99 E2E Latency (ms):                    6595.22
---------------Time to First Token----------------
Mean TTFT (ms):                          182.07
Median TTFT (ms):                        169.87
P99 TTFT (ms):                           308.58
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          6.49
Median TPOT (ms):                        6.51
P99 TPOT (ms):                           6.61
---------------Inter-Token Latency----------------
Mean ITL (ms):                           6.51
Median ITL (ms):                         6.50
P95 ITL (ms):                            6.90
P99 ITL (ms):                            7.11
Max ITL (ms):                            9.29
==================================================
```


##### 5.1.1.2 Medium Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-Coder-Next \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Result
```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  37.85
Total input tokens:                      39668
Total input text tokens:                 39668
Total generated tokens:                  40805
Total generated tokens (retokenized):    40782
Request throughput (req/s):              2.11
Input token throughput (tok/s):          1048.12
Output token throughput (tok/s):         1078.16
Peak output token throughput (tok/s):    1800.00
Peak concurrent requests:                21
Total token throughput (tok/s):          2126.28
Concurrency:                             14.12
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   6682.28
Median E2E Latency (ms):                 6969.51
P90 E2E Latency (ms):                    11171.99
P99 E2E Latency (ms):                    13442.15
---------------Time to First Token----------------
Mean TTFT (ms):                          193.10
Median TTFT (ms):                        164.01
P99 TTFT (ms):                           328.78
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          13.49
Median TPOT (ms):                        13.23
P99 TPOT (ms):                           32.74
---------------Inter-Token Latency----------------
Mean ITL (ms):                           12.75
Median ITL (ms):                         8.87
P95 ITL (ms):                            9.58
P99 ITL (ms):                            163.80
Max ITL (ms):                            678.22
==================================================
```

##### 5.1.1.3 High Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-Coder-Next \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 500 \
  --max-concurrency 100
```

- Result
```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 100
Successful requests:                     500
Benchmark duration (s):                  95.13
Total input tokens:                      249831
Total input text tokens:                 249831
Total generated tokens:                  252662
Total generated tokens (retokenized):    252559
Request throughput (req/s):              5.26
Input token throughput (tok/s):          2626.15
Output token throughput (tok/s):         2655.91
Peak output token throughput (tok/s):    6052.00
Peak concurrent requests:                110
Total token throughput (tok/s):          5282.07
Concurrency:                             94.46
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   17973.10
Median E2E Latency (ms):                 16125.71
P90 E2E Latency (ms):                    34398.63
P99 E2E Latency (ms):                    39805.37
---------------Time to First Token----------------
Mean TTFT (ms):                          261.56
Median TTFT (ms):                        161.82
P99 TTFT (ms):                           826.50
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          35.74
Median TPOT (ms):                        38.92
P99 TPOT (ms):                           49.50
---------------Inter-Token Latency----------------
Mean ITL (ms):                           35.12
Median ITL (ms):                         14.98
P95 ITL (ms):                            170.02
P99 ITL (ms):                            320.01
Max ITL (ms):                            812.28
==================================================
```

#### 5.1.2 Reasoning Scenario Benchmark


##### 5.1.2.1 Low Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-Coder-Next \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Result
```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  314.90
Total input tokens:                      6101
Total input text tokens:                 6101
Total generated tokens:                  44462
Total generated tokens (retokenized):    43747
Request throughput (req/s):              0.03
Input token throughput (tok/s):          19.37
Output token throughput (tok/s):         141.19
Peak output token throughput (tok/s):    157.00
Peak concurrent requests:                2
Total token throughput (tok/s):          160.57
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   31486.75
Median E2E Latency (ms):                 33369.37
P90 E2E Latency (ms):                    54281.05
P99 E2E Latency (ms):                    56579.22
---------------Time to First Token----------------
Mean TTFT (ms):                          101.10
Median TTFT (ms):                        101.77
P99 TTFT (ms):                           110.05
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          6.90
Median TPOT (ms):                        6.95
P99 TPOT (ms):                           7.31
---------------Inter-Token Latency----------------
Mean ITL (ms):                           7.06
Median ITL (ms):                         7.02
P95 ITL (ms):                            7.90
P99 ITL (ms):                            8.30
Max ITL (ms):                            20.26
==================================================
```

##### 5.1.2.2 Medium Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-Coder-Next \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Result
```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  231.22
Total input tokens:                      39668
Total input text tokens:                 39668
Total generated tokens:                  318306
Total generated tokens (retokenized):    318114
Request throughput (req/s):              0.35
Input token throughput (tok/s):          171.56
Output token throughput (tok/s):         1376.64
Peak output token throughput (tok/s):    1824.00
Peak concurrent requests:                19
Total token throughput (tok/s):          1548.20
Concurrency:                             13.72
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   39658.52
Median E2E Latency (ms):                 39170.91
P90 E2E Latency (ms):                    75070.70
P99 E2E Latency (ms):                    78699.05
---------------Time to First Token----------------
Mean TTFT (ms):                          125.90
Median TTFT (ms):                        94.55
P99 TTFT (ms):                           282.01
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          9.89
Median TPOT (ms):                        9.97
P99 TPOT (ms):                           10.41
---------------Inter-Token Latency----------------
Mean ITL (ms):                           9.94
Median ITL (ms):                         9.79
P95 ITL (ms):                            10.28
P99 ITL (ms):                            10.62
Max ITL (ms):                            199.25
==================================================
```

##### 5.1.2.3 High Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-Coder-Next \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 320 \
  --max-concurrency 64
```

- Result
```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 64
Successful requests:                     320
Benchmark duration (s):                  361.93
Total input tokens:                      158939
Total input text tokens:                 158939
Total generated tokens:                  1301025
Total generated tokens (retokenized):    1298607
Request throughput (req/s):              0.88
Input token throughput (tok/s):          439.14
Output token throughput (tok/s):         3594.70
Peak output token throughput (tok/s):    4672.00
Peak concurrent requests:                68
Total token throughput (tok/s):          4033.85
Concurrency:                             56.20
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   63562.47
Median E2E Latency (ms):                 66722.18
P90 E2E Latency (ms):                    113874.86
P99 E2E Latency (ms):                    125758.66
---------------Time to First Token----------------
Mean TTFT (ms):                          227.54
Median TTFT (ms):                        147.32
P99 TTFT (ms):                           596.33
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          15.69
Median TPOT (ms):                        16.02
P99 TPOT (ms):                           17.09
---------------Inter-Token Latency----------------
Mean ITL (ms):                           15.58
Median ITL (ms):                         14.68
P95 ITL (ms):                            30.19
P99 ITL (ms):                            96.92
Max ITL (ms):                            514.23
==================================================
```

#### 5.1.3 Summarization Scenario Benchmark

##### 5.1.3.1 Low Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-Coder-Next \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1
```

- Result
```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  32.77
Total input tokens:                      41941
Total input text tokens:                 41941
Total generated tokens:                  4220
Total generated tokens (retokenized):    4220
Request throughput (req/s):              0.31
Input token throughput (tok/s):          1280.00
Output token throughput (tok/s):         128.79
Peak output token throughput (tok/s):    151.00
Peak concurrent requests:                2
Total token throughput (tok/s):          1408.79
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   3274.92
Median E2E Latency (ms):                 2678.66
P90 E2E Latency (ms):                    6339.94
P99 E2E Latency (ms):                    7180.83
---------------Time to First Token----------------
Mean TTFT (ms):                          166.70
Median TTFT (ms):                        186.70
P99 TTFT (ms):                           212.54
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          7.29
Median TPOT (ms):                        7.36
P99 TPOT (ms):                           8.07
---------------Inter-Token Latency----------------
Mean ITL (ms):                           7.38
Median ITL (ms):                         7.37
P95 ITL (ms):                            8.21
P99 ITL (ms):                            8.43
Max ITL (ms):                            9.84
==================================================
```

##### 5.1.3.2 Medium Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-Coder-Next \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16
```

- Result
```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  41.65
Total input tokens:                      300020
Total input text tokens:                 300020
Total generated tokens:                  41669
Total generated tokens (retokenized):    41668
Request throughput (req/s):              1.92
Input token throughput (tok/s):          7202.60
Output token throughput (tok/s):         1000.35
Peak output token throughput (tok/s):    1598.00
Peak concurrent requests:                20
Total token throughput (tok/s):          8202.95
Concurrency:                             14.20
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   7391.56
Median E2E Latency (ms):                 8012.32
P90 E2E Latency (ms):                    12004.72
P99 E2E Latency (ms):                    14509.32
---------------Time to First Token----------------
Mean TTFT (ms):                          267.16
Median TTFT (ms):                        187.92
P99 TTFT (ms):                           870.57
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          13.94
Median TPOT (ms):                        14.20
P99 TPOT (ms):                           19.86
---------------Inter-Token Latency----------------
Mean ITL (ms):                           13.70
Median ITL (ms):                         10.06
P95 ITL (ms):                            10.76
P99 ITL (ms):                            179.45
Max ITL (ms):                            644.90
==================================================
```

##### 5.1.3.3 High Concurrency

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --model Qwen/Qwen3-Coder-Next \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 320 \
  --max-concurrency 64
```

- Result
```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 64
Successful requests:                     320
Benchmark duration (s):                  82.26
Total input tokens:                      1273893
Total input text tokens:                 1273893
Total generated tokens:                  170000
Total generated tokens (retokenized):    169978
Request throughput (req/s):              3.89
Input token throughput (tok/s):          15486.19
Output token throughput (tok/s):         2066.62
Peak output token throughput (tok/s):    4070.00
Peak concurrent requests:                70
Total token throughput (tok/s):          17552.81
Concurrency:                             59.79
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   15369.65
Median E2E Latency (ms):                 14994.49
P90 E2E Latency (ms):                    27177.34
P99 E2E Latency (ms):                    32130.24
---------------Time to First Token----------------
Mean TTFT (ms):                          380.98
Median TTFT (ms):                        188.43
P99 TTFT (ms):                           2106.59
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          28.66
Median TPOT (ms):                        29.99
P99 TPOT (ms):                           39.77
---------------Inter-Token Latency----------------
Mean ITL (ms):                           28.27
Median ITL (ms):                         14.83
P95 ITL (ms):                            175.20
P99 ITL (ms):                            201.75
Max ITL (ms):                            1881.11
==================================================
```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

- **Benchmark Command:**

```shell
python3 -m sglang.test.few_shot_gsm8k --num-questions 200
```

- Result
```
Accuracy: 0.955
Invalid: 0.000
Latency: 10.758 s
Output throughput: 2313.535 token/s
```
