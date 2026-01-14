/**
 * Optimal Configuration Schema Types
 *
 * This file defines the TypeScript interfaces for optimal (pre-tuned) deployment
 * configurations. These are hardware-specific, scenario-optimized configurations
 * discovered through benchmarking.
 *
 * Used by: data/optimal-configs/src/{version}/{model}.yaml
 * Compiled to: data/optimal-configs/generated/{version}/{model}.json
 */

// ============ Root Configuration File ============
/**
 * Root structure for an optimal configuration file.
 * Each model has its own file (e.g., deepseek-r1.yaml)
 */
export interface OptimalConfigFile {
  /** Model identifier (e.g., "deepseek-r1") */
  model: string;
  /** SGLang version these configs are optimized for */
  version: string;
  /** UI options for the config generator dropdowns */
  ui_options: UIOptions;
  /** List of optimal configurations */
  configs: OptimalConfig[];
  /** Validation rules for invalid combinations */
  validation?: ValidationRule[];
}

// ============ UI Options ============
/**
 * UI dropdown/radio options for the config generator
 */
export interface UIOptions {
  /** Hardware options (e.g., B200, H200) */
  hardware: UIOption[];
  /** Quantization options (e.g., FP8, FP4) */
  quantization: UIOption[];
  /** Deployment scenario options */
  scenario: UIOption[];
  /** GPU count options */
  gpu_count: UIOption[];
}

/**
 * A single UI option for dropdowns/radio buttons
 */
export interface UIOption {
  /** Unique identifier for this option */
  id: string | number;
  /** Display label shown in UI */
  label: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Whether this is the default selection */
  default: boolean;
}

// ============ Optimal Configuration Entry ============
/**
 * A single optimal configuration for a specific hardware/quant/gpu/scenario combination
 */
export interface OptimalConfig {
  /** Hardware identifier (e.g., "b200", "h200") */
  hardware: string;
  /** Quantization format (e.g., "fp8", "fp4") */
  quantization: string;
  /** Number of GPUs */
  gpu_count: number;
  /** Deployment scenario */
  scenario: "low-latency" | "high-throughput";
  /** SGLang server parameters */
  parameters: ServerParameters;
}

/**
 * SGLang server parameters for optimal deployment.
 * These map to SGLang CLI arguments.
 */
export interface ServerParameters {
  /** HuggingFace model path */
  model_path: string;
  /** Environment variables (e.g., "KEY=value KEY2=value2") */
  env_vars?: string;
  /** Trust remote code from HuggingFace */
  trust_remote_code?: boolean;
  /** Tensor parallelism size (--tp) */
  tensor_parallel_size: number;
  /** Data parallelism size (--dp) */
  data_parallel_size?: number;
  /** Expert parallelism size for MoE models (--ep-size) */
  ep_size?: number;
  /** CUDA graph max batch size (--cuda-graph-max-bs) */
  cuda_graph_max_bs?: number;
  /** Max concurrent requests (--max-running-requests) */
  max_running_requests?: number;
  /** Static memory fraction (--mem-fraction-static) */
  mem_fraction_static?: number;
  /** KV cache data type (--kv-cache-dtype) */
  kv_cache_dtype?: string;
  /** Chunked prefill size (--chunked-prefill-size) */
  chunked_prefill_size?: number;
  /** Max prefill tokens (--max-prefill-tokens) */
  max_prefill_tokens?: number;
  /** Enable FlashInfer allreduce fusion */
  enable_flashinfer_allreduce_fusion?: boolean;
  /** Scheduler receive interval (--scheduler-recv-interval) */
  scheduler_recv_interval?: number;
  /** Enable symmetric memory (--enable-symm-mem) */
  enable_symm_mem?: boolean;
  /** Disable radix cache (--disable-radix-cache) */
  disable_radix_cache?: boolean;
  /** Attention backend (--attention-backend) */
  attention_backend?: string;
  /** MoE runner backend */
  moe_runner_backend?: string;
  /** Stream interval (--stream-interval) */
  stream_interval?: number;
  /** Quantization type (--quantization) */
  quantization?: string;
  /** Decode log interval (--decode-log-interval) */
  decode_log_interval?: number;
  /** FP8 GEMM backend (--fp8-gemm-backend) */
  fp8_gemm_backend?: string;
}

// ============ Validation Rules ============
/**
 * Rule defining invalid hardware/quantization combinations
 */
export interface ValidationRule {
  /** Hardware this rule applies to */
  hardware: string | string[];
  /** Quantization this rule applies to */
  quantization: string | string[];
  /** Error message to display when rule is violated */
  error: string;
}
