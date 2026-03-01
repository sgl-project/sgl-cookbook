import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen3-Coder-Next Configuration Generator
 * Supports Qwen3-Coder-Next 80B (3B activated) model
 */
const Qwen3CoderNextConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'h100', label: 'H100', default: false },
          { id: 'b200', label: 'B200', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', default: true },
          { id: 'fp8', label: 'FP8', default: false }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'enabled', label: 'Enabled', default: true },
          { id: 'disabled', label: 'Disabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen3_coder' : null
      },
      mambaCache: {
        name: 'mambaCache',
        title: 'Mamba Radix Cache',
        items: [
          { id: 'v1', label: 'V1', default: true },
          { id: 'v2', label: 'V2', default: false }
        ],
        commandRule: (value) => value === 'v2' ? '--mamba-scheduler-strategy extra_buffer \\\n  --page-size 64' : null
      }
    },

    modelConfigs: {
      default: {
        baseName: 'Qwen3-Coder-Next',
        h100: { bf16: { tp: 4 }, fp8: { tp: 2 } },
        h200: { bf16: { tp: 2 }, fp8: { tp: 1 } },
        b200: { bf16: { tp: 2 }, fp8: { tp: 1 } },
        mi300x: { bf16: { tp: 2 }, fp8: { tp: 1 } },
        mi325x: { bf16: { tp: 2 }, fp8: { tp: 1 } },
        mi355x: { bf16: { tp: 2 }, fp8: { tp: 1 } }
      }
    },

    generateCommand: function (values) {
      const { hardware, quantization } = values;

      const hwConfig = this.modelConfigs.default[hardware];
      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }

      const quantConfig = hwConfig[quantization];
      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `Qwen/${this.modelConfigs.default.baseName}${quantSuffix}`;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      // TP setting
      if (quantConfig.tp > 1) {
        cmd += ` \\\n  --tp ${quantConfig.tp}`;
      }

      // Apply commandRule from all options
      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule && values[key]) {
          const additionalCmd = option.commandRule(values[key], values);
          if (additionalCmd) {
            cmd += ` \\\n  ${additionalCmd}`;
          }
        }
      });

      // AMD GPUs require triton attention backend
      if (hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x') {
        cmd += ` \\\n  --attention-backend triton`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen3CoderNextConfigGenerator;
