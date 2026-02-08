# DeepSeek-V3

## 1. Model Introduction

[DeepSeek V3](https://huggingface.co/deepseek-ai/DeepSeek-V3) is a large-scale Mixture-of-Experts (MoE) language model developed by DeepSeek, designed to deliver strong general-purpose reasoning, coding, and tool-augmented capabilities with high training and inference efficiency. As the latest generation in the DeepSeek model family, DeepSeek V3 introduces systematic architectural and training innovations that significantly improve performance across reasoning, mathematics, coding, and long-context understanding, while maintaining a competitive compute cost.

Key highlights include:

- **Efficient MoE architecture**: DeepSeek V3 adopts a fine-grained Mixture-of-Experts design with a large number of experts and sparse activation, enabling high model capacity while keeping inference and training costs manageable.
- **Advanced reasoning and coding**: The model demonstrates strong performance on mathematical reasoning, logical inference, and real-world coding benchmarks, benefiting from improved data curation and training strategies.
- **Long-context capability**: DeepSeek V3 supports extended context lengths, allowing it to handle long documents, complex multi-step reasoning, and agent-style workflows more effectively.
- **Tool use and function calling**: The model is trained to support structured outputs and tool invocation, enabling seamless integration with external tools and agent frameworks during inference.

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides a progressive guide from quick deployment to performance optimization, suitable for users at different levels.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model variant, deployment strategy, and thinking capabilities.

import DeepSeekConfigGenerator from '@site/src/components/autoregressive/DeepSeekV3ConfigGenerator';

<DeepSeekConfigGenerator />

### 3.2 Hardware Requirements

Recommended hardware configurations by weight type:

| Weight Type | Configuration |
|------------|-------------------|
| **Full precision [FP8](https://huggingface.co/deepseek-ai/DeepSeek-R1-0528)** *(recommended)* | 8 x H200 |
| | 8 x B200 |
| | 8 x MI300X |
| | 2 x 8 x H100/800/20 |
| | Xeon 6980P CPU |
| **Full precision ([BF16](https://huggingface.co/unsloth/DeepSeek-R1-0528-BF16))** (upcast from original FP8) | 2 x 8 x H200 |
| | 2 x 8 x MI300X |
| | 4 x 8 x H100/800/20 |
| | 4 x 8 x A100/A800 |
| **Quantized weights ([INT8](https://huggingface.co/meituan/DeepSeek-R1-Channel-INT8))** | 16 x A100/800 |
| | 32 x L40S |
| | Xeon 6980P CPU |
| | 4 x Atlas 800I A3 |
| **Quantized weights ([W4A8](https://huggingface.co/novita/Deepseek-R1-0528-W4AFP8))** | 8 x H20/100, 4 x H200 |
| **Quantized weights ([AWQ](https://huggingface.co/QuixiAI/DeepSeek-R1-0528-AWQ))** | 8 x H100/800/20 |
| | 8 x A100/A800 |
| **Quantized weights ([MXFP4](https://huggingface.co/amd/DeepSeek-R1-MXFP4-Preview))** | 8, 4 x MI355X/350X |
| **Quantized weights ([NVFP4](https://huggingface.co/nvidia/DeepSeek-R1-0528-NVFP4-v2))** | 8, 4 x B200 |

> **Important:** The official DeepSeek V3 is already in FP8 format, so you should not run it with any quantization arguments like `--quantization fp8`.

Detailed commands for reference:

- [8 x H200](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#using-docker-recommended)
- [4 x B200, 8 x B200](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#example-serving-with-one-b200-node)
- [8 x MI300X](https://docs.sglang.io/platforms/amd_gpu.html#running-deepseek-v3)
- [2 x 8 x H200](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#example-serving-with-two-h208-nodes)
- [4 x 8 x A100](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#example-serving-with-four-a1008-nodes)
- [8 x A100 (AWQ)](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#example-serving-with-8-a100a800-with-awq-quantization)
- [16 x A100 (INT8)](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#example-serving-with-16-a100a800-with-int8-quantization)
- [32 x L40S (INT8)](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#example-serving-with-32-l40s-with-int8-quantization)
- [Xeon 6980P CPU](https://docs.sglang.io/platforms/cpu_server.html#example-running-deepseek-r1)
- [4 x Atlas 800I A3 (INT8)](https://docs.sglang.io/platforms/ascend_npu_deepseek_example.html#running-deepseek-with-pd-disaggregation-on-4-x-atlas-800i-a3)

### 3.3 Configuration Tips

**Download Weights:** If you encounter errors when starting the server, ensure the weights have finished downloading. It's recommended to download them beforehand or restart multiple times until all weights are downloaded. Please refer to the [DeepSeek V3 official guide](https://huggingface.co/deepseek-ai/DeepSeek-V3-Base#61-inference-with-deepseek-infer-demo-example-only) to download the weights.

For more detailed configuration tips, please also refer to [DeepSeek-V3 Usage](https://docs.sglang.io/basic_usage/deepseek_v3.html).

### 3.4 Multi-Node Deployment

For single-node deployment on 8 x H200, please refer to [this example](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#installation--launch).

Multi-node deployment resources:

- [Deploying DeepSeek on GB200 NVL72 with PD and Large Scale EP](https://lmsys.org/blog/2025-06-16-gb200-part-1/) ([Part I](https://lmsys.org/blog/2025-06-16-gb200-part-1/), [Part II](https://lmsys.org/blog/2025-09-25-gb200-part-2/)) — Comprehensive guide on GB200 optimizations.
- [Deploying DeepSeek with PD Disaggregation and Large-Scale Expert Parallelism on 96 H100 GPUs](https://lmsys.org/blog/2025-05-05-deepseek-pd-ep/) — Guide on PD disaggregation and large-scale EP.
- [Serving with two H20*8 nodes](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#example-serving-with-two-h208-nodes)
- [Best Practices for Serving DeepSeek-R1 on H20](https://lmsys.org/blog/2025-09-26-sglang-ant-group/) — Comprehensive guide on H20 optimizations, deployment and performance.
- [Serving with two H200*8 nodes and docker](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#example-serving-with-two-h2008-nodes-and-docker)
- [Serving with four A100*8 nodes](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#example-serving-with-four-a1008-nodes)

### 3.5 Optimizations

SGLang provides many optimizations specifically designed for the DeepSeek models, making it the inference engine [recommended by the official DeepSeek team](https://github.com/deepseek-ai/DeepSeek-V3/tree/main?tab=readme-ov-file#62-inference-with-sglang-recommended) from Day 0. For an overview of implemented features, see the completed [Roadmap](https://github.com/sgl-project/sglang/issues/2591).

#### 3.5.1 Multi-head Latent Attention (MLA) Throughput Optimizations

[MLA](https://arxiv.org/pdf/2405.04434) is an innovative attention mechanism introduced by the DeepSeek team, aimed at improving inference efficiency. SGLang has implemented specific optimizations including:

- **Weight Absorption**: By applying the associative law of matrix multiplication to reorder computation steps, this method balances computation and memory access and improves efficiency in the decoding phase.
- **MLA Attention Backends**: Currently SGLang supports different optimized MLA attention backends, including [FlashAttention3](https://github.com/Dao-AILab/flash-attention), [Flashinfer](https://docs.flashinfer.ai/api/attention.html#flashinfer-mla), [FlashMLA](https://github.com/deepseek-ai/FlashMLA), [CutlassMLA](https://github.com/sgl-project/sglang/pull/5390), **TRTLLM MLA** (optimized for Blackwell architecture), and [Triton](https://github.com/triton-lang/triton) backends. The default FA3 provides good performance across wide workloads.
- **FP8 Quantization**: W8A8 FP8 and KV Cache FP8 quantization enables efficient FP8 inference. Additionally, we have implemented Batched Matrix Multiplication (BMM) operator to facilitate FP8 inference in MLA with weight absorption.
- **CUDA Graph & Torch.compile**: Both MLA and Mixture of Experts (MoE) are compatible with CUDA Graph and Torch.compile, which reduces latency and accelerates decoding speed for small batch sizes.
- **Chunked Prefix Cache**: Chunked prefix cache optimization can increase throughput by cutting prefix cache into chunks, processing them with multi-head attention and merging their states. Its improvement can be significant when doing chunked prefill on long sequences. Currently this optimization is only available for FlashAttention3 backend.

Overall, with these optimizations, we have achieved up to **7x** acceleration in output throughput compared to the previous version.

<p align="center">
  <img src="https://lmsys.org/images/blog/sglang_v0_3/deepseek_mla.svg" alt="Multi-head Latent Attention for DeepSeek Series Models" />
</p>

**Usage**: MLA optimization is enabled by default.

**Reference**: Check [Blog](https://lmsys.org/blog/2024-09-04-sglang-v0-3/#deepseek-multi-head-latent-attention-mla-throughput-optimizations) and [Slides](https://github.com/sgl-project/sgl-learning-materials/blob/main/slides/lmsys_1st_meetup_deepseek_mla.pdf) for more details.

#### 3.5.2 Data Parallelism Attention

This optimization involves data parallelism (DP) for the MLA attention mechanism of DeepSeek Series Models, which allows for a significant reduction in the KV cache size, enabling larger batch sizes. Each DP worker independently handles different types of batches (prefill, decode, idle), which are then synchronized before and after processing through the Mixture-of-Experts (MoE) layer. If you do not use DP attention, KV cache will be duplicated among all TP ranks.

<p align="center">
  <img src="https://lmsys.org/images/blog/sglang_v0_4/dp_attention.svg" alt="Data Parallelism Attention for DeepSeek Series Models" />
</p>

With data parallelism attention enabled, we have achieved up to **1.9x** decoding throughput improvement compared to the previous version.

<p align="center">
  <img src="https://lmsys.org/images/blog/sglang_v0_4/deepseek_coder_v2.svg" alt="Data Parallelism Attention Performance Comparison" />
</p>

**Usage**:
- Append `--enable-dp-attention --tp 8 --dp 8` to the server arguments when using 8 H200 GPUs. This optimization improves peak throughput in high batch size scenarios where the server is limited by KV cache capacity.
- DP and TP attention can be flexibly combined. For example, to deploy DeepSeek-V3/R1 on 2 nodes with 8 H100 GPUs each, you can specify `--enable-dp-attention --tp 16 --dp 2`. This configuration runs attention with 2 DP groups, each containing 8 TP GPUs.

> **Caution:** Data parallelism attention is not recommended for low-latency, small-batch use cases. It is optimized for high-throughput scenarios with large batch sizes.

**Reference**: Check [Blog](https://lmsys.org/blog/2024-12-04-sglang-v0-4/#data-parallelism-attention-for-deepseek-models).

#### 3.5.3 Multi-Node Tensor Parallelism

For users with limited memory on a single node, SGLang supports serving DeepSeek Series Models across multiple nodes using tensor parallelism. This approach partitions the model parameters across multiple GPUs or nodes to handle models that are too large for one node's memory.

**Usage**: Check [here](https://github.com/sgl-project/sglang/tree/main/benchmark/deepseek_v3#example-serving-with-2-h208) for usage examples.

#### 3.5.4 Block-wise FP8

SGLang implements block-wise FP8 quantization with two key optimizations:

- **Activation**: E4M3 format using per-token-per-128-channel sub-vector scales with online casting.
- **Weight**: Per-128x128-block quantization for better numerical stability.
- **DeepGEMM**: The [DeepGEMM](https://github.com/deepseek-ai/DeepGEMM) kernel library optimized for FP8 matrix multiplications.

**Usage**: The activation and weight optimization above are turned on by default for DeepSeek V3 models. DeepGEMM is enabled by default on NVIDIA Hopper/Blackwell GPUs and disabled by default on other devices. DeepGEMM can also be manually turned off by setting the environment variable `SGLANG_ENABLE_JIT_DEEPGEMM=0`.

> **Tip:** Before serving the DeepSeek model, precompile the DeepGEMM kernels to improve first-run performance. The precompilation process typically takes around 10 minutes to complete.

```bash
python3 -m sglang.compile_deep_gemm --model deepseek-ai/DeepSeek-V3 --tp 8 --trust-remote-code
```

#### 3.5.5 Multi-token Prediction

SGLang implements DeepSeek V3 Multi-Token Prediction (MTP) based on [EAGLE speculative decoding](https://docs.sglang.io/advanced_features/speculative_decoding.html#EAGLE-Decoding). With this optimization, the decoding speed can be improved by **1.8x** for batch size 1 and **1.5x** for batch size 32 respectively on H200 TP8 setting.

**Usage**:
Add `--speculative-algorithm EAGLE`. Other flags, like `--speculative-num-steps`, `--speculative-eagle-topk` and `--speculative-num-draft-tokens` are optional. For example:

```bash
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3-0324 \
  --speculative-algorithm EAGLE \
  --trust-remote-code \
  --tp 8
```

- The default configuration for DeepSeek models is `--speculative-num-steps 3 --speculative-eagle-topk 1 --speculative-num-draft-tokens 4`. The best configuration can be searched with [bench_speculative.py](https://github.com/sgl-project/sglang/blob/main/scripts/playground/bench_speculative.py) script for given batch size. The minimum configuration is `--speculative-num-steps 1 --speculative-eagle-topk 1 --speculative-num-draft-tokens 2`, which can achieve speedup for larger batch sizes.
- Most MLA attention backends fully support MTP usage. See [MLA Backends](https://docs.sglang.io/advanced_features/attention_backend.html#mla-backends) for details.

> **Note:** To enable DeepSeek MTP for large batch sizes (>48), you need to adjust some parameters (Reference [this discussion](https://github.com/sgl-project/sglang/issues/4543#issuecomment-2737413756)):
> - Adjust `--max-running-requests` to a larger number. The default value is `48` for MTP. For larger batch sizes, you should increase this value beyond the default value.
> - Set `--cuda-graph-bs`. It's a list of batch sizes for cuda graph capture. The [default captured batch sizes for speculative decoding](https://github.com/sgl-project/sglang/blob/main/python/sglang/srt/server_args.py#L888-L895) is 48. You can customize this by including more batch sizes.

> **Tip:** To enable the experimental overlap scheduler for EAGLE speculative decoding, set the environment variable `SGLANG_ENABLE_SPEC_V2=1`. This can improve performance by enabling overlap scheduling between draft and verification stages.

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [Basic API Usage](https://docs.sglang.ai/get_started/quick_start.html)

### 4.2 Advanced Usage

#### 4.2.1 Reasoning Parser

DeepSeek-V3 supports reasoning mode. Enable the reasoning parser during deployment to separate the thinking and content sections:

```shell
python -m sglang.launch_server \
  --model deepseek-ai/DeepSeek-V3 \
  --reasoning-parser deepseek-v3 \
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
    model="deepseek-ai/DeepSeek-V3",
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
To determine 15% of a number, follow these steps:

**Step 1: Understand the Problem**
You need to find 15% of a given number. Let's assume the number is 240 for this example.

**Step 2: Convert the Percentage to a Decimal**
To work with percentages in calculations, convert the percentage to its decimal form. To do this, divide the percentage by 100.

\[ 15\% = \frac{15}{100} = 0.15 \]

**Step 3: Multiply the Decimal by the Number**
Now, multiply the decimal form of the percentage by the number you want to find the percentage of.

\[ 0.15 \times 240 \]

**Step 4: Perform the Multiplication**
Calculate the product:

\[ 0.15 \times 240 = 36 \]

**Step 5: Conclusion**
Therefore, 15% of 240 is:

\boxed{36}

The answer is 36. To find 15% of 240, we multiply 240 by 0.15, which equals 36.
```

**Note:** The reasoning parser captures the model's step-by-step thinking process, allowing you to see how the model arrives at its conclusions.

#### 4.2.2 Tool Calling

DeepSeek-V3 supports tool calling capabilities. Enable the tool call parser:

**Deployment Command:**

```shell
python -m sglang.launch_server \
  --model deepseek-ai/DeepSeek-V3 \
  --tool-call-parser deepseekv3 \
  --reasoning-parser deepseek-v3 \
  --chat-template ./examples/chat_template/tool_chat_template_deepseekv3.jinja \
  --tp 8 \
  --host 0.0.0.0 \
  --port 8000
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
    model="deepseek-ai/DeepSeek-V3",
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
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>function<｜tool▁sep｜>get_weather
```json
{"location": "Beijing", "unit": "celsius"}
```<｜tool▁call▁end｜><｜tool▁calls▁end｜>
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
    model="deepseek-ai/DeepSeek-V3",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# Output: "The weather in Beijing is currently 22°C and sunny."
```

**Curl Examples:**

Non-streaming request:

```bash
curl "http://127.0.0.1:8000/v1/chat/completions" \
-H "Content-Type: application/json" \
-d '{"temperature": 0, "max_tokens": 100, "model": "deepseek-ai/DeepSeek-V3-0324", "tools": [{"type": "function", "function": {"name": "query_weather", "description": "Get weather of a city, the user should supply a city first", "parameters": {"type": "object", "properties": {"city": {"type": "string", "description": "The city, e.g. Beijing"}}, "required": ["city"]}}}], "messages": [{"role": "user", "content": "How'\''s the weather like in Qingdao today"}]}'
```

Streaming request:

```bash
curl "http://127.0.0.1:8000/v1/chat/completions" \
-H "Content-Type: application/json" \
-d '{"temperature": 0, "max_tokens": 100, "model": "deepseek-ai/DeepSeek-V3-0324","stream":true,"tools": [{"type": "function", "function": {"name": "query_weather", "description": "Get weather of a city, the user should supply a city first", "parameters": {"type": "object", "properties": {"city": {"type": "string", "description": "The city, e.g. Beijing"}}, "required": ["city"]}}}], "messages": [{"role": "user", "content": "How'\''s the weather like in Qingdao today"}]}'
```

The client needs to concatenate all argument fragments from streamed chunks to reconstruct the complete tool call.

> **Important:**
> 1. Use a lower `"temperature"` value for better results.
> 2. To receive more consistent tool call results, it is recommended to use `--chat-template examples/chat_template/tool_chat_template_deepseekv3.jinja`. It provides an improved unified prompt.

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: AMD MI300X GPU (8x)
- Model: DeepSeek-V3
- Tensor Parallelism: 8
- sglang version: 0.5.7

We use SGLang's built-in benchmarking tool to conduct performance evaluation on the [ShareGPT_Vicuna_unfiltered](https://huggingface.co/datasets/anon8231489123/ShareGPT_Vicuna_unfiltered) dataset. This dataset contains real conversation data and can better reflect performance in actual use scenarios. To simulate real-world usage patterns, we configure each request with 1024 input tokens and 1024 output tokens, representing typical medium-length conversations with detailed responses.

#### 5.1.1 Latency-Sensitive Benchmark

- Model Deployment Command:

```shell
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3 \
  --tp 8 \
  --dp 8 \
  --enable-dp-attention \
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
  --model deepseek-ai/DeepSeek-V3 \
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
Benchmark duration (s):                  81.27
Total input tokens:                      1972
Total input text tokens:                 1972
Total input vision tokens:               0
Total generated tokens:                  2784
Total generated tokens (retokenized):    2774
Request throughput (req/s):              0.12
Input token throughput (tok/s):          24.27
Output token throughput (tok/s):         34.26
Peak output token throughput (tok/s):    65.00
Peak concurrent requests:                2
Total token throughput (tok/s):          58.52
Concurrency:                             1.00
Accept length:                           2.61
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   8123.17
Median E2E Latency (ms):                 7982.65
---------------Time to First Token----------------
Mean TTFT (ms):                          1080.76
Median TTFT (ms):                        1248.82
P99 TTFT (ms):                           1896.37
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          25.04
Median TPOT (ms):                        24.76
P99 TPOT (ms):                           32.09
---------------Inter-Token Latency----------------
Mean ITL (ms):                           25.41
Median ITL (ms):                         20.14
P95 ITL (ms):                            60.28
P99 ITL (ms):                            60.99
Max ITL (ms):                            61.49
==================================================
```

#### 5.1.2 Throughput-Sensitive Benchmark

- Model Deployment Command:

```shell
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3 \
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
  --model deepseek-ai/DeepSeek-V3 \
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
Benchmark duration (s):                  406.16
Total input tokens:                      301701
Total input text tokens:                 301701
Total input vision tokens:               0
Total generated tokens:                  188375
Total generated tokens (retokenized):    187542
Request throughput (req/s):              2.46
Input token throughput (tok/s):          742.81
Output token throughput (tok/s):         463.80
Peak output token throughput (tok/s):    1299.00
Peak concurrent requests:                109
Total token throughput (tok/s):          1206.61
Concurrency:                             87.53
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   35552.98
Median E2E Latency (ms):                 21466.07
---------------Time to First Token----------------
Mean TTFT (ms):                          1521.51
Median TTFT (ms):                        476.80
P99 TTFT (ms):                           8329.50
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          214.73
Median TPOT (ms):                        152.00
P99 TPOT (ms):                           1155.85
---------------Inter-Token Latency----------------
Mean ITL (ms):                           182.10
Median ITL (ms):                         79.18
P95 ITL (ms):                            398.60
P99 ITL (ms):                            1488.96
Max ITL (ms):                            43465.60
==================================================
```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

- **Benchmark Command:**

```shell
python3 -m sglang.test.few_shot_gsm8k --num-questions 200 --port 8000
```

- **Test Results**:
  - DeepSeek-V3
    ```
    Accuracy: 0.960
    Invalid: 0.000
    Latency: 32.450 s
    Output throughput: 614.211 token/s
    ```

#### 5.2.2 MMLU Benchmark

- **Benchmark Command:**

```shell
cd sglang
bash benchmark/mmlu/download_data.sh
python3 benchmark/mmlu/bench_sglang.py --nsub 10 --port 8000
```

- **Test Results**:
  - DeepSeek-V3
    ```
    subject: abstract_algebra, #q:100, acc: 0.800
    subject: anatomy, #q:135, acc: 0.874
    subject: astronomy, #q:152, acc: 0.928
    subject: business_ethics, #q:100, acc: 0.880
    subject: clinical_knowledge, #q:265, acc: 0.928
    subject: college_biology, #q:144, acc: 0.965
    subject: college_chemistry, #q:100, acc: 0.670
    subject: college_computer_science, #q:100, acc: 0.840
    subject: college_mathematics, #q:100, acc: 0.800
    subject: college_medicine, #q:173, acc: 0.861
    Total latency: 58.339
    Average accuracy: 0.871
    ```

## 6. FAQ

**Q: Model loading is taking too long, and I'm encountering an NCCL timeout. What should I do?**

A: If you're experiencing extended model loading times and an NCCL timeout, you can try increasing the timeout duration. Add the argument `--dist-timeout 3600` when launching your model. This will set the timeout to one hour, which often resolves the issue.
