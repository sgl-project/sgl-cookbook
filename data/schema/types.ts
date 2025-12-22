/**
 * Model Configuration Schema Types
 *
 * This file defines the TypeScript interfaces for the model configuration hierarchy.
 * It serves as the source of truth for the data structure.
 *
 * Hierarchy: Vendor -> Family -> Model -> Hardware -> Named Configuration
 * Note: Version is now a top-level folder (e.g., data/models/generated/v0.5.6/)
 */

// ============ Level 1: Root (Vendor File) ============
/**
 * Root configuration for a model vendor/organization.
 * Each vendor has its own YAML file (e.g., deepseek.yaml, qwen.yaml)
 */
export interface VendorConfig {
  /** Vendor identifier (e.g., "deepseek-ai", "qwen", "meta-llama") */
  vendor: string;
  /** List of model families from this vendor */
  families: ModelFamily[];
}

// ============ Level 2: Model Family ============
/**
 * A family of related models (e.g., DeepSeek-V3.2 family includes V3.2, V3.2-Exp, V3.2-Speciale)
 */
export interface ModelFamily {
  /** Family name (e.g., "DeepSeek-V3.2", "DeepSeek-R1") */
  name: string;
  /** Optional description of the model family */
  description?: string;
  /** List of models in this family */
  models: Model[];
}

// ============ Level 3: Model ============
/**
 * A specific model within a family
 */
export interface Model {
  /** Model display name (e.g., "DeepSeek-V3.2", "DeepSeek-V3.2-Exp") */
  name: string;
  /** HuggingFace model path (e.g., "deepseek-ai/DeepSeek-V3.2") */
  model_path: string;
  /** Model-level attributes (capabilities, parsers, etc.) */
  attributes: ModelAttributes;
  /** Hardware-specific configurations, keyed by hardware type */
  hardware: Record<string, HardwareConfig>;
}

/**
 * Model-level attributes that apply across all hardware configurations.
 * Organized by model type (llm, diffusion, etc.)
 */
export interface ModelAttributes {
  /** LLM-specific attributes */
  llm: LLMAttributes;
  // Future: diffusion?: DiffusionAttributes;
}

/**
 * LLM-specific attributes (thinking capability, parsers, chat templates)
 */
export interface LLMAttributes {
  /** Thinking capability mode */
  thinking_capability: "non_thinking" | "thinking" | "hybrid";
  /** Tool call parser name (e.g., "deepseekv32"), null if not supported */
  tool_parser?: string | null;
  /** Reasoning parser name (e.g., "deepseek-v3"), null if not supported */
  reasoning_parser?: string | null;
  /** Custom chat template path, if needed */
  chat_template?: string | null;
}

// ============ Level 4: Hardware Config ============
/**
 * Configuration for a specific hardware type (e.g., H100, H200, B200)
 * The key in the parent Record is the hardware name.
 * Version is now a top-level folder (e.g., data/models/generated/v0.5.6/)
 */
export interface HardwareConfig {
  /** List of named configurations for this hardware */
  configurations: NamedConfiguration[];
}

// ============ Level 5: Named Configuration ============
/**
 * A specific named configuration (e.g., "default", "low-latency-fp8", "high-throughput-dp")
 *
 * Validation rule: Either `engine` alone OR both `prefill` and `decode` together.
 * They cannot coexist - use engine for unified config, or prefill+decode for phase-specific config.
 */
export interface NamedConfiguration {
  /** Configuration name (e.g., "default", "low-latency-fp8") */
  name: string;
  /** Configuration attributes describing the deployment scenario */
  attributes: ConfigAttributes;
  /** Override model path for quantized models (e.g., "deepseek-ai/DeepSeek-V3.2-FP8") */
  quantized_model_path?: string | null;
  /** Unified engine config (mutually exclusive with prefill/decode) */
  engine?: EngineConfig | null;
  /** Prefill phase config (requires decode, mutually exclusive with engine) */
  prefill?: EngineConfig | null;
  /** Decode phase config (requires prefill, mutually exclusive with engine) */
  decode?: EngineConfig | null;
}

/**
 * Attributes describing the deployment scenario
 */
export interface ConfigAttributes {
  /** Single node or multi-node deployment */
  nodes: "single" | "multi";
  /** Optimization target */
  optimization: "balanced" | "low-latency" | "high-throughput";
  /** Quantization format (required) */
  quantization: "fp8" | "int4" | "bf16" | "fp4" | "mxfp4";
}

/**
 * Engine/runtime configuration. Used for unified config, prefill, and decode phases.
 */
export interface EngineConfig {
  /** Environment variables to set */
  env_vars?: Record<string, string> | null;
  /** Tensor Parallelism degree */
  tp: number;
  /** Data Parallelism degree, null if not used */
  dp?: number | null;
  /** Expert Parallelism degree (for MoE models), null if not used */
  ep?: number | null;
  /** Enable DP attention optimization */
  enable_dp_attention?: boolean | null;
  /** Additional command-line arguments */
  extra_args?: string[] | null;
}
