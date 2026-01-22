import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * GLM-4.6V Configuration Generator
 * Supports GLM-4.6V (106B) and GLM-4.6V-Flash (9B) models
 */
const GLM46VConfigGenerator = () => {
  const config = {
    modelFamily: 'GLM',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h100', label: 'H100', default: false },
          { id: 'h200', label: 'H200', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '106b', label: '106B', subtitle: 'GLM-4.6V', default: true },
          { id: '9b', label: '9B', subtitle: 'GLM-4.6V-Flash', default: false }
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
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'enabled', label: 'Enabled', default: true },
          { id: 'disabled', label: 'Disabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser glm45' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'enabled', label: 'Enabled', default: true },
          { id: 'disabled', label: 'Disabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser glm45' : null
      }
    },

    modelConfigs: {
      '106b': {
        baseName: 'GLM-4.6V',
        h100: { tp: 8, bf16: true, fp8: true },
        h200: { tp: 8, bf16: true, fp8: true },
        b200: { tp: 8, bf16: true, fp8: true },
        mi300x: { tp: 8, bf16: true, fp8: true },
        mi355x: { tp: 8, bf16: true, fp8: true }
      },
      '9b': {
        baseName: 'GLM-4.6V-Flash',
        h100: { tp: 1, bf16: true, fp8: true },
        h200: { tp: 1, bf16: true, fp8: true },
        b200: { tp: 1, bf16: true, fp8: true },
        mi300x: { tp: 1, bf16: true, fp8: true },
        mi355x: { tp: 1, bf16: true, fp8: true }
      }
    },

    specialCommands: {},

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize, quantization, reasoning, toolcall } = values;
      const commandKey = `${hardware}-${modelSize}-${quantization}`;

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

      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `zai-org/${config.baseName}${quantSuffix}`;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
        if (hwConfig.tp === 8) {
          cmd += ` \\\n  --mm-enable-dp-encoder`;
        }
      }

      for (const [key, option] of Object.entries(this.options)) {
        if (key === 'host' || key === 'port') continue;

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

export default GLM46VConfigGenerator;
