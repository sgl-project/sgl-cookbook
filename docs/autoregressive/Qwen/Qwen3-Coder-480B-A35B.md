---
sidebar_position: 4
---

# Qwen3-Coder-480B-A35B

## 1. Model Introduction

[Qwen3-Coder-480B-A35B](https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct) is a Mixture-of-Experts (MoE) coding model from the Qwen team.

Model specifications:

- **Parameters**: 480B total parameters with 35B activated per token.
- **MoE Architecture**: 160 experts with 8 experts activated per token.
- **Context Length**: Supports up to 262K tokens.
- **ROCm Support**: Compatible with AMD MI300X GPUs via SGLang (verified).

For more details, please refer to the [official Qwen3-Coder model page](https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct).

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations verified on AMD MI300X hardware platform.

### 3.1 Basic Configuration

The Qwen3-Coder-480B-A35B model requires 8 GPUs for deployment. The following configurations have been verified on AMD MI300X GPUs.

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform and quantization method.

import Qwen3CoderConfigGenerator from '@site/src/components/autoregressive/Qwen3CoderConfigGenerator';

<Qwen3CoderConfigGenerator />

### 3.2 Configuration Tips

* **Memory Management**: We have verified successful deployment with `--context-length 8192`. Larger context lengths may be supported but require additional memory.
* **Expert Parallelism**: For FP8 quantization, `--ep 2` is required.
* **Page Size**: `--page-size 32` is recommended for MoE models to optimize memory usage.
* **Environment Variable**: If you encounter aiter-related issues, try setting `SGLANG_USE_AITER=0`.


## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

### 4.2 Advanced Usage

#### 4.2.1 Code Generation Example

```python
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://localhost:30000/v1",
    timeout=3600
)

messages = [
    {
        "role": "user",
        "content": "Write a Python function that implements binary search on a sorted list. Include docstring and type hints."
    }
]

response = client.chat.completions.create(
    model="Qwen/Qwen3-Coder-480B-A35B-Instruct",
    messages=messages,
    max_tokens=2048,
    temperature=0.7
)

print(response.choices[0].message.content)
```

**Example Output:**

```python
from typing import List, Optional

def binary_search(arr: List[int], target: int) -> Optional[int]:
    """
    Performs binary search on a sorted list to find the index of a target value.

    Args:
        arr (List[int]): A sorted list of integers to search through.
        target (int): The integer value to search for.

    Returns:
        Optional[int]: The index of the target value if found, None otherwise.

    Time Complexity: O(log n)
    Space Complexity: O(1)

    Examples:
        >>> binary_search([1, 2, 3, 4, 5], 3)
        2
        >>> binary_search([1, 2, 3, 4, 5], 6)
        None
    """
    if not arr:
        return None

    left: int = 0
    right: int = len(arr) - 1

    while left <= right:
        mid: int = left + (right - left) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return None
```

## Reference

- [Qwen3](./Qwen3)
- [Expert Parallelism Deployment](https://github.com/sgl-project/sglang/blob/main/docs/advanced_features/expert_parallelism.md)
