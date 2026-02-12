# Ring-2.5-1T

## 1. Model Introduction

[Ring-2.5-1T](https://huggingface.co/inclusionAI/Ring-2.5-1T) is the world's first open-source trillion-parameter reasoning model based on hybrid linear attention architecture, developed by InclusionAI. Building on Ring-1T, Ring-2.5-1T demonstrates substantial improvements in generation efficiency, reasoning depth, and long-horizon task execution capabilities.

**Key Features:**

- **Trillion-Scale Model**: ~1T total parameters with 63B activation parameters using a hybrid linear attention architecture (1:7 MLA + Lightning Linear Attention)
- **Generation Efficiency**: Reduces memory access overhead by over 10x and increases generation throughput by more than 3x for sequences exceeding 32K tokens
- **Deep Reasoning**: Achieves gold medal level for both IMO 2025 and CMO 2025, with dense rewards for rigorous reasoning process feedback
- **Long-horizon Task Execution**: Enhanced autonomous execution capability through large-scale fully-async agentic RL training
- **Tool Calling**: Supports function calling with XML-style tool call format
- **Context Length**: 128K -> 256K (YaRN)

**Available Models:**

- **FP8 (8-bit quantized)**: [inclusionAI/Ring-2.5-1T](https://huggingface.co/inclusionAI/Ring-2.5-1T)

**License:** MIT

## 2. SGLang Installation

Ring-2.5-1T requires a specific SGLang Docker image:

```bash
docker pull lmsysorg/sglang:dev-pr-18598
```

For other installation methods, please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html).

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform.

import Ring25ConfigGenerator from '@site/src/components/autoregressive/Ring25ConfigGenerator';

<Ring25ConfigGenerator />

### 3.2 Configuration Tips

- The `--trust-remote-code` flag is required for this model due to custom modeling code.
- H200 uses `--max-running-requests 64` for optimal performance.
- The model uses FP8 quantization (compressed-tensors format).

## 4. Model Invocation

Deploy Ring-2.5-1T with the following command (on H200):

```shell
python3 -m sglang.launch_server \
  --model-path inclusionAI/Ring-2.5-1T \
  --tp-size 8 \
  --trust-remote-code \
  --max-running-requests 64 \
  --host 0.0.0.0 \
  --port 30000
```

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

### 4.2 Advanced Usage

TODO: Add reasoning mode examples, tool calling examples after testing.

## 5. Benchmark

TODO: Add benchmark results after testing.
