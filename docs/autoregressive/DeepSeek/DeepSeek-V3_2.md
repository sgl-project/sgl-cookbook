# DeepSeek-V3.2

## 1. Model Introduction

The DeepSeek-V3.2 series includes three model variants, each optimized for different use cases:

**[DeepSeek-V3.2-Exp](https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp)** is an upgraded version of DeepSeek-V3.1-Terminus, introducing the DeepSeek Sparse Attention (DSA) mechanism through continued training. DSA is a fine-grained sparse attention mechanism powered by a lightning indexer, enabling DeepSeek-V3.2-Exp to achieve significant efficiency improvements in long-context scenarios. As an intermediate step toward the next-generation architecture, V3.2-Exp builds upon V3.1-Terminus by introducing DeepSeek Sparse Attention—a sparse attention mechanism designed to explore and validate optimizations for training and inference efficiency in long-context scenarios. Recommended for general conversations, long-context processing, and efficient inference.

**[DeepSeek-V3.2](https://huggingface.co/deepseek-ai/DeepSeek-V3.2)** is the standard version suitable for general tasks and conversational scenarios. For local deployment, we recommend setting the sampling parameters to temperature = 1.0, top_p = 0.95. Recommended for standard conversations and general tasks.

**[DeepSeek-V3.2-Speciale](https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Speciale)** is a special variant designed exclusively for deep reasoning tasks. This model is specifically optimized for scenarios requiring complex logical reasoning and deep thinking. For local deployment, we recommend setting the sampling parameters to temperature = 1.0, top_p = 0.95. Recommended for deep reasoning tasks, complex logical problems, and mathematical reasoning.

For reporting issues or tracking upcoming features, please refer to the [V3.2 Roadmap](https://github.com/sgl-project/sglang/issues/11060).

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

**Docker (V3.2-specific images):**

```bash
# H200/B200
docker pull lmsysorg/sglang:latest

# MI350/MI355
docker pull lmsysorg/sglang:v0.5.8-rocm700-mi35x

# MI300
# v0.5.8-rocm700-mi30x does not include PR #17504. Prefer the newest MI30x ROCm
# image tag from Docker Hub when available, or build from source (below).
docker pull lmsysorg/sglang:v0.5.8-rocm700-mi30x

# NPUs
docker pull lmsysorg/sglang:dsv32-a2
docker pull lmsysorg/sglang:dsv32-a3
```

**Build From Source:**

```bash
git clone https://github.com/sgl-project/sglang
cd sglang
pip3 install pip --upgrade
pip3 install -e "python"
```

## 3. Model Deployment

This section provides a progressive guide from quick deployment to performance optimization, suitable for users at different levels.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model variant, deployment strategy, and thinking capabilities. SGLang supports serving DeepSeek V3.2 on NVIDIA H200, B200, and AMD MI355X GPUs.

import DeepSeekConfigGenerator from '@site/src/components/autoregressive/DeepSeekConfigGenerator';

<DeepSeekConfigGenerator />

### 3.2 Launch Examples

To serve [DeepSeek-V3.2-Exp](https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp) on 8xH200/B200 GPUs:

```bash
# Launch with TP + DP (Recommended)
python -m sglang.launch_server --model deepseek-ai/DeepSeek-V3.2-Exp --tp 8 --dp 8 --enable-dp-attention

# Launch with EP + DP
python -m sglang.launch_server --model deepseek-ai/DeepSeek-V3.2-Exp --tp 8 --ep 8 --dp 8 --enable-dp-attention

# Launch with Pure TP
python -m sglang.launch_server --model deepseek-ai/DeepSeek-V3.2-Exp --tp 8

# Launch with TP on MI30x/MI35x
python3 -m sglang.launch_server --model deepseek-ai/DeepSeek-V3.2-Exp --tp 8 --nsa-prefill-backend tilelang --nsa-decode-backend tilelang
```

### 3.3 Configuration Tips

- **DP Attention (Recommended)**: For DeepSeek V3.2 model, the kernels are customized for the use case of `dp_size=8`, so DP attention (`--dp 8 --enable-dp-attention`) is the recommended configuration for better stability and performance. All test cases use this configuration by default.
- **Pure TP Mode**: Launching with pure TP (without `--dp` and `--enable-dp-attention`) is also supported. Note that this mode has not been fully validated in PD disaggregation scenarios.
- **Short-sequence MHA prefill (adaptive)**: For short prefill sequences (default threshold: **2048 tokens**), the NSA backend uses standard MHA automatically (no extra flags). On H200 (SM90) this path uses the FlashAttention variable-length kernel; on B200 (SM100) it uses TRT-LLM ragged MHA. MHA uses `MHA_ONE_SHOT` for best performance — it computes multi-head attention over all tokens (both cached prefix and newly extended tokens) in a single kernel invocation, avoiding the overhead of chunked KV cache processing.
- **Choices of Attention Kernels**: The attention backend is automatically set to `nsa` for DeepSeek V3.2. Different kernels for sparse prefilling/decoding can be specified by `--nsa-prefill-backend` and `--nsa-decode-backend`:
  - `flashmla_sparse`: `flash_mla_sparse_fwd` kernel from `flash_mla` library. Runs on both Hopper and Blackwell GPUs. Requires bf16 q, kv inputs.
  - `flashmla_kv`: `flash_mla_with_kvcache` kernel from `flash_mla` library. Runs on both Hopper and Blackwell GPUs. Requires bf16 q, fp8 k_cache inputs.
  - `fa3`: `flash_attn_with_kvcache` kernel from `flash_attn` library. Hopper GPUs only. Requires bf16 q, kv inputs.
  - `tilelang`: `tilelang` implementation that can run on GPU, HPU and NPU.
  - `aiter`: Aiter kernel on AMD HPUs. Can only be used as decode kernel.
- **Default configurations by hardware**:
  - **H200**: `flashmla_sparse` prefill (short-seq uses MHA via FlashAttention varlen), `fa3` decode, `bf16` kv cache dtype.
  - **B200**: `flashmla_auto` prefill (short-seq uses MHA via TRT-LLM ragged), `flashmla_kv` decode, `fp8_e4m3` kv cache dtype. `flashmla_auto` enables automatic selection of either `flashmla_sparse` or `flashmla_kv` based on KV cache dtype, hardware, and heuristics.

### 3.4 Multi-token Prediction

SGLang implements Multi-Token Prediction (MTP) for DeepSeek V3.2 based on [EAGLE speculative decoding](https://docs.sglang.io/advanced_features/speculative_decoding.html#EAGLE-Decoding). With this optimization, the decoding speed can be improved significantly on small batch sizes. See [this PR](https://github.com/sgl-project/sglang/pull/11652) for more information.

Example usage with DP Attention:

```bash
python -m sglang.launch_server --model deepseek-ai/DeepSeek-V3.2-Exp --tp 8 --dp 8 --enable-dp-attention --speculative-algorithm EAGLE --speculative-num-steps 3 --speculative-eagle-topk 1 --speculative-num-draft-tokens 4
```

Example usage with Pure TP:

```bash
python -m sglang.launch_server --model deepseek-ai/DeepSeek-V3.2-Exp --tp 8 --speculative-algorithm EAGLE --speculative-num-steps 3 --speculative-eagle-topk 1 --speculative-num-draft-tokens 4
```

- The best configuration for `--speculative-num-steps`, `--speculative-eagle-topk` and `--speculative-num-draft-tokens` can be searched with [bench_speculative.py](https://github.com/sgl-project/sglang/blob/main/scripts/playground/bench_speculative.py) script for given batch size. The minimum configuration is `--speculative-num-steps 1 --speculative-eagle-topk 1 --speculative-num-draft-tokens 2`, which can achieve speedup for larger batch sizes.
- The default value of `--max-running-requests` is set to `48` for MTP. For larger batch sizes, this value should be increased beyond the default value.

> **Tip:** To enable the experimental overlap scheduler for EAGLE speculative decoding, set the environment variable `SGLANG_ENABLE_SPEC_V2=1`. This can improve performance by enabling overlap scheduling between draft and verification stages.

### 3.5 NVFP4 Checkpoint

To launch DeepSeek V3.2 [NVFP4 checkpoint](https://huggingface.co/nvidia/DeepSeek-V3.2-NVFP4) on Blackwell devices, specify the quantization method as `modelopt_fp4`, and moe runner backend as one of `flashinfer_trtllm` (recommended), `flashinfer_cutlass` and `flashinfer_cutedsl`. Any other usage (parallelism, reasoning parser, etc.) is the same as the FP8 checkpoint.

```bash
python -m sglang.launch_server --model nvidia/DeepSeek-V3.2-NVFP4 --tp 4 --quantization modelopt_fp4 --moe-runner-backend flashinfer_trtllm --tool-call-parser deepseekv32 --reasoning-parser deepseek-v3
```

### 3.6 PD Disaggregation

Prefill Command:

```bash
python -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.2-Exp \
  --disaggregation-mode prefill \
  --host $LOCAL_IP \
  --port $PORT \
  --tp 8 \
  --dp 8 \
  --enable-dp-attention \
  --dist-init-addr ${HOST}:${DIST_PORT} \
  --trust-remote-code \
  --disaggregation-bootstrap-port 8998 \
  --mem-fraction-static 0.9
```

Decode Command:

```bash
python -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.2-Exp \
  --disaggregation-mode decode \
  --host $LOCAL_IP \
  --port $PORT \
  --tp 8 \
  --dp 8 \
  --enable-dp-attention \
  --dist-init-addr ${HOST}:${DIST_PORT} \
  --trust-remote-code \
  --mem-fraction-static 0.9
```

Router Command:

```bash
python -m sglang_router.launch_router --pd-disaggregation \
  --prefill $PREFILL_ADDR 8998 \
  --decode $DECODE_ADDR \
  --host 127.0.0.1 \
  --port 8000
```

For more advanced or production-ready deployment methods (RBG or LWS-based), please refer to the [DeepSeek V3.2 PD documentation](https://docs.sglang.io/references/multi_node_deployment/rbg_pd/deepseekv32_pd.html).

### 3.7 DSA Context Parallel (Experimental)

> **Note:** This feature is only verified on Hopper machines.

For context parallel in DeepSeek V3.2 model, two different modes of splitting tokens are provided, controlled with `--nsa-prefill-cp-mode`.

#### 3.7.1 In-Sequence Splitting (Default)

This mode (`--nsa-prefill-cp-mode in-seq-split`) implements context parallel for DSA by splitting the sequence uniformly between context parallel ranks. At attention stage, each CP rank computes the indexer results of sharded sequence, and collects the whole KV cache through all-gather.

The communication group for context parallel reuses the one for attention TP, thus `cp_size` equals `atten_tp_size = tp_size / dp_size`.

Restrictions:
- Batch size restricted to 1 for prefill batches
- Multi-node/PD disaggregation not yet supported
- `moe_dense_tp_size=1`, `kv_cache_dtype = "bf16"`, `moe_a2a_backend = "deepep"`
- `tp_size` must be larger than `dp_size` to ensure `cp_size > 1`

For details, see [PR #12065](https://github.com/sgl-project/sglang/pull/12065).

```bash
# In-seq splitting mode launched with EP + DP
python -m sglang.launch_server --model deepseek-ai/DeepSeek-V3.2-Exp --tp 8 --ep 8 --dp 2 --enable-dp-attention --enable-nsa-prefill-context-parallel --nsa-prefill-cp-mode in-seq-split --max-running-requests 32
```

#### 3.7.2 Round-Robin Splitting

This mode (`--nsa-prefill-cp-mode round-robin-split`) distributes tokens across ranks based on `token_idx % cp_size`.

Compared to in-sequence splitting, it additionally supports fused MoE backend (which may deliver better performance in single-machine scenarios), FP8 KV-cache, and multi-batch prefill inference. However, it cannot be used with DP attention.

For details, see [PR #13959](https://github.com/sgl-project/sglang/pull/13959).

```bash
# Launch with FusedMoe + CP8
python -m sglang.launch_server --model deepseek-ai/DeepSeek-V3.2-Exp --tp 8 --enable-nsa-prefill-context-parallel --nsa-prefill-cp-mode round-robin-split --max-running-requests 32
```

#### 3.7.3 Pipeline Parallel + Context Parallel (PP + CP)

This mode combines Pipeline Parallelism (PP) and Context Parallelism (CP) to scale across multiple nodes, achieving better throughput and TTFT. Only tested on H20 96G.

For related development, see [PR #13959](https://github.com/sgl-project/sglang/pull/13959), [Issue #15358](https://github.com/sgl-project/sglang/issues/15358) and [PR #16380](https://github.com/sgl-project/sglang/pull/16380).

**Standard Usage** — PP=2 with CP on 2 nodes (uses fused MoE kernel by default):

Node 0:

```bash
export SGLANG_PP_LAYER_PARTITION=30,31
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.2-Exp \
  --nnodes 2 --node-rank 0 \
  --dist-init-addr <HEAD_NODE_IP>:62001 \
  --tp 8 --pp-size 2 \
  --dp-size 1 --moe-dense-tp-size 1 \
  --enable-nsa-prefill-context-parallel \
  --nsa-prefill-cp-mode round-robin-split \
  --trust-remote-code \
  --disable-radix-cache \
  --mem-fraction-static 0.8 \
  --max-running-requests 128 \
  --chunked-prefill-size 16384 \
  --cuda-graph-max-bs 8 \
  --page-size 64 \
  --watchdog-timeout 3600 \
  --host 0.0.0.0 --port 8000 \
  --tool-call-parser deepseekv32
```

Node 1:

```bash
export SGLANG_PP_LAYER_PARTITION=30,31
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.2-Exp \
  --nnodes 2 --node-rank 1 \
  --dist-init-addr <HEAD_NODE_IP>:62001 \
  --tp 8 --pp-size 2 \
  --dp-size 1 --moe-dense-tp-size 1 \
  --enable-nsa-prefill-context-parallel \
  --nsa-prefill-cp-mode round-robin-split \
  --trust-remote-code \
  --disable-radix-cache \
  --mem-fraction-static 0.8 \
  --max-running-requests 128 \
  --chunked-prefill-size 16384 \
  --cuda-graph-max-bs 8 \
  --page-size 64 \
  --watchdog-timeout 3600 \
  --host 0.0.0.0 --port 8000 \
  --tool-call-parser deepseekv32
```

**PD Disaggregation with PP + CP** — Prefill nodes configured with PP + CP:

Prefill Node 0:

```bash
python -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.2-Exp \
  --served-model-name deepseek-v32 \
  --nnodes 2 --node-rank 0 \
  --dist-init-addr <PREFILL_HEAD_IP>:20102 \
  --tp 8 --pp-size 2 \
  --dp-size 1 --moe-dense-tp-size 1 \
  --enable-nsa-prefill-context-parallel \
  --nsa-prefill-cp-mode round-robin-split \
  --disaggregation-ib-device mlx5_bond_0,mlx5_bond_1,mlx5_bond_2,mlx5_bond_3 \
  --trust-remote-code \
  --disable-radix-cache \
  --max-running-requests 512 \
  --chunked-prefill-size 4096 \
  --context-length 131072 \
  --mem-fraction-static 0.9 \
  --page-size 64 \
  --enable-metrics \
  --collect-tokens-histogram \
  --tokenizer-worker-num 8 \
  --host 0.0.0.0 --port 30000
```

Prefill Node 1:

```bash
python -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.2-Exp \
  --served-model-name deepseek-v32-prefill \
  --nnodes 2 --node-rank 1 \
  --dist-init-addr <PREFILL_HEAD_IP>:20102 \
  --tp 8 --pp-size 2 \
  --dp-size 1 --moe-dense-tp-size 1 \
  --enable-nsa-prefill-context-parallel \
  --nsa-prefill-cp-mode round-robin-split \
  --disaggregation-ib-device mlx5_bond_0,mlx5_bond_1,mlx5_bond_2,mlx5_bond_3 \
  --trust-remote-code \
  --disable-radix-cache \
  --max-running-requests 512 \
  --chunked-prefill-size 4096 \
  --context-length 131072 \
  --mem-fraction-static 0.9 \
  --page-size 64 \
  --enable-metrics \
  --collect-tokens-histogram \
  --tokenizer-worker-num 8 \
  --host 0.0.0.0 --port 30000
```

For Decode nodes, it is recommended to use the **EP mode**.

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [Basic API Usage](https://docs.sglang.ai/get_started/quick_start.html)

### 4.2 Advanced Usage

#### 4.2.1 Reasoning Parser

DeepSeek-V3.2 supports reasoning mode. Enable the reasoning parser during deployment to separate the thinking and content sections:

```shell
python -m sglang.launch_server \
  --model deepseek-ai/DeepSeek-V3.2-Exp \
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
    model="deepseek-ai/DeepSeek-V3.2-Exp",
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
To solve this problem, I need to calculate 15% of 240.
Step 1: Convert 15% to decimal: 15% = 0.15
Step 2: Multiply 240 by 0.15
Step 3: 240 × 0.15 = 36
=============== Content =================

The answer is 36. To find 15% of 240, we multiply 240 by 0.15, which equals 36.
```

**Note:** The reasoning parser captures the model's step-by-step thinking process, allowing you to see how the model arrives at its conclusions.

#### 4.2.2 Tool Calling

DeepSeek-V3.2 and DeepSeek-V3.2-Exp support tool calling capabilities. Enable the tool call parser:

**Note:** DeepSeek-V3.2-Speciale does **NOT** support tool calling. It is designed exclusively for deep reasoning tasks.

**Deployment Command:**

```shell
python -m sglang.launch_server \
  --model deepseek-ai/DeepSeek-V3.2-Exp \
  --tool-call-parser deepseekv31 \
  --reasoning-parser deepseek-v3 \
  --chat-template ./examples/chat_template/tool_chat_template_deepseekv32.jinja \
  --tp 8 \
  --host 0.0.0.0 \
  --port 8000
```

For DeepSeek-V3.2, use `--tool-call-parser deepseekv32` instead.

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
    model="deepseek-ai/DeepSeek-V3.2-Exp",
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
The user is asking about the weather in Beijing. I need to use the get_weather function to retrieve this information.
I should call the function with location="Beijing".
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
    model="deepseek-ai/DeepSeek-V3.2-Exp",
    messages=messages,
    temperature=0.7
)

print(final_response.choices[0].message.content)
# Output: "The weather in Beijing is currently 22°C and sunny."
```

**Curl Examples:**

Non-streaming request (using V3.2-Exp with `deepseekv31` parser):

```bash
curl "http://127.0.0.1:8000/v1/chat/completions" \
-H "Content-Type: application/json" \
-d '{"temperature": 0, "max_tokens": 100, "model": "deepseek-ai/DeepSeek-V3.2-Exp", "tools": [{"type": "function", "function": {"name": "query_weather", "description": "Get weather of a city, the user should supply a city first", "parameters": {"type": "object", "properties": {"city": {"type": "string", "description": "The city, e.g. Beijing"}}, "required": ["city"]}}}], "messages": [{"role": "user", "content": "How'\''s the weather like in Qingdao today"}]}'
```

Expected Response:

```
{"id":"6501ef8e2d874006bf555bc80cddc7c5","object":"chat.completion","created":1745993638,"model":"deepseek-ai/DeepSeek-V3.2-Exp","choices":[{"index":0,"message":{"role":"assistant","content":null,"reasoning_content":null,"tool_calls":[{"id":"0","index":null,"type":"function","function":{"name":"query_weather","arguments":"{\"city\": \"Qingdao\"}"}}]},"logprobs":null,"finish_reason":"tool_calls","matched_stop":null}],"usage":{"prompt_tokens":116,"total_tokens":138,"completion_tokens":22,"prompt_tokens_details":null}}
```

Streaming request:

```bash
curl "http://127.0.0.1:8000/v1/chat/completions" \
-H "Content-Type: application/json" \
-d '{"temperature": 0, "max_tokens": 100, "model": "deepseek-ai/DeepSeek-V3.2-Exp","stream":true,"tools": [{"type": "function", "function": {"name": "query_weather", "description": "Get weather of a city, the user should supply a city first", "parameters": {"type": "object", "properties": {"city": {"type": "string", "description": "The city, e.g. Beijing"}}, "required": ["city"]}}}], "messages": [{"role": "user", "content": "How'\''s the weather like in Qingdao today"}]}'
```

Expected Streamed Chunks (simplified for clarity):

```
data: {"choices":[{"delta":{"tool_calls":[{"function":{"arguments":"{\""}}]}}]}
data: {"choices":[{"delta":{"tool_calls":[{"function":{"arguments":"city"}}]}}]}
data: {"choices":[{"delta":{"tool_calls":[{"function":{"arguments":"\":\""}}]}}]}
data: {"choices":[{"delta":{"tool_calls":[{"function":{"arguments":"Q"}}]}}]}
data: {"choices":[{"delta":{"tool_calls":[{"function":{"arguments":"ing"}}]}}]}
data: {"choices":[{"delta":{"tool_calls":[{"function":{"arguments":"dao"}}]}}]}
data: {"choices":[{"delta":{"tool_calls":[{"function":{"arguments":"\"}"}}]}}]}
data: {"choices":[{"delta":{"tool_calls":null}}], "finish_reason": "tool_calls"}
data: [DONE]
```

The client needs to concatenate all argument fragments from streamed chunks to reconstruct the complete tool call:

```
{"city": "Qingdao"}
```

> **Important:**
> 1. Use a lower `"temperature"` value for better results.
> 2. To receive more consistent tool call results, it is recommended to use `--chat-template examples/chat_template/tool_chat_template_deepseekv32.jinja`. It provides an improved unified prompt.

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA B200 GPU (8x)
- Model: DeepSeek-V3.2-Exp
- Tensor Parallelism: 8
- sglang version: 0.5.6

We use SGLang's built-in benchmarking tool to conduct performance evaluation on the [ShareGPT_Vicuna_unfiltered](https://huggingface.co/datasets/anon8231489123/ShareGPT_Vicuna_unfiltered) dataset. This dataset contains real conversation data and can better reflect performance in actual use scenarios. To simulate real-world usage patterns, we configure each request with 1024 input tokens and 1024 output tokens, representing typical medium-length conversations with detailed responses.

#### 5.1.1 Latency-Sensitive Benchmark

- Model Deployment Command:

```shell
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.2-Exp \
  --tp 8 \
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
  --model deepseek-ai/DeepSeek-V3.2-Exp \
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
Benchmark duration (s):                  29.11
Total input tokens:                      1972
Total input text tokens:                 1972
Total input vision tokens:               0
Total generated tokens:                  2784
Total generated tokens (retokenized):    2777
Request throughput (req/s):              0.34
Input token throughput (tok/s):          67.73
Output token throughput (tok/s):         95.62
Peak output token throughput (tok/s):    157.00
Peak concurrent requests:                3
Total token throughput (tok/s):          163.36
Concurrency:                             1.00
Accept length:                           2.46
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   2909.74
Median E2E Latency (ms):                 3088.27
P90 E2E Latency (ms):                    4200.62
P99 E2E Latency (ms):                    5588.52
---------------Time to First Token----------------
Mean TTFT (ms):                          317.58
Median TTFT (ms):                        191.31
P99 TTFT (ms):                           740.79
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          9.09
Median TPOT (ms):                        9.25
P99 TPOT (ms):                           11.73
---------------Inter-Token Latency----------------
Mean ITL (ms):                           9.35
Median ITL (ms):                         7.64
P95 ITL (ms):                            22.81
P99 ITL (ms):                            23.33
Max ITL (ms):                            31.45
==================================================
```

#### 5.1.2 Throughput-Sensitive Benchmark

- Model Deployment Command:

```shell
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.2-Exp \
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
  --model deepseek-ai/DeepSeek-V3.2-Exp \
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
Benchmark duration (s):                  219.09
Total input tokens:                      301701
Total input text tokens:                 301701
Total input vision tokens:               0
Total generated tokens:                  188375
Total generated tokens (retokenized):    187443
Request throughput (req/s):              4.56
Input token throughput (tok/s):          1377.06
Output token throughput (tok/s):         859.80
Peak output token throughput (tok/s):    2465.00
Peak concurrent requests:                109
Total token throughput (tok/s):          2236.86
Concurrency:                             88.05
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   19291.23
Median E2E Latency (ms):                 11927.39
---------------Time to First Token----------------
Mean TTFT (ms):                          530.36
Median TTFT (ms):                        444.00
P99 TTFT (ms):                           1504.78
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          106.16
Median TPOT (ms):                        106.69
P99 TPOT (ms):                           221.12
---------------Inter-Token Latency----------------
Mean ITL (ms):                           100.46
Median ITL (ms):                         41.73
P95 ITL (ms):                            225.67
P99 ITL (ms):                            392.37
Max ITL (ms):                            975.03
==================================================
```

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark

- **Benchmark Command:**

```shell
python3 -m sglang.test.few_shot_gsm8k --num-questions 200 --port 8000
```

- **Test Results**:
  - DeepSeek-V3.2-Exp
    ```
    Accuracy: 0.980
    Invalid: 0.000
    Latency: 19.128 s
    Output throughput: 965.919 token/s
    ```

#### 5.2.2 MMLU Benchmark

- **Benchmark Command:**

```shell
cd sglang
bash benchmark/mmlu/download_data.sh
python3 benchmark/mmlu/bench_sglang.py --nsub 10 --port 8000
```

- **Test Results**:
  - DeepSeek-V3.2-Exp
    ```
    subject: abstract_algebra, #q:100, acc: 0.780
    subject: anatomy, #q:135, acc: 0.874
    subject: astronomy, #q:152, acc: 0.961
    subject: business_ethics, #q:100, acc: 0.860
    subject: clinical_knowledge, #q:265, acc: 0.925
    subject: college_biology, #q:144, acc: 0.972
    subject: college_chemistry, #q:100, acc: 0.660
    subject: college_computer_science, #q:100, acc: 0.880
    subject: college_mathematics, #q:100, acc: 0.840
    subject: college_medicine, #q:173, acc: 0.879
    Total latency: 7.961
    Average accuracy: 0.879
    ```

#### 5.2.3 GSM8K Long-Context Benchmark (20-shot)

To test long-context accuracy, run gsm8k with `--num-shots 20`. The results are very close to the 8-shot results:

```bash
python3 benchmark/gsm8k/bench_sglang.py --num-shots 20 --num-questions 1319 --parallel 1319
```

```
Accuracy: 0.956
Invalid: 0.000
Latency: 29.545 s
Output throughput: 4418.617 token/s
```

#### 5.2.4 GPQA-Diamond Benchmark

Accuracy benchmark on long context with thinking enabled:

```bash
python3 -m sglang.test.run_eval --port 30000 --eval-name gpqa --num-examples 198 --max-tokens 128000 --repeat 8 --thinking-mode deepseek-v3
```

The mean accuracy over 8 runs shows 0.797, matching the official tech report number (0.799):

```
Repeat: 8, mean: 0.797
Scores: ['0.808', '0.798', '0.808', '0.798', '0.783', '0.788', '0.803', '0.793']
```

For DeepSeek V3.2, DeepSeek recommends setting sampling parameters to `temperature = 1.0, top_p = 0.95`:

```bash
python3 -m sglang.test.run_eval --port 30000 --eval-name gpqa --num-examples 198 --max-tokens 128000 --repeat 8 --top-p 0.95 --temperature 1.0 --thinking-mode deepseek-v3
```

```
Repeat: 8, mean: 0.840
Scores: ['0.848', '0.808', '0.848', '0.838', '0.879', '0.813', '0.838', '0.848']
```

This matches the official score of 0.824 reported in the [DeepSeek-V3.2 technical report](https://huggingface.co/deepseek-ai/DeepSeek-V3.2/blob/main/assets/paper.pdf).

#### 5.2.5 AIME 2025 Benchmark

Prepare the environment by installing NeMo-Skills:

```bash
pip install git+https://github.com/NVIDIA/NeMo-Skills.git --ignore-installed blinker
```

Launch the SGLang server:

```bash
python -m sglang.launch_server --model deepseek-ai/DeepSeek-V3.2-Exp --tp 8 --dp 8 --enable-dp-attention
```

For `DeepSeek-V3.2` and `DeepSeek-V3.2-Speciale`:

```bash
python3 -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3.2 \
  --trust-remote-code \
  --tp-size 8 --dp-size 8 --enable-dp-attention \
  --tool-call-parser deepseekv32 \
  --reasoning-parser deepseek-v3
```

Run the evaluation script:

```bash
#!/bin/bash
export NEMO_SKILLS_DISABLE_UNCOMMITTED_CHANGES_CHECK=1

ns prepare_data aime25

PORT=30000
BACKEND=sglang
MODEL="deepseek-ai/DeepSeek-V3.2-Exp"  # Change to your model name
MODEL_NAME="dsv32-fp8"

echo "Starting AIME25 evaluation with model $MODEL on port $PORT using backend $BACKEND..."
ns eval \
  --benchmarks=aime25:4 \
  --server_type=$BACKEND \
  --model=$MODEL \
  --server_address=http://localhost:${PORT}/v1 \
  --output_dir=nemo_skills_aime25_${MODEL_NAME}_output_${BACKEND}_$(date +%Y%m%d_%H%M%S) \
  ++chat_template_kwargs.thinking=true \
  ++inference.temperature=1.0 \
  ++inference.top_p=0.95 \
  ++inference.tokens_to_generate=64000
  # ++inference.tokens_to_generate=120000 for Speciale model
```

**Test Results (8xB200):**

DeepSeek-V3.2-Exp:

| evaluation_mode | num_entries | avg_tokens | gen_seconds | symbolic_correct | no_answer |
|---|---|---|---|---|---|
| pass@1[avg-of-4] | 30 | 15040 | 1673 | 87.50% ± 1.67% | 0.00% |
| majority@4 | 30 | 15040 | 1673 | 90.00% | 0.00% |
| pass@4 | 30 | 15040 | 1673 | 90.00% | 0.00% |

DeepSeek-V3.2:

| evaluation_mode | num_entries | avg_tokens | gen_seconds | symbolic_correct | no_answer |
|---|---|---|---|---|---|
| pass@1[avg-of-4] | 30 | 13550 | 1632 | 92.50% ± 1.67% | 0.00% |
| majority@4 | 30 | 13550 | 1632 | 94.71% | 0.00% |
| pass@4 | 30 | 13550 | 1632 | 96.67% | 0.00% |

DeepSeek-V3.2-Speciale:

| evaluation_mode | num_entries | avg_tokens | gen_seconds | symbolic_correct | no_answer |
|---|---|---|---|---|---|
| pass@1[avg-of-4] | 30 | 24155 | 3583 | 95.00% ± 1.92% | 0.00% |
| majority@4 | 30 | 24155 | 3583 | 95.83% | 0.00% |
| pass@4 | 30 | 24155 | 3583 | 100.00% | 0.00% |
