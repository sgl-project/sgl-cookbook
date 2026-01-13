# MiniMax-M2

## 📝 Community Contribution Welcome

This guide is currently under development. We welcome community contributions!

If you have experience deploying **MiniMax-M2** with SGLang, please help us complete this documentation.

## 🚀 How to Contribute

```shell
git clone https://github.com/YOUR_USERNAME/sglang-cookbook.git
cd sglang-cookbook
git checkout -b add-minimax-m2-guide
# Edit this file and submit a PR
```

## 📚 Reference

- [Kimi-K2](../Moonshotai/Kimi-K2.md)

---

**Let's build this together!** 🌟


## AMD GPU Support

## 1. Model Introduction

MiniMax-M2 redefines efficiency for agents. It's a compact, fast, and cost-effective MoE model (230 billion total parameters with 10 billion active parameters) built for elite performance in coding and agentic tasks, all while maintaining powerful general intelligence. 



**Key Features:**

The MiniMaxAI/MiniMax-M2 Instruct model offers the following capabilities:

Superior Intelligence. According to benchmarks from Artificial Analysis, MiniMax-M2 demonstrates highly competitive general intelligence across mathematics, science, instruction following, coding, and agentic tool use. Its composite score ranks #1 among open-source models globally.

Advanced Coding. Engineered for end-to-end developer workflows, MiniMax-M2 excels at multi-file edits, coding-run-fix loops, and test-validated repairs. Strong performance on Terminal-Bench and (Multi-)SWE-Bench–style tasks demonstrates practical effectiveness in terminals, IDEs, and CI across languages.

Agent Performance. MiniMax-M2 plans and executes complex, long-horizon toolchains across shell, browser, retrieval, and code runners. In BrowseComp-style evaluations, it consistently locates hard-to-surface sources, maintains evidence traceable, and gracefully recovers from flaky steps.

Efficient Design. With 10 billion activated parameters (230 billion in total), MiniMax-M2 delivers lower latency, lower cost, and higher throughput for interactive agents and batched sampling—perfectly aligned with the shift toward highly deployable models that still shine on coding and agentic tasks.


- **Hardware Optimization**: Specifically tuned for  AMD MI300X GPUs
- **High Performance**: Optimized for both throughput and latency scenarios

**Available Models:**

- **FP8 (8-bit quantized)**: [huggingface: MiniMaxAI/MiniMax-M2] - Recommended for MI300X.


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
  --name Minimax \
  lmsysorg/sglang:v0.5.7-rocm700-mi30x \
  /bin/bash
```

#### 3.2.2 Make modifications inside the docker

```shell
mv /sgl-workspace/sglang/python/sglang/srt/models/transformers.py \
   /sgl-workspace/sglang/python/sglang/srt/models/hf_transformers_model.py
```

#### 3.2.3 comment out the following line: @torch.compile(dynamic=True, backend=get_compiler_backend()) in /sgl-workspace/sglang/python/sglang/srt/models/minimax_m2.py

```shell
#@torch.compile(dynamic=True, backend=get_compiler_backend())
```
#### 3.2.4 Launch the server
```shell
python3 -m sglang.launch_server \
  --model-path MiniMaxAI/MiniMax-M2-123B-Instruct-2512 \
  --tp 4 \
  --trust-remote-code \
  --port 8888
```
