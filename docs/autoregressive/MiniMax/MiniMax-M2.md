# MiniMax-M2


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

This document applies to the following models. You only need to change the model name during deployment.

- [MiniMaxAI/MiniMax-M2.1](https://huggingface.co/MiniMaxAI/MiniMax-M2.1)
- [MiniMaxAI/MiniMax-M2](https://huggingface.co/MiniMaxAI/MiniMax-M2)



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

Run the following command to start the SGLang server. SGLang will automatically download and cache the MiniMax-M2.1 model from Hugging Face.

4-GPU deployment command:

```shell
python3 -m sglang.launch_server \
    --model-path MiniMaxAI/MiniMax-M2.1 \
    --tp-size 4 \
    --tool-call-parser minimax-m2 \
    --reasoning-parser minimax-append-think \
    --host 0.0.0.0 \
    --trust-remote-code \
    --port 8000 \
    --mem-fraction-static 0.85
```

8-GPU deployment command:

```bash
python3 -m sglang.launch_server \
    --model-path MiniMaxAI/MiniMax-M2.1 \
    --tp-size 8 \
    --ep-size 8 \
    --tool-call-parser minimax-m2 \
    --trust-remote-code \
    --host 0.0.0.0 \
    --reasoning-parser minimax-append-think \
    --port 8000 \
    --mem-fraction-static 0.85
```
## 4. Benchmark
### 4.1 Speed Benchmark


Test Environment:

Hardware: AMD MI300X GPU 

Model: MiniMax-M2.1

Tensor Parallelism: 4

sglang version: 0.5.7

- **Model Deployment**

```bash
python3 -m sglang.launch_server \
    --model-path MiniMaxAI/MiniMax-M2.1 \
    --tp-size 4 \
    --tool-call-parser minimax-m2 \
    --reasoning-parser minimax-append-think \
    --trust-remote-code \
    --mem-fraction-static 0.85
```



### 4.1.1 Low Concurrency (Latency-Optimized)

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model MiniMaxAI/MiniMax-M2.1 \
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
Benchmark duration (s):                  138.49
Total input tokens:                      6101
Total input text tokens:                 6101
Total input vision tokens:               0
Total generated tokens:                  4220
Total generated tokens (retokenized):    4220
Request throughput (req/s):              0.07
Input token throughput (tok/s):          44.05
Output token throughput (tok/s):         30.47
Peak output token throughput (tok/s):    46.00
Peak concurrent requests:                2
Total token throughput (tok/s):          74.53
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   13844.96
Median E2E Latency (ms):                 10379.28
---------------Time to First Token----------------
Mean TTFT (ms):                          4489.71
Median TTFT (ms):                        382.24
P99 TTFT (ms):                           37978.20
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          22.21
Median TPOT (ms):                        22.23
P99 TPOT (ms):                           22.24
---------------Inter-Token Latency----------------
Mean ITL (ms):                           22.22
Median ITL (ms):                         22.24
P95 ITL (ms):                            22.34
P99 ITL (ms):                            22.39
Max ITL (ms):                            23.61
==================================================
```



### 4.1.2 Medium Concurrency (Balanced)

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model MiniMaxAI/MiniMax-M2.1 \
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
Benchmark duration (s):                  79.85
Total input tokens:                      39668
Total input text tokens:                 39668
Total input vision tokens:               0
Total generated tokens:                  40805
Total generated tokens (retokenized):    40801
Request throughput (req/s):              1.00
Input token throughput (tok/s):          496.81
Output token throughput (tok/s):         511.05
Peak output token throughput (tok/s):    703.00
Peak concurrent requests:                20
Total token throughput (tok/s):          1007.86
Concurrency:                             13.71
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   13683.48
Median E2E Latency (ms):                 14324.05
---------------Time to First Token----------------
Mean TTFT (ms):                          329.71
Median TTFT (ms):                        147.43
P99 TTFT (ms):                           898.91
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          26.93
Median TPOT (ms):                        26.52
P99 TPOT (ms):                           38.01
---------------Inter-Token Latency----------------
Mean ITL (ms):                           26.23
Median ITL (ms):                         23.44
P95 ITL (ms):                            24.30
P99 ITL (ms):                            123.34
Max ITL (ms):                            632.37
==================================================
```


### 4.1.3 High Concurrency (Throughput-Optimized)

```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model MiniMaxAI/MiniMax-M2.1 \
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
Benchmark duration (s):                  153.81
Total input tokens:                      249831
Total input text tokens:                 249831
Total input vision tokens:               0
Total generated tokens:                  252662
Total generated tokens (retokenized):    252540
Request throughput (req/s):              3.25
Input token throughput (tok/s):          1624.24
Output token throughput (tok/s):         1642.64
Peak output token throughput (tok/s):    2600.00
Peak concurrent requests:                107
Total token throughput (tok/s):          3266.88
Concurrency:                             91.12
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   28030.32
Median E2E Latency (ms):                 26911.51
---------------Time to First Token----------------
Mean TTFT (ms):                          505.29
Median TTFT (ms):                        182.64
P99 TTFT (ms):                           1815.81
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          55.04
Median TPOT (ms):                        57.64
P99 TPOT (ms):                           69.84
---------------Inter-Token Latency----------------
Mean ITL (ms):                           54.58
Median ITL (ms):                         38.94
P95 ITL (ms):                            140.77
P99 ITL (ms):                            149.16
Max ITL (ms):                            956.82
==================================================
```
