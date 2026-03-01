import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen3-Next Configuration Generator
 * Supports Qwen3-Next 80B model with speculative decoding option
 */
const Qwen3NextConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h200', label: 'H200', default: false },
          { id: 'h100', label: 'H100', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '80b', label: '80B', subtitle: 'MOE', default: true },
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', subtitle: 'Full Weights', default: true },
          { id: 'fp8', label: 'FP8', subtitle: 'High Throughput', default: false }
        ]
      },
      thinking: {
        name: 'thinking',
        title: 'Thinking Capabilities',
        items: [
          { id: 'instruct', label: 'Instruct', subtitle: 'General Purpose', default: true },
          { id: 'thinking', label: 'Thinking', subtitle: 'Reasoning / CoT', default: false }
        ],
        commandRule: (value) => value === 'thinking' ? '--reasoning-parser qwen3' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen' : null
      },
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4' : null
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
      '80b': {
        baseName: '80B-A3B',
        isMOE: true,
        h100: { tp: 4, ep: 0, bf16: true, fp8: true },
        h200: { tp: 2, ep: 0, bf16: true, fp8: true },
        b200: { tp: 2, ep: 0, bf16: true, fp8: true },
        mi300x: { tp: 2, ep: 0, bf16: true, fp8: true },
        mi325x: { tp: 2, ep: 0, bf16: true, fp8: true },
        mi355x: { tp: 2, ep: 0, bf16: true, fp8: true }
      }
    },

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize, quantization, thinking } = values;
      const commandKey = `${hardware}-${modelSize}-${quantization}-${thinking}`;

      const config = this.modelConfigs[modelSize];
      if (!config) {
        return `# Error: Unknown model size: ${modelSize}`;
      }

      const hwConfig = config[hardware];
      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }

      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const thinkingSuffix = thinking === 'thinking' ? '-Thinking' : '-Instruct';
      const modelName = `Qwen/Qwen3-Next-${config.baseName}${thinkingSuffix}${quantSuffix}`;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
      }

      let ep = hwConfig.ep;
      if (quantization === 'fp8' && hwConfig.tp === 8) {
        ep = 2;
      }

      if (ep > 0) {
        cmd += ` \\\n  --ep ${ep}`;
      }

      for (const [key, option] of Object.entries(this.options)) {

        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      }

      // AMD GPUs require triton attention backend
      if (hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x') {
        cmd += ` \\\n  --attention-backend triton`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen3NextConfigGenerator;
