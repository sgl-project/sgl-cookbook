# SGLang Serving LLM(VLM) Benchmark Documentation

`sglang.bench_serving` is a command-line tool designed to benchmark the online serving throughput and latency of Large Language Models (LLMs) and Vision Language Models(VLMs). It supports various backends (`SGLang`, `vLLM`, etc.) and offers flexible configurations for request rates, dataset types, and profiling.

## 1. Quick Start

### Basic Usage (Random Data)

Run a benchmark using randomly generated prompts with a local SGLang server.

```bash
python -m sglang.bench_serving --backend sglang --port 30000 --dataset-name random --num-prompts 100
```

### Real-World Data (ShareGPT)

Run a benchmark using the ShareGPT dataset with a specific request rate.

```
python -m sglang.bench_serving \
  --backend sglang \
  --dataset-name sharegpt \
  --dataset-path ./ShareGPT_V3_unfiltered_cleaned_split.json \
  --num-prompts 1000 \
  --request-rate 10
```

## 2. Parameter Reference

### 2.1 Backend & Server Configuration

These parameters define the target server and the inference engine being used.
| Parameter | Description |
|-----------|-------------|
| `--backend` | **Required.** Specifies the backend engine. Options: `sglang`, `sglang-native`, `sglang-oai`, `sglang-oai-chat`, `vllm`, `vllm-chat`, `lmdeploy`, `lmdeploy-chat`, `trt`, `gserver`, `truss`. |
| `--base-url` | The API base URL (if not using specific host/port flags). |
| `--host` | Server hostname. Default: `0.0.0.0`. |
| `--port` | Server port. If not set, it defaults to the specific backend's standard port. |
| `--model` | Model name or path. If unset, it queries `/v1/models` for configuration. |
| `--served-model-name` | The model name used in the API request body. Defaults to the value of `--model`. |
| `--tokenizer` | Path or name of the tokenizer. Defaults to the model configuration. |

### 2.2 Dataset Configuration

Controls the source of the prompts used for benchmarking.
| Parameter | Description |
|-----------|-------------|
| `--dataset-name` | The type of dataset. Options: `sharegpt`, `custom`, `random`, `random-ids`, `generated-shared-prefix`, `mmmu`, `image`, `mooncake`. |
| `--dataset-path` | File path to the dataset (e.g., local JSON file for ShareGPT). |
| `--num-prompts` | Total number of prompts to process. Default: `1000`. |
| `--seed` | Random seed for reproducibility. |
| `--tokenize-prompt` | Uses integer IDs instead of strings for inputs. Useful for precise length control. |

### 2.3 Input/Output Length Control

Parameters to control the shape of requests (context length and generation length).

#### For Random/Image Datasets:

- `--random-input-len`: Number of input tokens per request.
- `--random-output-len`: Number of output tokens per request.
- `--random-range-ratio`: Range ratio for sampling input/output lengths.

#### For ShareGPT Dataset:

- `--sharegpt-output-len`: Overrides the output length defined in the dataset for each request.
- `--sharegpt-context-len`: Max context length. Requests exceeding this are dropped.

#### General Request Modifiers:

- `--extra-request-body`: Appends a JSON object to the request payload (e.g., \{"key": "value"\}). Useful for passing sampling parameters.
- `--prompt-suffix`: A string suffix appended to all user prompts.
- `--disable-ignore-eos`: If set, the model will stop generation upon hitting the EOS token (benchmarks usually ignore EOS to force max generation length).
- `--apply-chat-template`: Applies the model's chat template to the input.

### 2.4 Traffic & Concurrency

Controls how fast requests are sent to the server.
| Parameter | Description |
|-----------|-------------|
| `--request-rate` | Requests per second (RPS). If `inf` (default), all requests are sent immediately (burst). Otherwise, arrival times follow a Poisson process. |
| `--max-concurrency` | The maximum number of active requests allowed at once. Even if `request-rate` is high, the client will hold back requests if this limit is reached. |
| `--warmup-requests` | Number of requests to run before the actual measurement begins to warm up the server. |
| `--flush-cache` | Flushes the server cache before starting the benchmark. |

