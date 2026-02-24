import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen3.5-397B-A17B Configuration Generator
 * Supports Qwen3.5 397B (17B active) MoE VLM deployment configuration
 * with reasoning parser, tool calling, speculative decoding, and quantization options
 *
 * GPU requirements (BF16):
 *   H100: tp=16 (model ~800GB in BF16, each rank needs ~100GB > 80GB)
 *   H200: tp=8
 *   B200: tp=8
 *
 * GPU requirements (FP8):
 *   H100: tp=8 (model ~400GB in FP8, each rank needs ~50GB < 80GB)
 *   H200: tp=8
 *   B200: tp=8
 */
const Qwen35ConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h100', label: 'H100', default: true },
          { id: 'h200', label: 'H200', default: false },
          { id: 'b200', label: 'B200', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', default: false },
          { id: 'fp8', label: 'FP8', default: true }
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser qwen3' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen3_coder' : null
      },
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding (MTP)',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--speculative-algo NEXTN \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4' : null
      }
    },

    modelConfigs: {
      h100: { bf16: { tp: 16, mem: 0.8 }, fp8: { tp: 8, mem: 0.8 } },
      h200: { bf16: { tp: 8,  mem: 0.8 }, fp8: { tp: 8, mem: 0.8 } },
      b200: { bf16: { tp: 8,  mem: 0.8 }, fp8: { tp: 8, mem: 0.8 } }
    },

    generateCommand: function (values) {
      const { hardware, quantization } = values;

      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `${this.modelFamily}/Qwen3.5-397B-A17B${quantSuffix}`;

      const hwConfig = this.modelConfigs[hardware][quantization];
      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      // TP setting
      cmd += ` \\\n  --tp ${tpValue}`;

      // Apply commandRule from all options except quantization (handled via model name)
      Object.entries(this.options).forEach(([key, option]) => {
        if (key === 'quantization') return;
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      // Memory fraction based on hardware
      cmd += ` \\\n  --mem-fraction-static ${memFraction}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen35ConfigGenerator;
