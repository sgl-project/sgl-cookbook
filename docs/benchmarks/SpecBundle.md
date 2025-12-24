# SpecBundle

![specbundle logo](/img/benchmarks/specbundle-logo.png)

## About SpecBundle

Speculative decoding, especially EAGLE3, offer strong theoretical guarantees alongside consistent empirical improvements in token acceptance rate and end-to-end inference speed. However, despite these advances, adoption of speculative decoding—especially EAGLE3—remains limited in the open-source ecosystem, due primarily to three key factors.

1. Lack of production-ready training infrastructure: Existing speculative decoding toolchains are largely research prototypes, offering limited system-level optimization and inadequate support for diverse architectures and large-scale models.
2. Scarcity of high-quality draft models: Effective speculative decoding depends on strong draft models, yet publicly available EAGLE3-compatible checkpoints are extremely limited, primarily originating from the original authors.
3. Insufficient training scale of existing drafts: Most available draft models are trained on small or curated datasets and fail to generalize to the large, diverse corpora used in modern LLM training, resulting in low token acceptance rates and diminished practical speedups.

**SpecBundle** is a direct response to these limitations. Jointly driven by the open-source community and industry partners including **Ant Group**, **Meituan**, **Nex-AGI** and **EigenAI**, **SpecBundle** represents the **first open initiative** aimed at democratizing speculative decoding by providing high-performance, production-grade EAGLE3 draft model weights for mainstream open-source LLMs. This initiative also serves to verify the robustness of the [**SpecForge**](https://github.com/sgl-project/SpecForge) framework through multiple scales and architectures.

## Installation

```bash
git clone https://github.com/sgl-project/SpecForge.git
```

## Usage

### Launch SGLang Server with SpecBundle models

You can use the following command to launch the SGLang server with SpecBundle models. Please add `--tp`, `--ep` and `--mem-fraction-static` arguments when you encounter memory issues.

```bash
python3 -m sglang.launch_server \
    --model <target-model-path> \
    --speculative-algorithm EAGLE3 \
    --speculative-draft-model-path <draft-model-path> \
    --speculative-num-steps 3 \
    --speculative-eagle-topk 1 \
    --speculative-num-draft-tokens 4
```

For example:

```bash
SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1 python3 -m sglang.launch_server \
    --model Qwen/Qwen3-30B-A3B-Instruct-2507 \
    --speculative-algorithm EAGLE3 \
    --speculative-draft-model-path lmsys/SGLang-EAGLE3-Qwen3-30B-A3B-Instruct-2507-SpecForge-Nex \
    --speculative-num-steps 3 \
    --speculative-eagle-topk 1 \
    --speculative-num-draft-tokens 4 \
    --tp 4
```

### Use SpecBundle to compare the performance of Speculative Decoding draft models

We provide a benchmark suite to evaluate the performance of SpecBundle draft models [here](https://github.com/sgl-project/SpecForge/tree/main/benchmarks).

#### Example:

1. Launch a SGLang Server

```bash
SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1 python3 -m sglang.launch_server \
    --model Qwen/Qwen3-30B-A3B-Instruct-2507 \
    --speculative-algorithm EAGLE3 \
    --speculative-draft-model-path lmsys/SGLang-EAGLE3-Qwen3-30B-A3B-Instruct-2507-SpecForge-Nex \
    --speculative-num-steps 3 \
    --speculative-eagle-topk 1 \
    --speculative-num-draft-tokens 4 \
    --tp 4
```

2. Use the benchmark suite to evaluate the performance of SpecBundle draft models

`bench_eagle3.py` can help you launch a SGLang server process and a Benchmarking process concurrently. In this way, you don't have to launch the SGLang server manually, this script will manually handle the SGLang launch under different speculative decoding configurations. Some important arguments are:

- `--model-path`: the path to the target model.
- `--speculative-draft-model-path`: the path to the draft model.
- `--port`: the port to launch the SGLang server.
- `--trust-remote-code`: trust the remote code.
- `--mem-fraction-static`: the memory fraction for the static memory.
- `--tp-size`: the tensor parallelism size.
- `--attention-backend`: the attention backend.
- `--config-list`: the list of speculative decoding configuration to test, the format is `<batch-size>,<num-steps>,<topk>,<num-draft-tokens>`.
- `--benchmark-list`: the list of benchmarks to test, the format is `<benchmark-name>:<num-prompts>:<subset>`.

```bash
cd SpecForge/benchmarks
python bench_eagle3.py \
    --model-path Qwen/Qwen3-30B-A3B-Instruct-2507 \
    --port 30000 \
    --config-list 1,3,1,4 \
    --benchmark-list mtbench:5 gsm8k:100 \
    --skip-launch-server
```

It will generate a json file, content is listed below:

```json
{
  "mtbench": [
    {
      "batch_size": 1,
      "steps": null,
      "topk": null,
      "num_draft_tokens": null,
      "metrics": [
        {
          "latency": 12.232808108034078,
          "output_throughput": 319.71399906382845,
          "accept_length": 2.170366259711432,
          "accuracy": null,
          "num_questions": 5,
          "num_valid_predictions": 0,
          "categorical_performance": null
        }
      ],
      "num_samples": 5
    }
  ],
  "gsm8k": [
    {
      "batch_size": 1,
      "steps": null,
      "topk": null,
      "num_draft_tokens": null,
      "metrics": [
        {
          "latency": 37.42077191895805,
          "output_throughput": 373.6160234823207,
          "accept_length": 2.643410852713178,
          "accuracy": 0.96,
          "num_questions": 100,
          "num_valid_predictions": 100,
          "categorical_performance": null
        }
      ],
      "num_samples": 100
    }
  ]
}
```

## Performance Scores

We evaluate the performance of SpecBundle draft models on various benchmarks, please visit the [Performance Dashboard](https://docs.sglang.io/SpecForge/SpecBundle/index.html) for more details.

## [Released Models](https://huggingface.co/collections/lmsys/specbundle)

We list the models released by the SpecForge and several industrial partners below. These models are released as part of the SpecBundle models, which are trained on large-scale multi-domain datasets and deliver exceptional performance on various benchmarks.

> We also include some of the models previously trained by the SpecForge team but not technically part of the SpecBundle release.
> We mark models trained on ShareGPT+Ultrachat datasets with a **\*** mark and models trained on Perfect-Blend datasets but released before SpecBundle with **+** mark.

### Llama Series

| Target Model                                  | EAGLE3 Draft Model                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| meta-llama/Llama-3.1-8B-Instruct              | [🤗 Hugging Face](https://huggingface.co/lmsys/SGLang-EAGLE3-Llama-3.1-8B-Instruct-SpecForge)          |
| meta-llama/Llama-3.3-70B-Instruct             | [🤗 Hugging Face](https://huggingface.co/lmsys/SGLang-EAGLE3-Llama-3.3-70B-Instruct-SpecForge)         |
| meta-llama/Llama-4-Scout-17B-16E-Instruct     | [🤗 Hugging Face](https://huggingface.co/lmsys/SGLang-EAGLE3-Llama-4-Scout-17B-16E-Instruct-SpecForge) |
| meta-llama/Llama-4-Maverick-17B-128E-Instruct | [🤗 Hugging Face \*](https://huggingface.co/lmsys/sglang-EAGLE3-Llama-4-Maverick-17B-128E-Instruct-v1) |

### Qwen Series

| Target Model                         | EAGLE3 Draft Model                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Qwen/Qwen3-30B-A3B-Instruct-2507     | [🤗 Hugging Face](https://huggingface.co/lmsys/SGLang-EAGLE3-Qwen3-30B-A3B-Instruct-2507-SpecForge-Nex)                 |
| Qwen/Qwen3-235B-A22B-Instruct-2507   | [🤗 Hugging Face](https://huggingface.co/lmsys/SGLang-EAGLE3-Qwen3-235B-A22B-Instruct-2507-SpecForge-Meituan)           |
| Qwen/Qwen3-Next-80B-A3B-Instruct-FP8 | [🤗 Hugging Face](https://huggingface.co/lmsys/SGLang-EAGLE3-Qwen3-Next-80B-A3B-Instruct-FP8-perfect-blend-regenerated) |

### Qwen Coder Series

| Target Model                        | EAGLE3 Draft Model                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Qwen/Qwen3-Coder-30B-A3B-Instruct   | [🤗 Hugging Face](https://huggingface.co/lmsys/SGLang-EAGLE3-Qwen3-Coder-30B-A3B-Instruct-SpecForge)           |
| Qwen/Qwen3-Coder-480B-A35B-Instruct | [🤗 Hugging Face](https://huggingface.co/lmsys/SGLang-EAGLE3-Qwen3-Coder-480B-A35B-Instruct-SpecForge-EigenAI) |

### Ling Series

| Target Model               | EAGLE3 Draft Model                                                       |
| -------------------------- | ------------------------------------------------------------------------ |
| inclusionAI/Ling-flash-2.0 | [🤗 Hugging Face](https://huggingface.co/AQ-MedAI/Ling-Flash-2.0-eagle3) |

### Kimi Series

| Target Model                | EAGLE3 Draft Model                                                         |
| --------------------------- | -------------------------------------------------------------------------- |
| moonshotai/Kimi-K2-Instruct | [🤗 Hugging Face](https://huggingface.co/AQ-MedAI/Kimi-K2-Instruct-eagle3) |

### GPT-OSS Series

| Target Model        | EAGLE3 Draft Model                                                           |
| ------------------- | ---------------------------------------------------------------------------- |
| openai/gpt-oss-20b  | [🤗 Hugging Face +](https://huggingface.co/zhuyksir/EAGLE3-gpt-oss-20b-bf16) |
| openai/gpt-oss-120b | [🤗 Hugging Face +](https://huggingface.co/lmsys/EAGLE3-gpt-oss-120b-bf16)   |

### Nex Series

| Target Model                 | EAGLE3 Draft Model                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| nex-agi/Qwen3-30B-A3B-Nex-N1 | [🤗 Hugging Face](https://huggingface.co/nex-agi/SGLANG-EAGLE3-Qwen3-30B-A3B-Nex-N1) |
| nex-agi/Qwen3-32B-Nex-N1     | [🤗 Hugging Face](https://huggingface.co/nex-agi/SGLANG-EAGLE3-Qwen3-32B-Nex-N1)     |
