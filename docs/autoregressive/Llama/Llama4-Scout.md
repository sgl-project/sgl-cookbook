# Llama4-Scout Usage Guide

## 📝 Community Contribution Welcome

This guide is currently under development. We welcome community contributions!

If you have experience deploying **Llama4-Scout** with SGLang, please help us complete this documentation.

## 🚀 How to Contribute

```shell
git clone https://github.com/YOUR_USERNAME/sglang-cookbook.git
cd sglang-cookbook
git checkout -b add-llama4-scout-guide
# Edit this file and submit a PR
```

## 📚 Reference

- [Qwen3](../Qwen/Qwen3.md)

---

**Let's build this together!** 🌟

## AMD GPU Support

## 1. Model Introduction

[Llama 4](https://github.com/meta-llama/llama-models/blob/main/models/llama4/MODEL_CARD.md) is Meta's latest generation of open-source LLM model with industry-leading performance.

SGLang has supported Llama 4 Scout (109B) and Llama 4 Maverick (400B) since [v0.4.5](https://github.com/sgl-project/sglang/releases/tag/v0.4.5).

Ongoing optimizations are tracked in the [Roadmap](https://github.com/sgl-project/sglang/issues/5118).



**Key Features:**

The highly capable Llama 4 Maverick with 17B active parameters out of ~400B total, with 128 experts.
The efficient Llama 4 Scout also has 17B active parameters out of ~109B total, using just 16 experts.
Both models leverage early fusion for native multimodality, enabling them to process text and image inputs. Maverick and Scout are both trained on up to 40 trillion tokens on data encompassing 200 languages (with specific fine-tuning support for 12 languages including Arabic, Spanish, German, and Hindi).


- **Hardware Optimization**: Specifically tuned for  AMD MI300X GPUs
- **High Performance**: Optimized for both throughput and latency scenarios

**Available Models:**

This document applies to the following models. You only need to change the model name during deployment.

- [meta-llama/Llama-4-Scout-17B-16E-Instruct](https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct)
- [meta-llama/Llama-4-Maverick-17B-128E-Instruct](https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct)



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
  --name Llama4 \
  lmsysorg/sglang:v0.5.7-rocm700-mi30x \
  /bin/bash
```


#### 3.2.2 Launch the server

Run the following command to start the SGLang server. SGLang will automatically download and cache the Llama-4-Scout model from Hugging Face.



8-GPU deployment command:

```bash
python3 -m sglang.launch_server \
  --model-path meta-llama/Llama-4-Scout-17B-16E-Instruct \
  --tp 8 \
  --context-length 1000000 \
  --host 0.0.0.0 \
  --trust-remote-code \
  --port 8000 
```
