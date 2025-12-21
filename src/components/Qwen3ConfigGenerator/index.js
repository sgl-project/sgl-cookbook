import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * Qwen3 Configuration Generator
 * Supports multiple Qwen3 model sizes (235B, 30B, 32B, 14B, 8B, 4B, 1.7B, 0.6B)
 */
const Qwen3ConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h100', label: 'H100', default: false },
          { id: 'h200', label: 'H200', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '235b', label: '235B', subtitle: 'MOE', default: true },
          { id: '30b', label: '30B', subtitle: 'MOE', default: false },
          { id: '32b', label: '32B', subtitle: 'Dense', default: false },
          { id: '14b', label: '14B', subtitle: 'Dense', default: false },
          { id: '8b', label: '8B', subtitle: 'Dense', default: false },
          { id: '4b', label: '4B', subtitle: 'Dense', default: false },
          { id: '1.7b', label: '1.7B', subtitle: 'Dense', default: false },
          { id: '0.6b', label: '0.6B', subtitle: 'Dense', default: false }
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
      capability: {
        name: 'capability',
        title: 'Capabilities',
        items: [
          { id: 'base', label: 'Base', default: true },
          { id: 'instruct', label: 'Instruct', default: false },
          { id: 'thinking', label: 'Thinking', default: false }
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
      }
    },

    modelConfigs: {
      '235b': {
        baseName: '235B-A22B',
        isMOE: true,
        hasThinking: true,
        hasInstruct: true,
        h100: { tp: 8, ep: 0, bf16: true, fp8: true },
        h200: { tp: 8, ep: 0, bf16: true, fp8: true },
        b200: { tp: 8, ep: 0, bf16: true, fp8: true }
      },
      '30b': {
        baseName: '30B-A3B',
        isMOE: true,
        hasThinking: true,
        hasInstruct: true,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '32b': {
        baseName: '32B',
        isMOE: false,
        hasThinking: false,
        hasInstruct: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '14b': {
        baseName: '14B',
        isMOE: false,
        hasThinking: false,
        hasInstruct: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '8b': {
        baseName: '8B',
        isMOE: false,
        hasThinking: false,
        hasInstruct: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '4b': {
        baseName: '4B',
        isMOE: false,
        hasThinking: true,
        hasInstruct: true,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '1.7b': {
        baseName: '1.7B',
        isMOE: false,
        hasThinking: false,
        hasInstruct: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '0.6b': {
        baseName: '0.6B',
        isMOE: false,
        hasThinking: false,
        hasInstruct: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      }
    },

    specialCommands: {
      'h100-235b-bf16-instruct': '# Error: Model is too large, cannot fit into 8*H100\n# Please use H200 (141GB) or select FP8 quantization',
      'h100-235b-bf16-thinking': '# Error: Model is too large, cannot fit into 8*H100\n# Please use H200 (141GB) or select FP8 quantization'
    },

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize, quantization, capability } = values;
      const commandKey = `${hardware}-${modelSize}-${quantization}-${capability}`;

      if (this.specialCommands[commandKey]) {
        return this.specialCommands[commandKey];
      }

      const config = this.modelConfigs[modelSize];
      if (!config) {
        return `# Error: Unknown model size: ${modelSize}`;
      }

      const hwConfig = config[hardware];
      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }

      if (capability === 'thinking' && !config.hasThinking) {
        return `# Error: Model doesn't support thinking capabilities\n# Please select "Base" for Capabilities or choose a model that supports thinking capabilities`;
      }
      if (capability === 'instruct' && !config.hasInstruct) {
        return `# Error: Model doesn't support instruct capabilities\n# Please select "Base" for Capabilities or choose a model that supports instruct capabilities`;
      }

      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const capabilitySuffix = capability === 'thinking' ? '-Thinking-2507' : (capability === 'instruct' ? '-Instruct-2507' : '');
      const modelName = `Qwen/Qwen3-${config.baseName}${capabilitySuffix}${quantSuffix}`;

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

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen3ConfigGenerator;
