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
          { id: 'h100', label: 'H100', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', subtitle: 'Full Weights', default: false },
          { id: 'fp8', label: 'FP8', subtitle: 'High Throughput', default: true }
        ]
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
        // dp value is dynamic (matches tp), handled in generateCommand
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

    // BF16 always needs 2x GPUs compared to FP8
    modelConfigs: {
      h100: { fp8: { tp: 16, mem: 0.85 }, bf16: { tp: 32, mem: 0.85 } },
      h200: { fp8: { tp: 8, mem: 0.85 }, bf16: { tp: 16, mem: 0.85 } },
      b200: { fp8: { tp: 8, mem: 0.9 }, bf16: { tp: 16, mem: 0.9 } }
    },

    generateCommand: function (values) {
      const { hardware, quantization } = values;

      const modelSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `${this.modelFamily}/GLM-5${modelSuffix}`;

      // BF16 needs 2x GPUs compared to FP8
      const hwConfig = this.modelConfigs[hardware][quantization];
      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      // TP setting
      cmd += ` \\\n  --tp ${tpValue}`;

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

      // Memory fraction based on hardware and quantization
      cmd += ` \\\n  --mem-fraction-static ${memFraction}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default GLM5ConfigGenerator;
