import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * GLM-5 Configuration Generator
 * Supports GLM-5 744B (40B active) MoE model deployment configuration
 * with BF16/FP8 quantization, reasoning parser, DP attention, and speculative decoding
 *
 * GPU requirements (BF16 needs 2x GPUs compared to FP8):
 *   H100: FP8 tp=16, BF16 tp=32
 *   H200: FP8 tp=8, BF16 tp=16
 *   B200: FP8 tp=8, BF16 tp=16
 *   MI300X/MI325X: BF16 tp=8
 *   MI355X: BF16 tp=8
 */
const GLM5ConfigGenerator = () => {
  const config = {
    modelFamily: 'zai-org',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false },
          { id: 'h100', label: 'H100', default: false },
          { id: 'mi300x', label: 'MI300X/MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        getDynamicItems: (values) => {
          const hw = values.hardware;
          if (hw === 'mi300x' || hw === 'mi355x') {
            return [
              { id: 'bf16', label: 'BF16', subtitle: 'Full Weights', default: true }
            ];
          }
          return [
            { id: 'bf16', label: 'BF16', subtitle: 'Full Weights', default: false },
            { id: 'fp8', label: 'FP8', subtitle: 'High Throughput', default: true }
          ];
        }
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser glm45' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser glm47' : null
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
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4' : null
      }
    },

    modelConfigs: {
      h100: { fp8: { tp: 16, mem: 0.85 }, bf16: { tp: 32, mem: 0.85 } },
      h200: { fp8: { tp: 8, mem: 0.85 }, bf16: { tp: 16, mem: 0.85 } },
      b200: { fp8: { tp: 8, mem: 0.9 }, bf16: { tp: 16, mem: 0.9 } },
      mi300x: { bf16: { tp: 8, mem: 0.80 } },
      mi355x: { bf16: { tp: 8, mem: 0.80 } }
    },

    generateCommand: function (values) {
      const { hardware, quantization } = values;
      const isAMD = hardware === 'mi300x' || hardware === 'mi355x';

      const effectiveQuant = isAMD ? 'bf16' : quantization;
      const modelSuffix = effectiveQuant === 'fp8' ? '-FP8' : '';
      const modelName = `${this.modelFamily}/GLM-5${modelSuffix}`;

      const hwConfig = this.modelConfigs[hardware][effectiveQuant];
      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      cmd += ` \\\n  --tp ${tpValue}`;

      if (isAMD) {
        cmd += ' \\\n  --trust-remote-code';
        cmd += ' \\\n  --nsa-prefill-backend tilelang';
        cmd += ' \\\n  --nsa-decode-backend tilelang';
        cmd += ' \\\n  --chunked-prefill-size 131072';
        cmd += ' \\\n  --watchdog-timeout 1200';
      }

      if (values.dpattention === 'enabled') {
        cmd += ` \\\n  --dp ${tpValue} \\\n  --enable-dp-attention`;
      }

      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      cmd += ` \\\n  --mem-fraction-static ${memFraction}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default GLM5ConfigGenerator;
