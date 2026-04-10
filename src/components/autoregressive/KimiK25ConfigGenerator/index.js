import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Kimi-K2.5 Configuration Generator
 * Supports Kimi-K2.5 multimodal agentic model with reasoning, tool calling,
 * quantization (INT4 / NVFP4), and speculative decoding (EAGLE3)
 *
 * GPU requirements:
 *   H200: tp=8
 *   B300: tp=8
 *   MI300X: tp=4 (64 heads / 4 = 16 heads per GPU, AITER MLA requires heads_per_gpu % 16 == 0)
 *   MI325X: tp=4 (same constraint as MI300X)
 *   MI350X: tp=4 (same constraint as MI300X)
 *   MI355X: tp=4 (same constraint as MI300X)
 *
 * NVFP4 quantization is only supported on NVIDIA Blackwell (B300).
 * Speculative decoding is only supported on H200 and B300.
 */
const KimiK25ConfigGenerator = () => {
  const config = {
    modelFamily: 'moonshotai',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b300', label: 'B300', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi350x', label: 'MI350X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'int4', label: 'INT4', subtitle: 'initial model', default: true },
          { id: 'nvfp4', label: 'NVFP4', subtitle: 'Blackwell only', default: false }
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser kimi_k2' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser kimi_k2' : null
      },
      dpattention: {
        name: 'dpattention',
        title: 'DP Attention',
        items: [
          { id: 'disabled', label: 'Disabled', subtitle: 'Low Latency', default: true },
          { id: 'enabled', label: 'Enabled', subtitle: 'High Throughput', default: false }
        ],
        commandRule: null
      },
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value, allValues) => {
          if (value !== 'enabled') return null;
          if (allValues.hardware !== 'h200' && allValues.hardware !== 'b300') return null;

          return '--speculative-algorithm EAGLE3 \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4 \\\n  --speculative-draft-model-path lightseekorg/kimi-k2.5-eagle3';
        }
      }
    },

    modelConfigs: {
      h200: { tp: 8 },
      b300: { tp: 8 },
      mi300x: { tp: 4 },
      mi325x: { tp: 4 },
      mi350x: { tp: 4 },
      mi355x: { tp: 4 }
    },

    generateCommand: function (values) {
      const { hardware, quantization, speculative } = values;
      const isAMD = hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi350x' || hardware === 'mi355x';

      // NVFP4 is only supported on NVIDIA Blackwell (B300)
      if (quantization === 'nvfp4' && hardware !== 'b300') {
        return '# NVFP4 quantization is only supported on NVIDIA Blackwell GPUs (B300)';
      }

      // Speculative decoding only supported on H200 and B300
      if (speculative === 'enabled' && hardware !== 'h200' && hardware !== 'b300') {
        return '# Speculative Decoding for Kimi-K2.5 is only supported on H200 and B300';
      }

      // Model path depends on quantization
      const modelName = quantization === 'nvfp4'
        ? 'nvidia/Kimi-K2.5-NVFP4'
        : `${this.modelFamily}/Kimi-K2.5`;

      const hwConfig = this.modelConfigs[hardware];
      const tpValue = hwConfig.tp;

      let cmd = '';

      // AMD ROCm environment variables
      if (isAMD) {
        cmd += 'SGLANG_USE_AITER=1 SGLANG_ROCM_FUSED_DECODE_MLA=0 ';
      }

      // Speculative decoding env var
      if (speculative === 'enabled') {
        cmd += 'SGLANG_ENABLE_SPEC_V2=1 ';
      }

      // If we added any env vars above, break to a new line for readability
      if (isAMD || speculative === 'enabled') {
        cmd += '\\\n';
      }

      cmd += 'sglang serve \\\n';
      cmd += `  --model-path ${modelName}`;
      cmd += ` \\\n  --tp ${tpValue}`;
      cmd += ' \\\n  --trust-remote-code';

      // DP Attention: --dp matches --tp
      if (values.dpattention === 'enabled') {
        cmd += ` \\\n  --dp ${tpValue} \\\n  --enable-dp-attention`;
      }

      // Apply commandRule from all options
      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key], values);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      // AMD: FP8 KV cache for memory efficiency
      if (isAMD) {
        cmd += ` \\\n  --kv-cache-dtype fp8_e4m3`;
      }

      cmd += ' \\\n  --host 0.0.0.0 \\\n  --port 30000';

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default KimiK25ConfigGenerator;
