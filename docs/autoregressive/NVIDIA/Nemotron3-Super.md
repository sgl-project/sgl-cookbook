# NVIDIA Nemotron3-Super

## 1. Model Introduction

`NVIDIA Nemotron3-Super` is a hybrid LLM from NVIDIA that combines Mixture-of-Experts (MoE) feed-forward layers, Mamba2 sequence-modeling layers, and standard self-attention layers in a single stack, enabling efficient and high-quality inference.

<!-- TODO: Update model description, parameter count, and architecture details once the model is publicly available. -->

At a high level:

- **Hybrid layer stack (Mamba2 + MoE + attention):** The network is composed of interleaved layers that are *either* Mamba2, *or* MoE feed-forward, *or* attention-only.
- **Non-uniform layer ordering:** The order and mix of these specialized layers is not a simple, rigid pattern, enabling the model to trade off sequence modeling, routing capacity, and expressivity across depth.
- **Deployment-friendly precision:** Use BF16 for accuracy-sensitive and evaluation workloads; use FP8 for latency- and throughput-critical serving on recent NVIDIA GPUs.

> **Note:** The public model name will be updated once it is officially released. The placeholder model path used in this guide is `nvidia/nemotron-super-sft-020426`.


## 2. SGLang Installation

Refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html), or install via:
```bash
pip install sglang
```


## 3. Model Deployment

This section provides a progressive guide from quick deployment to performance tuning.

### 3.1 Basic Configuration

**Interactive Command Generator**: select hardware, tensor parallelism, and common knobs to generate a launch command.

import NemotronSuperConfigGenerator from '@site/src/components/autoregressive/NemotronSuperConfigGenerator';

<NemotronSuperConfigGenerator />

### 3.2 Configuration Tips

- **Attention backend**:

    **H200/B200**: use flashinfer attention backend by default.

- **TP support**:

    To set tp size, use `--tp <1|2|4|8>`. 

- **Expert Parallelism**:

    Use `--ep 1` for single-node deployments.

- **FP8 KV cache**:

    To enable fp8 kv cache, please append `--kv-cache-dtype fp8_e4m3`.


## 4. Model Invocation

```shell
python3 -m sglang.launch_server \
  --model-path nvidia/nemotron-super-sft-020426 \
  --host 0.0.0.0 \
  --port 5000 \
  --log-level warning \
  --trust-remote-code \
  --tp 4 \
  --ep 1 \
  --tool-call-parser qwen3_coder \
  --reasoning-parser nano_v3
```

### 4.1 Basic Usage (OpenAI-Compatible API)

SGLang provides an OpenAI-compatible endpoint. Example with the OpenAI Python client:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:5000/v1",
    api_key="EMPTY",
)

resp = client.chat.completions.create(
    model="nvidia/nemotron-super-sft-020426",
    messages=[
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "Give me 3 bullet points about SGLang."},
    ],
    temperature=0.6,
    max_tokens=512,
)
print("Reasoning:", resp.choices[0].message.reasoning_content, "\nContent:", resp.choices[0].message.content)
print("\n")
```

Output:
```
Reasoning: The user asks: "Give me 3 bullet points about SGLang." Likely they want concise bullet points summarizing SGLang. SGLang is a system for efficient LLM serving, developed by Stanford, focusing on fast inference with dynamic batching, etc. Provide three bullet points. Ensure correct info. Provide concise bullet points.
 
Content: - **High‑throughput LLM serving**: SGLang is a runtime engine designed to accelerate inference for large language models, delivering up to 10× higher throughput than traditional serving stacks by using optimized kernels and efficient memory management.  

- **Dynamic batching & pipelining**: It supports fine‑grained, request‑level batching and multi‑stage pipelining, allowing the system to continuously pack new queries into GPU work while keeping latency low.  

- **Open‑source & modular**: Built on PyTorch and CUDA, SGLang is released under an MIT license and provides a plug‑and‑play API that can be swapped into existing LLM pipelines (e.g., vLLM, TensorRT‑LLM) for easy performance upgrades.

```

Streaming chat completion:
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:5000/v1",
    api_key="EMPTY",
)

stream = client.chat.completions.create(
    model="nvidia/nemotron-super-sft-020426",
    messages=[
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "What are the first 5 prime numbers?"}
    ],
    temperature=0.7,
    max_tokens=1024,
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta
    if delta and delta.content:
        print(delta.content, end="", flush=True)
```

Output:
```
The first five prime numbers are:

1. **2**
2. **3**
3. **5**
4. **7**
5. **11**
```

### 4.2 Reasoning

The model supports two modes — Reasoning ON (default) vs OFF. This can be toggled by setting `enable_thinking` to `False`, as shown below.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:5000/v1",
    api_key="EMPTY",
)

