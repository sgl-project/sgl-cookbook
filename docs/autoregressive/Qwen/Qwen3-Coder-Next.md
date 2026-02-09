# Qwen3-Coder-Next

## 1. Model Introduction

[Qwen3-Coder-Next](https://huggingface.co/Qwen/Qwen3-Coder-Next) is a cost-efficient code-focused language model from the Qwen team (Alibaba). With 80B total parameters but only 3B activated parameters, it achieves performance comparable to models with 10–20x more active parameters through its innovative hybrid architecture.

**Key Features:**

- **Hybrid Architecture**: Uses a 48-layer hybrid layout combining Gated DeltaNet and Gated Attention with Mixture-of-Experts (512 total experts, 10 activated, 1 shared), enabling exceptional efficiency.
- **Tool Calling Support**: Advanced agentic capabilities with native support for function calling and tool use via the `qwen3_coder` parser.
- **Extended Context Length**: Supports up to 256K tokens for processing large codebases and long documents.
- **Cost-Efficient Inference**: Only 3B parameters activated per token, making it ideal for local development and cost-effective deployment at scale.
- **IDE Integration**: Compatible with Claude Code, Qwen Code, Cline, and other IDE platforms.

For more details, please refer to the [Qwen3-Coder-Next model card](https://huggingface.co/Qwen/Qwen3-Coder-Next).

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

**Note:** Qwen3-Coder-Next requires SGLang v0.5.8 or later.

## 3. Model Deployment

This section provides a progressive guide from quick deployment to performance optimization, suitable for users at different levels.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform and deployment options.

import Qwen3CoderNextConfigGenerator from '@site/src/components/autoregressive/Qwen3CoderNextConfigGenerator';

<Qwen3CoderNextConfigGenerator />

### 3.2 Configuration Tips

- **Context Length**: The model supports up to 256K tokens natively. If you encounter OOM issues, try `--context-length 32768`.
- **Tool Use**: To enable tool calling capabilities, use the `--tool-call-parser qwen3_coder` flag.
- **Sampling Parameters**: SGLang automatically applies the recommended sampling parameters from the model's `generation_config.json`. No manual configuration is needed.

## 4. Model Invocation

**Deployment Command:**

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-Coder-Next \
  --tp 2 \
  --tool-call-parser qwen3_coder \
  --host 0.0.0.0 \
  --port 30000
```

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

### 4.2 Advanced Usage

#### 4.2.1 Code Generation Example

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY"
)

response = client.chat.completions.create(
    model="Qwen/Qwen3-Coder-Next",
    messages=[
        {"role": "user", "content": "Write a Python function that implements binary search on a sorted list. Include type hints."}
    ],
    max_tokens=2048
)

print(response.choices[0].message.content)
```

**Example Output:**

````
Here's a Python function implementing binary search on a sorted list, with comprehensive type hints:

```python
from typing import Sequence, TypeVar, Optional

T = TypeVar('T')

def binary_search(sorted_list: Sequence[T], target: T) -> Optional[int]:
    """
    Perform binary search on a sorted list to find the index of a target element.

    Args:
        sorted_list: A sequence (e.g., list, tuple) sorted in ascending order.
        target: The element to search for in the list.

    Returns:
        The index of the target element if found, or None if not found.

    Time Complexity: O(log n)
    Space Complexity: O(1)

    Note:
        The function assumes the list is sorted in ascending order.
        If the list contains duplicate elements, it returns the index of one of them.
    """
    left = 0
    right = len(sorted_list) - 1

    while left <= right:
        mid = (left + right) // 2
        mid_val = sorted_list[mid]

        if mid_val == target:
            return mid
        elif mid_val < target:
            left = mid + 1
        else:
            right = mid - 1

    return None
```

### Example usage:

```python
# Example 1: Finding an existing element
numbers = [1, 3, 5, 7, 9, 11]
print(binary_search(numbers, 7))  # Output: 3

# Example 2: Element not in the list
print(binary_search(numbers, 4))  # Output: None

# Example 3: Empty list
print(binary_search([], 5))  # Output: None

# Example 4: Single element
print(binary_search([1], 1))  # Output: 0
print(binary_search([1], 2))  # Output: None
```

### Key features:
- Uses `TypeVar` to support generic types (as long as comparison operations are defined)
- Returns `Optional[int]` to indicate either the index or no match found
- Uses `Sequence[T]` to accept any sequence type (list, tuple, etc.)
- Includes comprehensive docstring with time/space complexity
- Implements standard iterative binary search for O(1) space complexity
````

#### 4.2.2 Streaming Example

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY"
)

response = client.chat.completions.create(
    model="Qwen/Qwen3-Coder-Next",
    messages=[
        {"role": "user", "content": "Explain the difference between a stack and a queue in 3 sentences."}
    ],
    max_tokens=512,
    stream=True
)

for chunk in response:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
print()
```

**Example Output:**

```
A **stack** follows the **Last In, First Out (LIFO)** principle, meaning the last element added is the first one removed—operations like `push` (add) and `pop` (remove) occur at the same end, called the *top*. In contrast, a **queue** follows the **First In, First Out (FIFO)** principle, where elements are added at the *back* (enqueue) and removed from the *front* (dequeue), preserving the order of insertion. This structural difference makes stacks ideal for tasks like function call management and expression evaluation, while queues suit scheduling, buffering, and breadth-first traversal.
```

#### 4.2.3 Tool Calling Example

Qwen3-Coder-Next supports tool calling capabilities. Make sure `--tool-call-parser qwen3_coder` is included in the deployment command above.

**Python Example:**

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
            "name": "execute_code",
            "description": "Execute Python code and return the result",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "The Python code to execute"
                    }
                },
                "required": ["code"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="Qwen/Qwen3-Coder-Next",
    messages=[
        {"role": "user", "content": "Calculate the factorial of 10 using Python"}
    ],
    tools=tools
)

# Check if the model wants to call a tool
if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    print(f"Tool: {tool_call.function.name}")
    print(f"Arguments: {tool_call.function.arguments}")
else:
    print(response.choices[0].message.content)
```

**Example Output:**

```
Tool: execute_code
Arguments: {"code": "import math\nmath.factorial(10)"}
```

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA B200 GPU (2x)
- Model: Qwen/Qwen3-Coder-Next
- Tensor Parallelism: 2
- sglang version: 0.5.8+

#### 5.1.1 Latency-Sensitive Benchmark

- Model Deployment Command:

```shell
python -m sglang.launch_server \
  --model Qwen/Qwen3-Coder-Next \
  --tp 2 \
  --host 0.0.0.0 \
  --port 30000
```

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 30000 \
  --model Qwen/Qwen3-Coder-Next \
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
Benchmark duration (s):                  20.92
Total input tokens:                      1997
Total input text tokens:                 1997
Total generated tokens:                  2798
Total generated tokens (retokenized):    2797
Request throughput (req/s):              0.48
Input token throughput (tok/s):          95.45
Output token throughput (tok/s):         133.74
Peak output token throughput (tok/s):    157.00
Peak concurrent requests:                3
Total token throughput (tok/s):          229.19
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   2088.44
Median E2E Latency (ms):                 2283.11
P90 E2E Latency (ms):                    3123.91
P99 E2E Latency (ms):                    3533.93
---------------Time to First Token----------------
Mean TTFT (ms):                          259.32
Median TTFT (ms):                        290.78
P99 TTFT (ms):                           327.80
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          6.61
Median TPOT (ms):                        6.60
P99 TPOT (ms):                           6.88
---------------Inter-Token Latency----------------
Mean ITL (ms):                           6.56
Median ITL (ms):                         6.53
P95 ITL (ms):                            7.55
P99 ITL (ms):                            8.01
Max ITL (ms):                            13.56
==================================================
```

#### 5.1.2 Throughput-Sensitive Benchmark

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 30000 \
  --model Qwen/Qwen3-Coder-Next \
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
Benchmark duration (s):                  176.11
Total input tokens:                      302118
Total input text tokens:                 302118
Total generated tokens:                  195775
Total generated tokens (retokenized):    195566
Request throughput (req/s):              5.68
Input token throughput (tok/s):          1715.51
Output token throughput (tok/s):         1111.66
Peak output token throughput (tok/s):    4362.00
Peak concurrent requests:                119
Total token throughput (tok/s):          2827.17
Concurrency:                             95.07
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   16742.04
Median E2E Latency (ms):                 10633.62
P90 E2E Latency (ms):                    41046.49
P99 E2E Latency (ms):                    75870.86
---------------Time to First Token----------------
Mean TTFT (ms):                          437.66
Median TTFT (ms):                        388.08
P99 TTFT (ms):                           1355.31
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          92.28
Median TPOT (ms):                        92.24
P99 TPOT (ms):                           265.24
---------------Inter-Token Latency----------------
Mean ITL (ms):                           83.73
Median ITL (ms):                         20.48
P95 ITL (ms):                            568.34
P99 ITL (ms):                            603.16
Max ITL (ms):                            1540.42
==================================================
```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

- **Benchmark Command:**

```shell
python benchmark/gsm8k/bench_sglang.py --port 30000
```

- **Test Results:**

```
Accuracy: 0.965
Invalid: 0.000
Latency: 26.407 s
Output throughput: 929.132 token/s
```

#### 5.2.2 MMLU Benchmark

- **Benchmark Command:**

```shell
cd benchmark/mmlu
bash download_data.sh
python3 bench_sglang.py --port 30000
```

- **Test Results:**

```
subject: abstract_algebra, #q:100, acc: 0.780
subject: anatomy, #q:135, acc: 0.807
subject: astronomy, #q:152, acc: 0.921
subject: business_ethics, #q:100, acc: 0.820
subject: clinical_knowledge, #q:265, acc: 0.860
subject: college_biology, #q:144, acc: 0.944
subject: college_chemistry, #q:100, acc: 0.590
subject: college_computer_science, #q:100, acc: 0.820
subject: college_mathematics, #q:100, acc: 0.800
subject: college_medicine, #q:173, acc: 0.803
subject: college_physics, #q:102, acc: 0.775
subject: computer_security, #q:100, acc: 0.880
subject: conceptual_physics, #q:235, acc: 0.936
subject: econometrics, #q:114, acc: 0.807
subject: electrical_engineering, #q:145, acc: 0.834
subject: elementary_mathematics, #q:378, acc: 0.854
subject: formal_logic, #q:126, acc: 0.802
subject: global_facts, #q:100, acc: 0.610
subject: high_school_biology, #q:310, acc: 0.971
subject: high_school_chemistry, #q:203, acc: 0.803
subject: high_school_computer_science, #q:100, acc: 0.920
subject: high_school_european_history, #q:165, acc: 0.891
subject: high_school_geography, #q:198, acc: 0.929
subject: high_school_government_and_politics, #q:193, acc: 0.969
subject: high_school_macroeconomics, #q:390, acc: 0.903
subject: high_school_mathematics, #q:270, acc: 0.689
subject: high_school_microeconomics, #q:238, acc: 0.962
subject: high_school_physics, #q:151, acc: 0.854
subject: high_school_psychology, #q:545, acc: 0.947
subject: high_school_statistics, #q:216, acc: 0.815
subject: high_school_us_history, #q:204, acc: 0.907
subject: high_school_world_history, #q:237, acc: 0.937
subject: human_aging, #q:223, acc: 0.821
subject: human_sexuality, #q:131, acc: 0.840
subject: international_law, #q:121, acc: 0.934
subject: jurisprudence, #q:108, acc: 0.870
subject: logical_fallacies, #q:163, acc: 0.847
subject: machine_learning, #q:112, acc: 0.812
subject: management, #q:103, acc: 0.922
subject: marketing, #q:234, acc: 0.923
subject: medical_genetics, #q:100, acc: 0.970
subject: miscellaneous, #q:783, acc: 0.941
subject: moral_disputes, #q:346, acc: 0.850
subject: moral_scenarios, #q:895, acc: 0.726
subject: nutrition, #q:306, acc: 0.915
subject: philosophy, #q:311, acc: 0.859
subject: prehistory, #q:324, acc: 0.889
subject: professional_accounting, #q:282, acc: 0.723
subject: professional_law, #q:1534, acc: 0.648
subject: professional_medicine, #q:272, acc: 0.923
subject: professional_psychology, #q:612, acc: 0.845
subject: public_relations, #q:110, acc: 0.782
subject: security_studies, #q:245, acc: 0.796
subject: sociology, #q:201, acc: 0.925
subject: us_foreign_policy, #q:100, acc: 0.950
subject: virology, #q:166, acc: 0.572
subject: world_religions, #q:171, acc: 0.883
Total latency: 208.985
Average accuracy: 0.834
```
