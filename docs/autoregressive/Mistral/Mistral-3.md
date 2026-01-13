---
sidebar_position: 2
---

# Mistral 3

:::info Community contribution welcome
This guide is currently under development. If you have experience deploying **Mistral 3** with SGLang, please help us complete this documentation.

To contribute, fork the repo, edit this page, and open a PR.
:::

## 1. Model Introduction

This page will cover practical deployment configs and usage patterns for **Mistral 3** with SGLang.

## 2. SGLang Installation

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html).

## 3. Model Deployment

Coming soon: recommended launch configs (TP/PP, quantization, context length) and tuning tips.

## 4. Model Invocation

Coming soon: OpenAI-compatible API examples and tool-calling notes.

## Contributing

```shell
git clone https://github.com/YOUR_USERNAME/sgl-cookbook.git
cd sgl-cookbook
git checkout -b add-mistral-3-guide
# Edit this file and submit a PR
```

## Reference

- [Devstral 2](./Devstral-2.md)


## AMD GPU Support

## 1. Model Introduction
Mistral 3 includes three state-of-the-art small, dense models (14B, 8B, and 3B) and Mistral Large 3 – our most capable model to date – a sparse mixture-of-experts trained with 41B active and 675B total parameters. All models are released under the Apache 2.0 license. Open-sourcing our models in a variety of compressed formats empowers the developer community and puts AI in people’s hands through distributed intelligence.

The Ministral models represent the best performance-to-cost ratio in their category. At the same time, Mistral Large 3 joins the ranks of frontier instruction-fine-tuned open-source models.



**Key Features:**

The Ministral-3 Instruct model offers the following capabilities:

Vision: Enables the model to analyze images and provide insights based on visual content, in addition to text.
Multilingual: Supports dozens of languages, including English, French, Spanish, German, Italian, Portuguese, Dutch, Chinese, Japanese, Korean, Arabic.
System Prompt: Maintains strong adherence and support for system prompts.
Agentic: Offers best-in-class agentic capabilities with native function calling and JSON outputting.
Edge-Optimized: Delivers best-in-class performance at a small scale, deployable anywhere.
Apache 2.0 License: Open-source license allowing usage and modification for both commercial and non-commercial purposes.
Large Context Window: Supports a 256k context window.




- **Hardware Optimization**: Specifically tuned for  AMD MI300X GPUs
- **High Performance**: Optimized for both throughput and latency scenarios

**Available Models:**

- **FP8 (8-bit quantized)**: [huggingface: mistralai/Ministral-3-14B-Instruct-2512] , [huggingface: mistralai/Ministral-3-8B-Instruct-2512]- Recommended for MI300X.


**License:**
This model is licensed under a Modified MIT License.



## 2. SGLang Installation

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.


### 3.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)

### 3.2 Advanced Usage

#### 3.2.1 
```shell
docker pull lmsysorg/sglang:v0.5.7-rocm700-mi30x
```

```shell
docker run -d -it --ipc=host --network=host --privileged \
  --cap-add=CAP_SYS_ADMIN \
  --device=/dev/kfd --device=/dev/dri --device=/dev/mem \
  --group-add video --cap-add=SYS_PTRACE \
  --security-opt seccomp=unconfined \
  -v /:/work \
  -e SHELL=/bin/bash \
  --name Ministral \
  lmsysorg/sglang:v0.5.7-rocm700-mi30x \
  /bin/bash
```

#### 3.2.2 Pre-installation steps inside the docker

```shell
pip install mistral-common --upgrade
pip install git+https://github.com/huggingface/transformers.git
```

#### 3.2.4 Launch the server
```shell
python3 -m sglang.launch_server \
  --model-path mistralai/Ministral-3-14B-Instruct-2512 \
  --tp 1 \
  --trust-remote-code \
  --port 8888
```
