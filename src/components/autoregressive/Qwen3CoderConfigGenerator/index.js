import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen3-Coder-480B Configuration Generator
 * Supports Qwen3-Coder-480B-A35B model with BF16 and FP8 quantization
 * Verified on AMD MI300X
 */
const Qwen3CoderConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'mi300x', label: 'MI300X', default: true }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', default: true },
          { id: 'fp8', label: 'FP8', default: false }
        ]
      }
    },

    modelConfigs: {
      '480b': {
        baseName: '480B-A35B',
        mi300x: { tp: 8, ep: 0 }
      }
    },

    generateCommand: function (values) {
      const { hardware, quantization } = values;

      const config = this.modelConfigs['480b'];
      const hwConfig = config[hardware];

      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }

      // Build model name
      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `Qwen/Qwen3-Coder-${config.baseName}-Instruct${quantSuffix}`;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      // TP is always 8 for this model
      cmd += ` \\\n  --tp ${hwConfig.tp}`;

      // FP8 requires EP=2 for MoE dimension alignment
      // moe_intermediate_size=2560, with tp=8 ep=1: 2560/8=320, 320%128!=0
      // with tp=8 ep=2: 2560/4=640, 640%128=0 ✓
      if (quantization === 'fp8') {
        cmd += ` \\\n  --ep 2`;
      }

      // Context length verified on MI300X
      cmd += ` \\\n  --context-length 8192`;

      // Page size for MoE models
      cmd += ` \\\n  --page-size 32`;

      // FP8 requires trust-remote-code
      if (quantization === 'fp8') {
        cmd += ` \\\n  --trust-remote-code`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen3CoderConfigGenerator;
