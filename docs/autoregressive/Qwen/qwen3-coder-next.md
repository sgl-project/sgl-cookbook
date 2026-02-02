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

```
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
```

**Note:** The reasoning parser captures the model's step-by-step thought process about the algorithm design, showing how it arrives at the solution.

2. **Turn off Thinking:**

   Qwen3-Coder-Next-80B-A3B-Instruct only supports instruct (non-thinking) mode.

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-Coder-Next-80B-A3B-Instruct \
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
```

#### 4.2.2 Tool Calling

Qwen/Qwen3-Coder-Next-80B-A3B-Instruct | Qwen/Qwen3-Coder-Next-80B-A3B-Thinking both support tool calling capabilities. Enable the tool call parser using `--tool-call-parser qwen_coder`:

**Python Example (without Thinking Process):**

Start sglang server:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-Coder-Next-80B-A3B-Instruct \
  --tool-call-parser qwen_coder \
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
