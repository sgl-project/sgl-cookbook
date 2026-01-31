## AMD GPU Support

## 1. Model Introduction
Kimi K2 is a state-of-the-art mixture-of-experts (MoE) language model with 42 billion activated parameters and 1 trillion total parameters. Trained with the Muon optimizer, Kimi K2 achieves exceptional performance across frontier knowledge, reasoning, and coding tasks while being meticulously optimized for agentic capabilities.


This generation delivers comprehensive upgrades across the board:

Large-Scale Training: Pre-trained a 1T parameter MoE model on 15.5T tokens with zero training instability.
MuonClip Optimizer: We apply the Muon optimizer to an unprecedented scale, and develop novel optimization techniques to resolve instabilities while scaling up.
Agentic Intelligence: Specifically designed for tool use, reasoning, and autonomous problem-solving.

For more details, please refer to the official Kimi GitHub Repository: https://github.com/MoonshotAI/Kimi-K2 



## 2. SGLang Installation

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.


## 3. Model Deployment

This section provides a progressive guide from quick deployment to performance optimization, suitable for users at different levels.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, model variant, deployment strategy, and thinking capabilities.

import KimiK2ConfigGenerator from '@site/src/components/autoregressive/KimiK2ConfigGenerator';

<KimiK2ConfigGenerator />



## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)
- [SGLang OpenAI Vision API Guide](https://docs.sglang.ai/basic_usage/openai_api_vision.html)

### 4.2 Advanced Usage

#### 4.2.1 Launch the docker 
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

#### 4.2.2 pre-installation steps inside the docker

```shell
pip install sentencepiece tiktoken
```


#### 4.2.3 Launch the server
```shell
export SGLANG_ROCM_FUSED_DECODE_MLA=0
```
```shell
SGLANG_ROCM_FUSED_DECODE_MLA=0 python3 -m sglang.launch_server \
  --model-path moonshotai/Kimi-K2-Instruct \
  --tokenizer-path  moonshotai/Kimi-K2-Instruct \
  --tp 8 \
  --trust-remote-code
```

#### 4.2.4 Tool Calling
Kimi-K2-Instruct and Kimi-K2-Thinking support tool calling capabilities. Enable the tool call parser during deployment:

```shell
SGLANG_ROCM_FUSED_DECODE_MLA=0 python3 -m sglang.launch_server \
  --model moonshotai/Kimi-K2-Instruct \
  --tool-call-parser kimi_k2 \
  --tp 8 \
  --trust-remote-code

```

## 5. Benchmark
### 5.1 Speed Benchmark
Test Environment:

Hardware: AMD MI300X GPU

Model: Kimi-K2-Instruct

Tensor Parallelism: 8

sglang version: 0.5.7

- **Model Deployment**

```bash
SGLANG_ROCM_FUSED_DECODE_MLA=0 python3 -m sglang.launch_server \
  --model moonshotai/Kimi-K2-Instruct \
  --tool-call-parser kimi_k2 \
  --tp 8 \
  --trust-remote-code
```


### 5.1.1 Low Concurrency (Latency-Optimized)
- Benchmark Command:
```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2-Instruct \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 10 \
  --max-concurrency 1 \
  --request-rate inf
```
- Test Results:

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 1
Successful requests:                     10
Benchmark duration (s):                  129.80
Total input tokens:                      6101
Total input text tokens:                 6101
Total input vision tokens:               0
Total generated tokens:                  4220
Total generated tokens (retokenized):    4047
Request throughput (req/s):              0.08
Input token throughput (tok/s):          47.00
Output token throughput (tok/s):         42.51
Peak output token throughput (tok/s):    44.00
Peak concurrent requests:                2
Total token throughput (tok/s):          79.51
Concurrency:                             1.00
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   12975.41
Median E2E Latency (ms):                 10441.77
---------------Time to First Token----------------
Mean TTFT (ms):                          159.67
Median TTFT (ms):                        161.21
P99 TTFT (ms):                           161.84
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          40.41
Median TPOT (ms):                        40.45
P99 TPOT (ms):                           40.77
---------------Inter-Token Latency----------------
Mean ITL (ms):                           40.44
Median ITL (ms):                         40.42
P95 ITL (ms):                            41.06
P99 ITL (ms):                            41.17
Max ITL (ms):                            42.06
==================================================
```



### 5.1.2 Medium Concurrency (Balanced)
- Benchmark Command:
```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2-Instruct \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 80 \
  --max-concurrency 16 \
  --request-rate inf

```

- Test Results:


```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 16
Successful requests:                     80
Benchmark duration (s):                  146.79
Total input tokens:                      49668
Total input text tokens:                 49668
Total input vision tokens:               0
Total generated tokens:                  40805
Total generated tokens (retokenized):    29148
Request throughput (req/s):              0.58
Input token throughput (tok/s):          290.00
Output token throughput (tok/s):         298.41
Peak output token throughput (tok/s):    442.00
Peak concurrent requests:                19
Total token throughput (tok/s):          588.40
Concurrency:                             14.74
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   24487.00
Median E2E Latency (ms):                 22990.58
---------------Time to First Token----------------
Mean TTFT (ms):                          977.11
Median TTFT (ms):                        168.58
P99 TTFT (ms):                           4595.69
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          46.85
Median TPOT (ms):                        42.15
P99 TPOT (ms):                           98.94
---------------Inter-Token Latency----------------
Mean ITL (ms):                           44.22
Median ITL (ms):                         48.58
P95 ITL (ms):                            45.76
P99 ITL (ms):                            140.61
Max ITL (ms):                            2469.48
==================================================
```



### 5.1.3 High Concurrency (Throughput-Optimized)
- Benchmark Command:
```bash
python3 -m sglang.bench_serving \
  --backend sglang \
  --model moonshotai/Kimi-K2-Instruct \
  --dataset-name random \
  --random-input-len 1000 \
  --random-output-len 1000 \
  --num-prompts 500 \
  --max-concurrency 100 \
  --request-rate inf
```


- Test Results:


```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 100
Successful requests:                     500
Benchmark duration (s):                  208.06
Total input tokens:                      249841
Total input text tokens:                 249841
Total input vision tokens:               0
Total generated tokens:                  252662
Total generated tokens (retokenized):    202051
Request throughput (req/s):              2.40
Input token throughput (tok/s):          1200.78
Output token throughput (tok/s):         1214.49
Peak output token throughput (tok/s):    1600.00
Peak concurrent requests:                107
Total token throughput (tok/s):          2415.17
Concurrency:                             89.14
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   47091.76
Median E2E Latency (ms):                 46205.57
---------------Time to First Token----------------
Mean TTFT (ms):                          400.01
Median TTFT (ms):                        255.04
P99 TTFT (ms):                           514.16
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          74.58
Median TPOT (ms):                        75.88
P99 TPOT (ms):                           84.46
---------------Inter-Token Latency----------------
Mean ITL (ms):                           72.95
Median ITL (ms):                         64.09
P95 ITL (ms):                            129.88
P99 ITL (ms):                            194.81
Max ITL (ms):                            654.74
==================================================
```
