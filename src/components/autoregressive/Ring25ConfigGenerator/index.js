import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Ring-2.5-1T Configuration Generator
 * Supports Ring-2.5-1T 1T parameter model deployment configuration
 * with FP8 quantization, reasoning parser, and tool calling
 *
 * GPU requirements:
 *   H200: tp=8
 *   B200: tp=8
 */
const Ring25ConfigGenerator = () => {
  const config = {
    modelFamily: 'inclusionAI',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false },
          { id: 'gb200', label: 'GB200', default: false },
          { id: 'gb300', label: 'GB300', default: false }
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser deepseek-r1' : null
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
      h200: { fp8: { tp: 8 } },
      b200: { fp8: { tp: 8 } },
      gb200: { fp8: { tp: 4 } },
      gb300: { fp8: { tp: 4 } }
    },

    generateCommand: function (values) {
      const { hardware } = values;

      const modelName = `${this.modelFamily}/Ring-2.5-1T`;
      const hwConfig = this.modelConfigs[hardware].fp8;
      const tpValue = hwConfig.tp;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelName}`;
      cmd += ` \\\n  --tp ${tpValue}`;
      cmd += ' \\\n  --trust-remote-code';

      // Apply commandRule from all options
      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Ring25ConfigGenerator;
