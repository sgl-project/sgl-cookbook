import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen3-Coder Configuration Generator
 * Supports Qwen3-Coder-480B-A35B and Qwen3-Coder-30B-A3B models
 * Verified on AMD MI300X, MI325X, MI355X and NVIDIA B200, GB200
 */
const Qwen3CoderConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'mi300x', label: 'MI300X', default: true },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false },
          { id: 'b200', label: 'B200', default: false },
          { id: 'gb200', label: 'GB200', default: false }
        ]
      },
      modelSize: {
        name: 'modelSize',
        title: 'Model Size',
        items: [
          { id: '480b', label: '480B', subtitle: 'MOE', default: true },
          { id: '30b', label: '30B', subtitle: 'MOE', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', default: true },
          { id: 'fp8', label: 'FP8', default: false },
          { id: 'nvfp4', label: 'NVFP4', default: false }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen3_coder' : null
      }
    },

    modelConfigs: {
      '480b': {
        baseName: '480B-A35B',
        mi300x: { tp: 8 },
        mi325x: { tp: 8 },
        mi355x: { tp: 8 },
        b200: { tp: 8 },
        gb200: { tp: 4, ep: 4 }
      },
      '30b': {
        baseName: '30B-A3B',
        mi300x: { tp: 1 },
        mi325x: { tp: 1 },
        mi355x: { tp: 1 }
      }
    },

    generateCommand: function (values) {
      const { hardware, modelSize, quantization } = values;

      const isNvidia = hardware === 'b200' || hardware === 'gb200';

      const modelConfig = this.modelConfigs[modelSize];
      const hwConfig = modelConfig[hardware];

      if (!hwConfig) {
        return `# Configuration not available: ${modelSize.toUpperCase()} model has not been verified on ${hardware.toUpperCase()}.`;
      }

      // NVFP4 is only available on NVIDIA hardware
      if (quantization === 'nvfp4' && !isNvidia) {
        return `# NVFP4 quantization is only available on NVIDIA B200/GB200 hardware.`;
      }

      // BF16 not verified on NVIDIA
      if (quantization === 'bf16' && isNvidia) {
        return `# BF16 deployment on ${hardware.toUpperCase()} has not been verified yet. Please use FP8 or NVFP4.`;
      }

      // Build model name
      let modelName;
      if (quantization === 'nvfp4') {
        modelName = `nvidia/Qwen3-Coder-${modelConfig.baseName}-Instruct-NVFP`;
      } else {
        const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
        modelName = `Qwen/Qwen3-Coder-${modelConfig.baseName}-Instruct${quantSuffix}`;
      }

      let cmd = '';
      if (!isNvidia) {
        cmd += 'SGLANG_USE_AITER=0 ';
      }
      cmd += 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      // TP setting
      cmd += ` \\\n  --tp ${hwConfig.tp}`;

      // EP settings
      const ep = hwConfig.ep || (quantization === 'nvfp4' ? 1 : null);
      if (ep) {
        cmd += ` \\\n  --ep ${ep}`;
      } else if (modelSize === '480b' && quantization === 'fp8') {
        // FP8 requires EP=2 for 480B model due to MoE dimension alignment
        // moe_intermediate_size=2560, with tp=8 ep=1: 2560/8=320, 320%128!=0
        // with tp=8 ep=2: 2560/4=640, 640%128=0
        cmd += ` \\\n  --ep 2`;
      }

      // DP attention setting
      if (quantization === 'nvfp4') {
        cmd += ` \\\n  --enable-dp-attention`;
      }

      // MOE runner backend for NVIDIA
      if (isNvidia) {
        if (quantization === 'fp8' || quantization === 'nvfp4') {
          cmd += ` \\\n  --moe-runner-backend flashinfer_trtllm`;
        }
        if (quantization === 'nvfp4') {
          cmd += ` \\\n  --quantization modelopt_fp4`;
        }
      }

      // Apply commandRule from all options
      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule && values[key]) {
          // Pass the full values object so commandRule can access other option values
          const additionalCmd = option.commandRule(values[key], values);
          if (additionalCmd) {
            cmd += ` \\\n  ${additionalCmd}`;
          }
        }
      });

      // AMD-specific flags
      if (!isNvidia) {
        // Context length verified on MI300X/MI325X/MI355X
        cmd += ` \\\n  --context-length 8192`;

        // Page size for MoE models
        cmd += ` \\\n  --page-size 32`;

        // FP8 requires trust-remote-code
        if (quantization === 'fp8') {
          cmd += ` \\\n  --trust-remote-code`;
        }
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen3CoderConfigGenerator;