# Reasoning on (default)
print("Reasoning on")
resp = client.chat.completions.create(
    model=SERVED_MODEL_NAME,
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Write a haiku about GPUs."}
    ],
    temperature=1,
    max_tokens=1024,
)
print(resp.choices[0].message.reasoning_content, resp.choices[0].message.content)
print("\n")
# Reasoning off
print("Reasoning off")
resp = client.chat.completions.create(
    model=SERVED_MODEL_NAME,
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Give me 3 facts about SGLang."}
    ],
    temperature=0,
    max_tokens=256,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}}
)
print(resp.choices[0].message.reasoning_content, resp.choices[0].message.content)
```

Output:
```
Reasoning on
We need to write a haiku (5-7-5 syllable poem) about GPUs. Ensure correct syllable count. Haiku about GPUs. Let's craft:

"Silicon thunder hums,
parallel cores blaze through night's code,
pixels whisper dreams."

Count syllables:

Line1: "Silicon (3) thunder (2) hums (1)" = 6? Actually "Silicon" = 3 (sil-i-con), "thunder" = 2, "hums" =1 => total 6. Need 5. Let's adjust.

Maybe "Silicon hearts beat" = 4? Silicon (3) + hearts (1) =4. Better: "Silicon hearts beat" = 4, need 5. Add "silently"? Let's design.

Try: "Silicon hearts beat" (4) add "still" maybe? "Silicon hearts beat still" Counting: Silicon(3) hearts(1) beat(1) still(1) =6. Hmm.

Let's think: "GPU cores pulse" Count: G-P-U (3?) Actually "GPU" pronounced as three letters, each syllable? Usually "GPU" = "jee-pee-you" three syllables? In spoken haiku, each letter counts as one syllable? Usually "GPU" is 3. So "GPU cores pulse" = GPU(3) cores(1) pulse(1) =5. Good! So line1: "GPU cores pulse". That's 5 syllables.

Line2: need 7 syllables describing parallel computation. Example: "massive vectors run like electric rivers" Count: mass-ive (2) vec-tors(2) run(1) like(1) e-lec-tric (3) ri-vers(2) =11. Too many.

Let's craft: "massive arrays compute in silent fire". Count: mass-ive(2) a-rrays(2?) Actually "arrays" = 2. So massive (2) arrays (2) =4, compute (2) =6, in (1)=7, silent (2)=9, fire (1)=10. Too many.

Let's try: "threads weave light through silicon veins". Count: threads(1) weave(1) light(1) through(1) si-li-con(3) veins(1) =8. Need 7. Reduce one syllable. Maybe "threads weave light through silicon". Count: threads1 weave1 light1 through1 si-li-con3 =7. Good.

Line3: 5 syllables about output. Example: "images bloom". That's only 2. Need 5. "images bloom upon the screen". Count: im-ages(2) bloom(1) u-pon(2) the(1) screen(1) =7. Too many.

Maybe "images bloom on glowing screen". Count: im-ages2 bloom1 on1 glow-ing2 screen1 =7. Too high.

Try: "pixels sing, alive, bright". Count: pix-els2 sing1 a-live2 bright1 =6. Too many.

Try: "pixels sing alive". Count: pix-els2 sing1 a-live2 =5. Good.

Now check overall:

Line1: GPU cores pulse (5)
Line2: threads weave light through silicon (7)
Line3: pixels sing alive (5)

All good. Provide haiku.
 **GPU cores pulse**  
**threads weave light through silicon**  
**pixels sing alive**


Reasoning off
Here are three key facts about **SGLang**:

1. **SGLang is a high-performance serving system for large language models (LLMs)**  
   Developed by researchers at UC Berkeley and other institutions, SGLang (Structured Generation Language) is designed to efficiently serve LLMs with low latency and high throughput. It optimizes inference by combining techniques like continuous batching, dynamic scheduling, and efficient memory management.

2. **It supports structured and constrained generation**  
   SGLang enables fine-grained control over model outputs through structured generation, allowing users to enforce specific formats (e.g., JSON, regex patterns) or constraints during inference. This makes it ideal for applications requiring reliable, predictable outputs, such as code generation or data extraction.

3. **It integrates with popular LLM frameworks and models**  
   SGLang is compatible with widely used models (e.g., Llama, Mistral) and frameworks like Hugging Face Transformers and vLLM. It provides a flexible API and supports both open-source and proprietary models, making it easy to deploy in production environments. None
```

### 4.3 Tool Calling

Call functions using the OpenAI Tools schema and inspect returned `tool_calls`.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:5000/v1",
    api_key="EMPTY",
)

# Tool calling via OpenAI tools schema
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate_tip",
            "parameters": {
                "type": "object",
                "properties": {
                    "bill_total": {
                        "type": "integer",
                        "description": "The total amount of the bill"
                    },
                    "tip_percentage": {
                        "type": "integer",
                        "description": "The percentage of tip to be applied"
                    }
                },
                "required": ["bill_total", "tip_percentage"]
            }
        }
    }
]

completion = client.chat.completions.create(
    model="nemotron",
    messages=[
        {"role": "system", "content": ""},
        {"role": "user", "content": "My bill is $50. What will be the amount for 15% tip?"}
    ],
    tools=TOOLS,
    temperature=0.6,
    top_p=0.95,
    max_tokens=512,
    stream=False
)

print(completion.choices[0].message.reasoning_content)
print(completion.choices[0].message.tool_calls)
```

