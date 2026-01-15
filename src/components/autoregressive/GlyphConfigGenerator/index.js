import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Glyph Configuration Generator
 * Supports Glyph model on AMD GPUs
 */
const GlyphConfigGenerator = () => {
  const config = {
    modelFamily: 'zai-org',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'mi300x', label: 'MI300X', default: true },
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

    modelConfig: {
      baseName: 'Glyph',
      mi300x: { tp: 4, bf16: true, fp8: true },
      mi325x: { tp: 4, bf16: true, fp8: true },
      mi355x: { tp: 2, bf16: true, fp8: true }
    },

    specialCommands: {},

    generateCommand: function (values) {
      const { hardware, quantization, reasoning, toolcall } = values;

      const hwConfig = this.modelConfig[hardware];
      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }

      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `${this.modelFamily}/${this.modelConfig.baseName}${quantSuffix}`;

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelName}`;
      cmd += ` \\\n  --tp-size ${hwConfig.tp}`;

      for (const [key, option] of Object.entries(this.options)) {
        if (key === 'hardware' || key === 'quantization') continue;

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

export default GlyphConfigGenerator;
