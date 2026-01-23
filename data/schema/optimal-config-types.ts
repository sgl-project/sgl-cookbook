/**
 * Optimal Configuration Schema Types
 *
 * TypeScript interfaces for optimal (pre-tuned) deployment configurations.
 * These are hardware-specific, scenario-optimized configurations.
 *
 * Used by: data/optimal-configs/src/{version}/{model}.yaml
 * Compiled to: data/optimal-configs/generated/{version}/{model}.json
 */

export interface OptimalConfigFile {
  model: string;
  version: string;
  ui_options: UIOptions;
  configs: OptimalConfig[];
  validation?: ValidationRule[];
}

export interface UIOptions {
  hardware: UIOption[];
  quantization: UIOption[];
  scenario: UIOption[];
  gpu_count: UIOption[];
}

export interface UIOption {
  id: string | number;
  label: string;
  subtitle?: string;
  default: boolean;
}

export interface OptimalConfig {
  hardware: string;
  quantization: string;
  gpu_count: number;
  scenario: "low-latency" | "high-throughput";
  parameters: ServerParameters;
}

export interface ServerParameters {
  model_path: string;
  env_vars?: string;
  trust_remote_code?: boolean;
  tensor_parallel_size: number;
  data_parallel_size?: number;
  ep_size?: number;
  cuda_graph_max_bs?: number;
  max_running_requests?: number;
  mem_fraction_static?: number;
  kv_cache_dtype?: string;
  chunked_prefill_size?: number;
  max_prefill_tokens?: number;
  enable_flashinfer_allreduce_fusion?: boolean;
  scheduler_recv_interval?: number;
  enable_symm_mem?: boolean;
  disable_radix_cache?: boolean;
  attention_backend?: string;
  moe_runner_backend?: string;
  stream_interval?: number;
  quantization?: string;
  decode_log_interval?: number;
  fp8_gemm_backend?: string;
}

export interface ValidationRule {
  hardware: string | string[];
  quantization: string | string[];
  error: string;
}
