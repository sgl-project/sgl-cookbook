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

import DeepSeekV31ConfigGenerator from '@site/src/components/autoregressive/DeepSeekV31ConfigGenerator';

<DeepSeekV31ConfigGenerator />

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

> **Important:** The official DeepSeek V3.1 is already in FP8 format, so you should not run it with any quantization arguments like `--quantization fp8`.

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

For more detailed configuration tips, please also refer to [DeepSeek V3/V3.1/R1 Usage](https://docs.sglang.io/basic_usage/deepseek_v3.html).

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
- DP and TP attention can be flexibly combined. For example, to deploy DeepSeek-V3.1 on 2 nodes with 8 H100 GPUs each, you can specify `--enable-dp-attention --tp 16 --dp 2`. This configuration runs attention with 2 DP groups, each containing 8 TP GPUs.

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

**Usage**: The activation and weight optimization above are turned on by default for DeepSeek V3.1 models. DeepGEMM is enabled by default on NVIDIA Hopper/Blackwell GPUs and disabled by default on other devices. DeepGEMM can also be manually turned off by setting the environment variable `SGLANG_ENABLE_JIT_DEEPGEMM=0`.

> **Tip:** Before serving the DeepSeek model, precompile the DeepGEMM kernels to improve first-run performance. The precompilation process typically takes around 10 minutes to complete.

```bash
python3 -m sglang.compile_deep_gemm --model deepseek-ai/DeepSeek-V3.1 --tp 8 --trust-remote-code
```

#### 3.5.5 Multi-token Prediction

SGLang implements DeepSeek Multi-Token Prediction (MTP) based on [EAGLE speculative decoding](https://docs.sglang.io/advanced_features/speculative_decoding.html#EAGLE-Decoding). With this optimization, the decoding speed can be improved by **1.8x** for batch size 1 and **1.5x** for batch size 32 respectively on H200 TP8 setting.

**Usage**:
Add `--speculative-algorithm EAGLE`. Other flags, like `--speculative-num-steps`, `--speculative-eagle-topk` and `--speculative-num-draft-tokens` are optional. For example:

```bash
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.1 \
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

**Curl Examples:**

Non-streaming request:

```bash
curl "http://127.0.0.1:8000/v1/chat/completions" \
-H "Content-Type: application/json" \
-d '{"temperature": 0, "max_tokens": 100, "model": "deepseek-ai/DeepSeek-V3.1", "tools": [{"type": "function", "function": {"name": "query_weather", "description": "Get weather of a city, the user should supply a city first", "parameters": {"type": "object", "properties": {"city": {"type": "string", "description": "The city, e.g. Beijing"}}, "required": ["city"]}}}], "messages": [{"role": "user", "content": "How'\''s the weather like in Qingdao today"}]}'
```

Streaming request:

```bash
curl "http://127.0.0.1:8000/v1/chat/completions" \
-H "Content-Type: application/json" \
-d '{"temperature": 0, "max_tokens": 100, "model": "deepseek-ai/DeepSeek-V3.1","stream":true,"tools": [{"type": "function", "function": {"name": "query_weather", "description": "Get weather of a city, the user should supply a city first", "parameters": {"type": "object", "properties": {"city": {"type": "string", "description": "The city, e.g. Beijing"}}, "required": ["city"]}}}], "messages": [{"role": "user", "content": "How'\''s the weather like in Qingdao today"}]}'
```

The client needs to concatenate all argument fragments from streamed chunks to reconstruct the complete tool call.

> **Important:**
> 1. Use a lower `"temperature"` value for better results.
> 2. To receive more consistent tool call results, it is recommended to use `--chat-template examples/chat_template/tool_chat_template_deepseekv31.jinja`. It provides an improved unified prompt.

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: AMD MI300X GPU (8x)
- Model: DeepSeek-V3.1-Terminus
- Tensor Parallelism: 8
- sglang version: 0.5.7

**Benchmark Methodology:**

We use industry-standard benchmark configurations to ensure results are comparable across frameworks and hardware platforms.

#### 5.1.1 Standard Test Scenarios

Three core scenarios reflect real-world usage patterns:

| Scenario          | Input Length | Output Length | Use Case                                      |
| ----------------- | ------------ | ------------- | --------------------------------------------- |
| **Chat**          | 1K           | 1K            | Most common conversational AI workload        |
| **Reasoning**     | 1K           | 8K            | Long-form generation, complex reasoning tasks |
| **Summarization** | 8K           | 1K            | Document summarization, RAG retrieval         |

#### 5.1.2 Concurrency Levels

Test each scenario at different concurrency levels to capture the throughput vs. latency trade-off:

- **Low Concurrency**: `--max-concurrency 1` (Latency-optimized)
- **Medium Concurrency**: `--max-concurrency 16` (Balanced)
- **High Concurrency**: `--max-concurrency 100` (Throughput-optimized)

#### 5.1.3 Number of Prompts

For each concurrency level, configure `num_prompts` to simulate realistic user loads:

- **Quick Test**: `num_prompts = concurrency × 1` (minimal test)
- **Recommended**: `num_prompts = concurrency × 5` (standard benchmark)
- **Stable Measurements**: `num_prompts = concurrency × 10` (production-grade)

---

#### 5.1.4 Benchmark Commands

**Scenario 1: Chat (1K/1K) - Most Important**

- **Model Deployment**

```bash
python -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.1 \
  --tp 8
```

- Low Concurrency (Latency-Optimized)

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model deepseek-ai/DeepSeek-V3.1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  106.24
Total input tokens:                      6101
Total input text tokens:                 6101
Total input vision tokens:               0
Total generated tokens:                  4220
Total generated tokens (retokenized):    4201
Request throughput (req/s):              0.09
Input token throughput (tok/s):          57.43
Output token throughput (tok/s):         39.72
Peak output token throughput (tok/s):    43.00
Peak concurrent requests:                2
Total token throughput (tok/s):          97.15
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   10620.29
Median E2E Latency (ms):                 8868.09
---------------Time to First Token----------------
Mean TTFT (ms):                          557.85
Median TTFT (ms):                        213.58
P99 TTFT (ms):                           1625.28
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          23.84
Median TPOT (ms):                        23.90
P99 TPOT (ms):                           24.03
---------------Inter-Token Latency----------------
Mean ITL (ms):                           23.90
Median ITL (ms):                         23.92
P95 ITL (ms):                            24.15
P99 ITL (ms):                            24.25
Max ITL (ms):                            25.44
==================================================
```

- Medium Concurrency (Balanced)

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model deepseek-ai/DeepSeek-V3.1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  107.71
Total input tokens:                      39668
Total input text tokens:                 39668
Total input vision tokens:               0
Total generated tokens:                  40805
Total generated tokens (retokenized):    40625
Request throughput (req/s):              0.74
Input token throughput (tok/s):          368.28
Output token throughput (tok/s):         378.84
Peak output token throughput (tok/s):    508.00
Peak concurrent requests:                19
Total token throughput (tok/s):          747.12
Concurrency:                             13.72
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   18473.65
Median E2E Latency (ms):                 19558.42
---------------Time to First Token----------------
Mean TTFT (ms):                          607.91
Median TTFT (ms):                        191.32
P99 TTFT (ms):                           2135.13
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          35.50
Median TPOT (ms):                        35.99
P99 TPOT (ms):                           43.62
---------------Inter-Token Latency----------------
Mean ITL (ms):                           35.10
Median ITL (ms):                         32.18
P95 ITL (ms):                            33.03
P99 ITL (ms):                            159.99
Max ITL (ms):                            453.99
==================================================
```

- High Concurrency (Throughput-Optimized)

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model deepseek-ai/DeepSeek-V3.1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 500 \
  --max-concurrency 100 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 100
Successful requests:                     500
Benchmark duration (s):                  207.65
Total input tokens:                      249831
Total input text tokens:                 249831
Total input vision tokens:               0
Total generated tokens:                  252662
Total generated tokens (retokenized):    251238
Request throughput (req/s):              2.41
Input token throughput (tok/s):          1203.15
Output token throughput (tok/s):         1216.79
Peak output token throughput (tok/s):    2100.00
Peak concurrent requests:                106
Total token throughput (tok/s):          2419.94
Concurrency:                             91.02
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   37800.20
Median E2E Latency (ms):                 35921.56
---------------Time to First Token----------------
Mean TTFT (ms):                          835.15
Median TTFT (ms):                        236.88
P99 TTFT (ms):                           2868.52
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          73.33
Median TPOT (ms):                        76.35
P99 TPOT (ms):                           97.63
---------------Inter-Token Latency----------------
Mean ITL (ms):                           73.30
Median ITL (ms):                         50.82
P95 ITL (ms):                            180.67
P99 ITL (ms):                            186.83
Max ITL (ms):                            1661.39
==================================================
```

**Scenario 2: Reasoning (1K/8K)**

- Low Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model deepseek-ai/DeepSeek-V3.1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  1097.29
Total input tokens:                      6101
Total input text tokens:                 6101
Total input vision tokens:               0
Total generated tokens:                  44462
Total generated tokens (retokenized):    44313
Request throughput (req/s):              0.01
Input token throughput (tok/s):          5.56
Output token throughput (tok/s):         40.52
Peak output token throughput (tok/s):    43.00
Peak concurrent requests:                2
Total token throughput (tok/s):          46.08
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   109725.52
Median E2E Latency (ms):                 117748.67
---------------Time to First Token----------------
Mean TTFT (ms):                          156.67
Median TTFT (ms):                        156.19
P99 TTFT (ms):                           159.87
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          24.41
Median TPOT (ms):                        24.51
P99 TPOT (ms):                           24.96
---------------Inter-Token Latency----------------
Mean ITL (ms):                           24.65
Median ITL (ms):                         24.58
P95 ITL (ms):                            25.68
P99 ITL (ms):                            25.93
Max ITL (ms):                            29.80
==================================================
```

- Medium Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model deepseek-ai/DeepSeek-V3.1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 80 \
  --max-concurrency 16 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  775.02
Total input tokens:                      39668
Total input text tokens:                 39668
Total input vision tokens:               0
Total generated tokens:                  318306
Total generated tokens (retokenized):    317426
Request throughput (req/s):              0.10
Input token throughput (tok/s):          51.18
Output token throughput (tok/s):         410.70
Peak output token throughput (tok/s):    512.00
Peak concurrent requests:                18
Total token throughput (tok/s):          461.89
Concurrency:                             13.86
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   134236.65
Median E2E Latency (ms):                 135181.28
---------------Time to First Token----------------
Mean TTFT (ms):                          214.35
Median TTFT (ms):                        194.12
P99 TTFT (ms):                           300.27
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          33.72
Median TPOT (ms):                        34.00
P99 TPOT (ms):                           34.75
---------------Inter-Token Latency----------------
Mean ITL (ms):                           33.69
Median ITL (ms):                         33.71
P95 ITL (ms):                            34.50
P99 ITL (ms):                            34.92
Max ITL (ms):                            164.76
==================================================
```

- High Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model deepseek-ai/DeepSeek-V3.1 \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 8000 \
  --num-prompts 320 \
  --max-concurrency 64 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 64
Successful requests:                     320
Benchmark duration (s):                  1231.97
Total input tokens:                      158939
Total input text tokens:                 158939
Total input vision tokens:               0
Total generated tokens:                  1301025
Total generated tokens (retokenized):    1296845
Request throughput (req/s):              0.26
Input token throughput (tok/s):          129.01
Output token throughput (tok/s):         1056.05
Peak output token throughput (tok/s):    1472.00
Peak concurrent requests:                67
Total token throughput (tok/s):          1185.07
Concurrency:                             56.17
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   216256.25
Median E2E Latency (ms):                 224192.84
---------------Time to First Token----------------
Mean TTFT (ms):                          317.68
Median TTFT (ms):                        235.28
P99 TTFT (ms):                           649.39
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          53.30
Median TPOT (ms):                        55.10
P99 TPOT (ms):                           56.58
---------------Inter-Token Latency----------------
Mean ITL (ms):                           53.13
Median ITL (ms):                         52.95
P95 ITL (ms):                            56.23
P99 ITL (ms):                            181.04
Max ITL (ms):                            208.61
==================================================
```

**Scenario 3: Summarization (8K/1K)**

- Low Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model deepseek-ai/DeepSeek-V3.1 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  114.47
Total input tokens:                      41941
Total input text tokens:                 41941
Total input vision tokens:               0
Total generated tokens:                  4220
Total generated tokens (retokenized):    4194
Request throughput (req/s):              0.09
Input token throughput (tok/s):          366.39
Output token throughput (tok/s):         36.87
Peak output token throughput (tok/s):    42.00
Peak concurrent requests:                2
Total token throughput (tok/s):          403.26
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   11442.86
Median E2E Latency (ms):                 9508.87
---------------Time to First Token----------------
Mean TTFT (ms):                          883.78
Median TTFT (ms):                        481.38
P99 TTFT (ms):                           2217.45
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          24.93
Median TPOT (ms):                        25.05
P99 TPOT (ms):                           26.11
---------------Inter-Token Latency----------------
Mean ITL (ms):                           25.08
Median ITL (ms):                         25.08
P95 ITL (ms):                            26.18
P99 ITL (ms):                            26.28
Max ITL (ms):                            27.41
==================================================
```

- Medium Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model deepseek-ai/DeepSeek-V3.1 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  162.33
Total input tokens:                      300020
Total input text tokens:                 300020
Total input vision tokens:               0
Total generated tokens:                  41669
Total generated tokens (retokenized):    41443
Request throughput (req/s):              0.49
Input token throughput (tok/s):          1848.27
Output token throughput (tok/s):         256.70
Peak output token throughput (tok/s):    467.00
Peak concurrent requests:                19
Total token throughput (tok/s):          2104.97
Concurrency:                             14.52
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   29456.89
Median E2E Latency (ms):                 27628.16
---------------Time to First Token----------------
Mean TTFT (ms):                          1784.30
Median TTFT (ms):                        1347.21
P99 TTFT (ms):                           5384.54
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          53.65
Median TPOT (ms):                        52.09
P99 TPOT (ms):                           74.39
---------------Inter-Token Latency----------------
Mean ITL (ms):                           53.23
Median ITL (ms):                         34.52
P95 ITL (ms):                            35.81
P99 ITL (ms):                            513.25
Max ITL (ms):                            2865.73
==================================================
```

- High Concurrency

```bash
python -m sglang.bench_serving \
  --backend sglang \
  --model deepseek-ai/DeepSeek-V3.1 \
  --dataset-name random \
  --random-input-len 8000 \
  --random-output-len 1000 \
  --num-prompts 320 \
  --max-concurrency 64 \
  --request-rate inf
```

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 64
Successful requests:                     320
Benchmark duration (s):                  282.55
Total input tokens:                      1273893
Total input text tokens:                 1273893
Total input vision tokens:               0
Total generated tokens:                  170000
Total generated tokens (retokenized):   169081
Request throughput (req/s):              1.13
Input token throughput (tok/s):          4508.6
Output token throughput (tok/s):         601.67
Peak output token throughput (tok/s):   1216
Peak concurrent requests:                68
Total token throughput (tok/s):         5110.27
Concurrency:                            59.81
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                  52810.32
Median E2E Latency (ms):                50981.81
---------------Time to First Token----------------
Mean TTFT (ms):                         786.69
Median TTFT (ms):                       499.38
P99 TTFT (ms):                          2925.98
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                         97.93
Median TPOT (ms):                       103.45
P99 TPOT (ms):                          157.84
---------------Inter-Token Latency----------------
Mean ITL (ms):                          98.11
Median ITL (ms):                        55.7
P95 ITL (ms):                           240.71
P99 ITL (ms):                          1114.36
==================================================
```

#### 5.1.5 Understanding the Results

**Key Metrics:**

- **Request Throughput (req/s)**: Number of requests processed per second
- **Output Token Throughput (tok/s)**: Total tokens generated per second
- **Mean TTFT (ms)**: Time to First Token - measures responsiveness
- **Mean TPOT (ms)**: Time Per Output Token - measures generation speed
- **Mean ITL (ms)**: Inter-Token Latency - measures streaming consistency

**Why These Configurations Matter:**

- **1K/1K (Chat)**: Represents the most common conversational AI workload. This is the highest priority scenario for most deployments.
- **1K/8K (Reasoning)**: Tests long-form generation capabilities crucial for complex reasoning, code generation, and detailed explanations.
- **8K/1K (Summarization)**: Evaluates performance with large context inputs, essential for RAG systems, document Q&A, and summarization tasks.
- **Variable Concurrency**: Captures the Pareto frontier - the optimal trade-off between throughput and latency at different load levels. Low concurrency shows best-case latency, high concurrency shows maximum throughput.

**Interpreting Results:**

- Compare your results against baseline numbers for your hardware
- Higher throughput at same latency = better performance
- Lower TTFT = more responsive user experience
- Lower TPOT = faster generation speed

### 5.2 Accuracy Benchmark

Document model accuracy on standard benchmarks:

#### 5.2.1 GSM8K Benchmark

- Benchmark Command

```bash
python3 benchmark/gsm8k/bench_sglang.py \
  --num-shots 8 \
  --num-questions 1316 \
  --parallel 1316
```

**Test Results:**

```
Accuracy: 0.959
Invalid: 0.000
Latency: 29.185 s
Output throughput: 4854.672 token/s
```

## 6. FAQ

**Q: Model loading is taking too long, and I'm encountering an NCCL timeout. What should I do?**

A: If you're experiencing extended model loading times and an NCCL timeout, you can try increasing the timeout duration. Add the argument `--dist-timeout 3600` when launching your model. This will set the timeout to one hour, which often resolves the issue.
