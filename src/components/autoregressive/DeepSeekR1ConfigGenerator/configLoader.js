// Configuration loader - reads from authoritative lookup.yaml
import lookupDataImport from './configs';

const lookupData = lookupDataImport;

/**
 * Find the appropriate config based on user selections
 */
export function findConfig(hardware, quantization, gpuCount, scenario) {
  if (!lookupData || !lookupData.configs) {
    console.error('Lookup data not loaded properly:', lookupData);
    return null;
  }

  // Find matching config from lookup
  const matchingEntry = lookupData.configs.find(entry => {
    const hardwareMatch = entry.hardware === hardware;
    const quantizationMatch = entry.quantization === quantization;
    const gpuCountMatch = !entry.gpu_count || entry.gpu_count === parseInt(gpuCount, 10);
    const scenarioMatch = entry.scenario === scenario;

    return hardwareMatch && quantizationMatch && gpuCountMatch && scenarioMatch;
  });

  return matchingEntry ? matchingEntry.parameters : null;
}

/**
 * Get available GPU counts for a hardware/quantization combination
 */
export function getAvailableGpuCounts(hardware, quantization) {
  if (!lookupData || !lookupData.configs) {
    return [8]; // Default fallback
  }

  const entries = lookupData.configs.filter(
    entry => entry.hardware === hardware && entry.quantization === quantization
  );
  const gpuCounts = [...new Set(entries.map(e => e.gpu_count))].filter(Boolean);
  return gpuCounts.length > 0 ? gpuCounts.sort((a, b) => a - b) : [8];
}

/**
 * Convert config field names to CLI flag names
 */
const fieldToFlag = {
  model_path: 'model-path',
  trust_remote_code: 'trust-remote-code',
  tensor_parallel_size: 'tp',
  data_parallel_size: 'dp',
  ep_size: 'ep-size',
  cuda_graph_max_bs: 'cuda-graph-max-bs',
  max_running_requests: 'max-running-requests',
  mem_fraction_static: 'mem-fraction-static',
  kv_cache_dtype: 'kv-cache-dtype',
  chunked_prefill_size: 'chunked-prefill-size',
  max_prefill_tokens: 'max-prefill-tokens',
  enable_flashinfer_allreduce_fusion: 'enable-flashinfer-allreduce-fusion',
  scheduler_recv_interval: 'scheduler-recv-interval',
  enable_symm_mem: 'enable-symm-mem',
  disable_radix_cache: 'disable-radix-cache',
  attention_backend: 'attention-backend',
  moe_runner_backend: 'moe-runner-backend',
  stream_interval: 'stream-interval',
  quantization: 'quantization',
  decode_log_interval: 'decode-log-interval',
  fp8_gemm_backend: 'fp8-gemm-backend'
};

/**
 * Generate command from config parameters
 */
export function generateCommandFromConfig(config, extraFlags = {}) {
  if (!config) {
    return '# Error: Configuration not found';
  }

  let cmd = '';

  // Add environment variables if present
  if (config.env_vars) {
    cmd = `${config.env_vars} `;
  }

  cmd += 'python3 -m sglang.launch_server \\\n';
  cmd += `  --model-path ${config.model_path}`;

  // Process each field in the config
  Object.entries(config).forEach(([key, value]) => {
    // Skip model_path (already added) and special fields
    if (key === 'model_path' || key === 'env_vars') {
      return;
    }

    const flagName = fieldToFlag[key];
    if (!flagName) {
      return; // Skip unknown fields
    }

    // Handle boolean flags
    if (typeof value === 'boolean' && value === true) {
      cmd += ` \\\n  --${flagName}`;
    }
    // Handle numeric and string flags
    else if (typeof value === 'number' || typeof value === 'string') {
      cmd += ` \\\n  --${flagName} ${value}`;
    }
  });

  // Add extra flags (reasoning parser, tool call parser, etc.)
  if (extraFlags.reasoningParser) {
    cmd += ` \\\n  --reasoning-parser deepseek-r1`;
  }
  if (extraFlags.toolCallParser) {
    cmd += ` \\\n  --tool-call-parser deepseekv3 \\\n  --chat-template examples/chat_template/tool_chat_template_deepseekr1.jinja`;
  }

  return cmd;
}

/**
 * Check if current selection violates any validation rules
 */
export function validateSelection(hardware, quantization) {
  const validationRules = lookupData.validation || [];

  for (const rule of validationRules) {
    const hardwareMatch = Array.isArray(rule.hardware)
      ? rule.hardware.includes(hardware)
      : rule.hardware === hardware;

    const quantizationMatch = Array.isArray(rule.quantization)
      ? rule.quantization.includes(quantization)
      : rule.quantization === quantization;

    if (hardwareMatch && quantizationMatch) {
      return rule.error;
    }
  }

  return null;
}

/**
 * Check if a UI element should be visible based on conditional rules
 */
export function shouldShowElement(elementName, values) {
  const conditionalRules = lookupData.conditional_ui || {};
  const rule = conditionalRules[elementName];

  if (!rule || !rule.show_when) {
    return true; // Show by default if no rule
  }

  // Check all conditions in show_when
  for (const [key, value] of Object.entries(rule.show_when)) {
    // Handle array values (OR logic)
    if (Array.isArray(value)) {
      if (!value.includes(values[key])) {
        return false;
      }
    } else {
      if (values[key] !== value) {
        return false;
      }
    }
  }

  return true;
}

export { lookupData };