Output:
```
The user wants to know the tip amount for a $50 bill with a 15% tip. I need to use the calculate_tip function. The function requires bill_total and tip_percentage. Bill total is 50, tip percentage is 15. I'll call the function.

[ChatCompletionMessageFunctionToolCall(id='call_607a46b5f3104184831a7b19', function=Function(arguments='{"bill_total": 50, "tip_percentage": 15}', name='calculate_tip'), type='function', index=0)]
```

### 4.4 Controlling Reasoning Budget

The `reasoning_budget` parameter allows you to limit the length of the model's reasoning trace. When the reasoning output reaches the specified token budget, the model will attempt to gracefully end the reasoning at the next newline character. 

If no newline is encountered within 500 tokens after reaching the budget threshold, the reasoning trace will be forcibly terminated at `reasoning_budget + 500` tokens.

```python
from typing import Any, Dict, List
import openai
from transformers import AutoTokenizer


class ThinkingBudgetClient:
    def __init__(self, base_url: str, api_key: str, tokenizer_name_or_path: str):
        self.base_url = base_url
        self.api_key = api_key
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_name_or_path)
        self.client = openai.OpenAI(base_url=self.base_url, api_key=self.api_key)

    def chat_completion(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        reasoning_budget: int = 512,
        max_tokens: int = 1024,
        **kwargs,
    ) -> Dict[str, Any]:
        assert (
            max_tokens > reasoning_budget
        ), f"reasoning_budget must be smaller than max_tokens. Given {max_tokens=} and {reasoning_budget=}"

        # 1. first call chat completion to get reasoning content
        response = self.client.chat.completions.create(
            model=model, 
            messages=messages, 
            max_tokens=reasoning_budget, 
            **kwargs
        )
        
        reasoning_content = response.choices[0].message.reasoning_content or ""
        
        if "</think>" not in reasoning_content:
            # reasoning content is too long, closed with a period (.)
            reasoning_content = f"{reasoning_content}.\n</think>\n\n"
        
        reasoning_tokens_used = len(
            self.tokenizer.encode(reasoning_content, add_special_tokens=False)
        )
        remaining_tokens = max_tokens - reasoning_tokens_used
        
        assert (
            remaining_tokens > 0
        ), f"remaining tokens must be positive. Given {remaining_tokens=}. Increase max_tokens or lower reasoning_budget."

        # 2. append reasoning content to messages and call completion
        messages.append({"role": "assistant", "content": reasoning_content})
        prompt = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            continue_final_message=True,
        )
        
        response = self.client.completions.create(
            model=model, 
            prompt=prompt, 
            max_tokens=remaining_tokens, 
            **kwargs
        )

        response_data = {
            "reasoning_content": reasoning_content.strip().strip("</think>").strip(),
            "content": response.choices[0].text,
            "finish_reason": response.choices[0].finish_reason,
        }
        return response_data
```

Usage example with `reasoning_budget=128`:

```python
SERVED_MODEL_NAME = "nvidia/nemotron-super-sft-020426"

# Client
SERVED_MODEL_NAME = "nvidia/nemotron-super-sft-020426"
client = ThinkingBudgetClient(
    base_url="http://127.0.0.1:5000/v1",
    api_key="null",
    tokenizer_name_or_path=SERVED_MODEL_NAME
)

 resp = client.chat_completion(
    model=SERVED_MODEL_NAME,
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Write a haiku about GPUs."}
    ],
    temperature=1,
    max_tokens=512,
    reasoning_budget=128
)
print("Reasoning:", resp["reasoning_content"], "\nContent:", resp["content"])
```

Output:
```
Reasoning: We need to produce a haiku (5-7-5 syllable poem) about GPUs. No policy issues. Just produce result.
.
Content:
Silicon hearts beat,
Thundering cores chase the heat,
Dreams render in light.
```

---

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: TODO

- Model Deployment Command:

```shell
python3 -m sglang.launch_server \
  --model-path nvidia/nemotron-super-sft-020426 \
  --trust-remote-code \
  --tp 4 \
  --ep 1 \
  --max-running-requests 1024 \
  --host 0.0.0.0 \
  --port 5000
```

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 5000 \
  --model nvidia/nemotron-super-sft-020426 \
  --dataset-name random \
  --random-input-len 1024 \
  --random-output-len 1024 \
  --num-prompts 4096 \
  --max-concurrency 256
```

- **Test Results:**

```
TODO
```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

**Environment**
- Hardware: TODO
- Model: TODO

**Launch Model**
```bash
python3 -m sglang.launch_server \
  --model-path nvidia/nemotron-super-sft-020426 \
  --trust-remote-code \
  --tp 4 \
  --ep 1 \
  --reasoning-parser nano_v3
```

**Run Benchmark**
```bash
python3 benchmark/gsm8k/bench_sglang.py --port 5000
```

**Test Results:**
```
TODO
```

#### 5.2.2 MMLU Benchmark

**Run Benchmark**
```bash
python3 benchmark/mmlu/bench_sglang.py --port 5000
```

**Test Results:**
```
TODO
```
