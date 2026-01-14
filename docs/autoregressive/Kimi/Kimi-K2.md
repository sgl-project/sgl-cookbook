## AMD GPU Support

## 1. Model Introduction
Kimi K2 is a state-of-the-art mixture-of-experts (MoE) language model with 32 billion activated parameters and 1 trillion total parameters. Trained with the Muon optimizer, Kimi K2 achieves exceptional performance across frontier knowledge, reasoning, and coding tasks while being meticulously optimized for agentic capabilities.



**Key Features:**

The Kimi-K2 Instruct model offers the following capabilities:

Large-Scale Training: Pre-trained a 1T parameter MoE model on 15.5T tokens with zero training instability.
MuonClip Optimizer: We apply the Muon optimizer to an unprecedented scale, and develop novel optimization techniques to resolve instabilities while scaling up.
Agentic Intelligence: Specifically designed for tool use, reasoning, and autonomous problem-solving.


- **Hardware Optimization**: Specifically tuned for  AMD MI300X GPUs
- **High Performance**: Optimized for both throughput and latency scenarios

**Available Models:**

- **FP8 (8-bit quantized)**: [huggingface: MiniMaxAI/Kimi-K2] - Recommended for MI300X.


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
  --name Kimi \
  lmsysorg/sglang:v0.5.7-rocm700-mi30x \
  /bin/bash
```

#### 3.2.2 pre-installation steps inside the docker

```shell
pip install sentencepiece tiktoken
```


#### 3.2.3 Launch the server
```shell
export SGLANG_ROCM_FUSED_DECODE_MLA=0

SGLANG_ROCM_FUSED_DECODE_MLA=0 python3 -m sglang.launch_server \
  --model-path moonshotai/Kimi-K2-Instruct \
  --tokenizer-path  moonshotai/Kimi-K2-Instruct \
  --tp 8 \
  --trust-remote-code
```
