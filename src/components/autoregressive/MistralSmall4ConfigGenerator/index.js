import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Mistral Small 4 Configuration Generator
 * Supports mistralai/Mistral-Small-4-119B-2602
 * 119B MoE (128 experts, 4 active = 6.5B activated params), BF16
 *
 * GPU requirements (BF16, ~238 GB weights):
 *   H200 (80 GB): tp=4 (4× H200 = 320 GB)
 *   B200 (192 GB): tp=2 (2× B200 = 384 GB)
 */
const MistralSmall4ConfigGenerator = () => {
  const config = {
    modelId: 'mistralai/Mistral-Small-4-119B-2602',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false },
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser mistral' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser mistral' : null
      },
    },

    modelConfigs: {
      h200: { bf16: { tp: 4, mem: 0.85 } },
      b200: { bf16: { tp: 2, mem: 0.85 } },
    },

    generateCommand: function (values) {
      const { hardware } = values;

      const hwConfig = this.modelConfigs[hardware];
      if (!hwConfig) return `# Error: Unknown hardware platform: ${hardware}`;

      const { tp, mem } = hwConfig.bf16;

      let cmd = `sglang serve --model-path ${this.modelId}`;
      cmd += ` \\\n  --tp ${tp}`;

      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) cmd += ` \\\n  ${rule}`;
        }
      });

      cmd += ` \\\n  --mem-fraction-static ${mem}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default MistralSmall4ConfigGenerator;