### 2.5 Output & Logging

| Parameter          | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `--output-file`    | Path to save the results in JSONL format.                            |
| `--output-details` | Includes detailed metrics in the output.                             |
| `--print-requests` | Prints requests to stdout as they are sent (useful for debugging).   |
| `--disable-tqdm`   | Hides the progress bar.                                              |
| `--disable-stream` | Disables streaming mode (waits for full response).                   |
| `--return-logprob` | Requests logprobs from the server.                                   |
| `--tag`            | An arbitrary string tag added to the output file for identification. |

### 2.6 Advanced

#### 2.6.1 Image / Multi-modal

Only applicable when --dataset-name is set to image.

- `--image-count`: Number of images per request.
- `--image-resolution`: Resolution (e.g., 1080p, 4k, or custom 1080x1920).
- `--image-format`: jpeg or png.
- `--image-content`: random (noise) or blank.

#### 2.6.2 LoRA Benchmarking

Used to simulate multi-LoRA serving scenarios.

- `--lora-name`: A list of LoRA adapter names (e.g., `--lora-name` adapter1 adapter2).
- `--lora-request-distribution`: How requests are assigned to adapters:
  - `uniform`: Equal probability.
  - `distinct`: New adapter for every request.
  - `skewed`: Follows a Zipf distribution (simulating hot/cold adapters).
- `--lora-zipf-alpha`: The alpha parameter for the Zipf distribution (if `skewed` is used).

#### 2.6.3 Profiling

Tools for deep performance analysis.

- `--profile`: Enables Torch Profiler (Requires `SGLANG_TORCH_PROFILER_DIR` env var on server).
- `--plot-throughput`: Generates throughput/concurrency plots (requires `termplotlib` and `gnuplot`).
- `--profile-activities`: Activities to profile (CPU, GPU, CUDA_PROFILER).
- `--profile-num-steps`: Number of steps to profile.
- `--profile-by-stage` / `--profile-stages`: Profile specific processing stages.

#### 2.6.4 PD Disaggregation

For benchmarking Prefill-Decode (PD) separated architectures.

- `--pd-separated`: Enable PD disaggregation benchmarking.
- `--profile-prefill-url`: URL(s) of prefill workers for profiling.
- `--profile-decode-url`: URL(s) of decode workers for profiling.

<span style={{color:"red"}}>Note</span>: In PD mode, `prefill` and `decode` must be profiled separately.

### 2.7 Specialized Datasets

#### 2.7.1 Generated Shared Prefix (GSP):

Designed to test system prompt caching/prefix sharing performance.

- `--gsp-num-groups`: Number of unique system prompts.
- `--gsp-prompts-per-group`: How many user questions share the same system prompt.
- `--gsp-system-prompt-len`: Length of the shared prefix.
- `--gsp-fast-prepare`: Skips some statistics calculation for faster startup.

#### 2.7.2 Mooncake

Designed for trace replay.

- `--mooncake-slowdown-factor`: Slows down the trace replay (e.g., 2.0 = 2x slower).
- `--mooncake-num-rounds`: Number of conversation rounds (supports multi-turn).
- `--use-trace-timestamps`: Schedules requests based on timestamps found in the trace file.

## 3. Metrics

After running the benchmark, the tool generally reports:

- `E2E` (End-to-End Latency): The total time from sending the request to receiving the final token.
- `TTFT` (Time To First Token): The time between sending the request and seeing the first word appear. This represents the Prefill time (processing the image and text prompt).
- `TPOT` (Time per Output Token): The average time it takes to generate one token (excluding the first one). This is calculated per request.
- `ITL` (Inter-Token Latency): The time gap between two distinct streaming packets. While TPOT is an average, ITL measures the "jitter" or smoothness of the stream.
