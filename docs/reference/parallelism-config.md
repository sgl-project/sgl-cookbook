---
sidebar_position: 1
---

# Parallelism Configuration Guide

This guide explains the parallelism configuration fields used in SGLang model configurations and how they map to SGLang server command-line arguments.

## Quick Reference

| Config Field | SGLang CLI Argument | Description |
|--------------|---------------------|-------------|
| `tp` | `--tp-size`, `--tensor-parallel-size` | Tensor Parallelism - splits model across GPUs |
| `dp` | `--dp-size`, `--data-parallel-size` | Data Parallelism - runs multiple model replicas |
| `ep` | `--ep-size`, `--expert-parallel-size`, `--ep` | Expert Parallelism - distributes MoE experts |
| `enable_dp_attention` | `--enable-dp-attention` | DP for attention, TP for FFN (hybrid) |

## Tensor Parallelism (TP)

**What it does:** Splits model weights across multiple GPUs, allowing you to run models larger than a single GPU's memory.

**CLI Argument:** `--tp-size` or `--tensor-parallel-size`

**When to use:**
- Model is too large for a single GPU
- You need to reduce per-GPU memory usage

**Example:**
```yaml
# In YAML config
tp: 8  # Split model across 8 GPUs
```

```bash
# Equivalent CLI
python -m sglang.launch_server --model-path meta-llama/Llama-3.1-70B --tp-size 8
```

**Guidelines:**
- TP should typically be a power of 2 (1, 2, 4, 8)
- For most large models (70B+), start with `tp: 8` on H200/B200
- Smaller models (8B-30B) may only need `tp: 1` or `tp: 2`

## Data Parallelism (DP)

**What it does:** Runs multiple independent copies (replicas) of the model to increase throughput.

**CLI Argument:** `--dp-size` or `--data-parallel-size`

**When to use:**
- You have sufficient GPU memory
- You want to maximize throughput
- You have more GPUs than needed for TP alone

**Example:**
```yaml
# In YAML config
tp: 2
dp: 4  # 4 replicas, each on 2 GPUs = 8 GPUs total
```

```bash
# Equivalent CLI (recommended: use SGLang Router for DP)
python -m sglang_router.launch_server --model-path meta-llama/Llama-3.1-8B --dp 4 --tp 2
```

**Guidelines:**
- Total GPUs = `tp * dp`
- For best DP performance, use [SGLang Router](https://docs.sglang.ai/backend/server_arguments.html#data-parallelism) instead of `--dp-size`
- DP is better than TP for throughput when memory allows

## Expert Parallelism (EP)

**What it does:** Distributes MoE (Mixture of Experts) model experts across GPUs. Only applicable to MoE architectures like DeepSeek, Qwen MoE, Mixtral.

**CLI Argument:** `--ep-size`, `--expert-parallel-size`, or `--ep`

**When to use:**
- Running MoE models
- Using FP8 quantization for better memory efficiency
- Want to reduce memory per GPU for expert weights

**Example:**
```yaml
# In YAML config (for Qwen3 MoE)
tp: 8
ep: 2  # Distribute experts across 2 groups
```

```bash
# Equivalent CLI
python -m sglang.launch_server --model-path Qwen/Qwen3-235B-A22B-FP8 --tp-size 8 --ep-size 2
```

**Guidelines:**
- EP is typically used with MoE models on FP8 quantization
- Common values: `ep: 1`, `ep: 2`, `ep: 4`
- EP size must divide TP size evenly

## DP Attention (Hybrid DP+TP)

**What it does:** A specialized optimization that uses Data Parallelism for the attention mechanism and Tensor Parallelism for FFN layers. This reduces KV cache duplication, enabling larger batch sizes.

**CLI Argument:** `--enable-dp-attention`

**Requirements:**
- `tp` size must equal `dp` size (e.g., `tp: 8, dp: 8`)
- Supported models: DeepSeek-V2/V3, Qwen 2/3 MoE

**When to use:**
- High-throughput scenarios with large batch sizes
- MoE models where KV cache is a bottleneck
- When you have 8+ GPUs and want maximum throughput

**When NOT to use:**
- Low-latency, small-batch inference
- Non-MoE dense models
- Single-GPU deployments

**Example:**
```yaml
# In YAML config (high-throughput DeepSeek)
configurations:
  - name: high-throughput-dp
    optimization: high-throughput
    tp: 8
    dp: 8
    enable_dp_attention: true
```

```bash
# Equivalent CLI
python -m sglang.launch_server \
  --model-path deepseek-ai/DeepSeek-V3 \
  --tp-size 8 \
  --dp-size 8 \
  --enable-dp-attention
```

**Why DP Attention?**

DeepSeek models use Multi-head Latent Attention (MLA) with only one KV head. With standard TP across 8 GPUs, the KV cache is duplicated 8 times. DP attention eliminates this duplication:

| Mode | KV Cache per GPU | Total KV Cache |
|------|------------------|----------------|
| TP=8, no DP attention | 1x (duplicated) | 8x |
| TP=8, DP=8, DP attention | 1/8x | 1x |

This memory savings allows for 8x larger batch sizes.

## Configuration Presets

### Balanced (Default)
Best for: General-purpose deployment with reasonable latency and throughput.

```yaml
- name: default
  optimization: balanced
  tp: 8
```

### High-Throughput
Best for: Batch processing, offline inference, maximum requests per second.

```yaml
- name: high-throughput-dp
  optimization: high-throughput
  tp: 8
  dp: 8
  enable_dp_attention: true
```

### Low-Latency
Best for: Real-time applications, chatbots, interactive use cases.

```yaml
- name: low-latency
  optimization: low-latency
  tp: 8
  # No DP - single replica for lowest latency
```

## Common Configurations by Model Type

### Dense Models (Llama, Mistral)
```yaml
# 70B model on 8x H200
tp: 8
dp: 1  # or omit
```

### MoE Models (DeepSeek, Qwen MoE)
```yaml
# Default - balanced
tp: 8

# High-throughput
tp: 8
dp: 8
enable_dp_attention: true
```

### Small Models (8B-30B)
```yaml
# Single GPU
tp: 1

# Multi-replica for throughput
tp: 1
dp: 8
```

## Modifying TypeScript Configuration

If you need to add new parallelism fields to the schema:

1. **Edit `data/schema/types.ts`:**
   ```typescript
   export interface EngineConfig {
     tp: number;
     dp?: number | null;
     ep?: number | null;
     enable_dp_attention?: boolean | null;
     // Add new field here with JSDoc comment
   }
   ```

2. **Update `data/models/README.md`** with documentation

3. **Run validation:**
   ```bash
   cd data/schema && npm test
   ```

4. **Update source YAML files** in `data/models/src/` as needed

5. **Recompile:**
   ```bash
   python data/scripts/compile_models.py
   ```

## External References

- [SGLang Server Arguments](https://docs.sglang.ai/advanced_features/server_arguments.html)
- [SGLang DeepSeek Guide](https://docs.sglang.ai/references/deepseek.html)
- [SGLang Hyperparameter Tuning](https://docs.sglang.ai/advanced_features/hyperparameter_tuning.html)
- [Large-Scale Expert Parallelism Blog](https://lmsys.org/blog/2025-05-05-large-scale-ep/)
