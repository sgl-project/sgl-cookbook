# Kimi-Linear

## 📝 Community Contribution Welcome

This guide is currently under development. We welcome community contributions!

If you have experience deploying **Kimi-Linear** with SGLang, please help us complete this documentation.

## 🚀 How to Contribute

```shell
git clone https://github.com/YOUR_USERNAME/sglang-cookbook.git
cd sglang-cookbook
git checkout -b add-kimi-linear-guide
# Edit this file and submit a PR
```

## 📚 Reference

- [Kimi-K2](./Kimi-K2.md)

---

**Let's build this together!** 🌟

## AMD GPU Support

## 1. Model Introduction
Kimi Linear is a hybrid linear attention architecture that outperforms traditional full attention methods across various contexts, including short, long, and reinforcement learning (RL) scaling regimes. At its core is Kimi Delta Attention (KDA)—a refined version of Gated DeltaNet that introduces a more efficient gating mechanism to optimize the use of finite-state RNN memory.



**Key Features:**

Kimi Delta Attention (KDA): A linear attention mechanism that refines the gated delta rule with finegrained gating.
Hybrid Architecture: A 3:1 KDA-to-global MLA ratio reduces memory usage while maintaining or surpassing the quality of full attention.
Superior Performance: Outperforms full attention in a variety of tasks, including long-context and RL-style benchmarks on 1.4T token training runs with fair comparisons.
High Throughput: Achieves up to 6× faster decoding and significantly reduces time per output token (TPOT).


- **Hardware Optimization**: Specifically tuned for  AMD MI300X GPUs
- **High Performance**: Optimized for both throughput and latency scenarios

**Available Models:**

- **FP8 (8-bit quantized)**: [huggingface: moonshotai/Kimi-Linear-48B-A3B-Instruct] 


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
  --model-path moonshotai/Kimi-Linear-48B-A3B-Instruct \
  --tokenizer-path  moonshotai/Kimi-Linear-48B-A3B-Instruct \
  --tp 4 \
  --trust-remote-code
```
