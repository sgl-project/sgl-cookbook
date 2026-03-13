import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Kimi-K2.5 Configuration Generator
 * Supports Kimi-K2.5 multimodal agentic model with reasoning and tool calling
 *
 * GPU requirements:
 *   H200: tp=8
 *   B300: tp=8
 *   MI300X: tp=4 (64 heads / 4 = 16 heads per GPU, AITER MLA requires heads_per_gpu % 16 == 0)
 *   MI325X: tp=4 (same constraint as MI300X)
 *   MI350X: tp=4 (same constraint as MI300X)
 *   MI355X: tp=4 (same constraint as MI300X)
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
      const { hardware } = values;
      const isAMD = hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi350x' || hardware === 'mi355x';

      const modelName = `${this.modelFamily}/Kimi-K2.5`;
      const hwConfig = this.modelConfigs[hardware];
      const tpValue = hwConfig.tp;

      let cmd = '';

      // AMD ROCm environment variables
      if (isAMD) {
        cmd += 'SGLANG_USE_AITER=1 SGLANG_ROCM_FUSED_DECODE_MLA=0 \\\n';
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
          const rule = option.commandRule(values[key]);
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
