import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Kimi-K2.5 Configuration Generator
 * Supports Kimi-K2.5 multimodal agentic model with reasoning and tool calling
 *
 * GPU requirements:
 *   H200: tp=8
 *   B300: tp=8
 */
const KimiK25ConfigGenerator = () => {
  const config = {
    modelFamily: 'moonshotai',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b300', label: 'B300', default: false }
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser kimi_k2' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser kimi_k2' : null
      },
      dpattention: {
        name: 'dpattention',
        title: 'DP Attention',
        items: [
          { id: 'disabled', label: 'Disabled', subtitle: 'Low Latency', default: true },
          { id: 'enabled', label: 'Enabled', subtitle: 'High Throughput', default: false }
        ],
        commandRule: null
      }
    },

    modelConfigs: {
      h200: { tp: 8 },
      b300: { tp: 8 }
    },

    generateCommand: function (values) {
      const { hardware } = values;

      const modelName = `${this.modelFamily}/Kimi-K2.5`;
      const hwConfig = this.modelConfigs[hardware];
      const tpValue = hwConfig.tp;

      let cmd = 'sglang serve \\\n';
      cmd += `  --model-path ${modelName}`;
      cmd += ` \\\n  --tp ${tpValue}`;
      cmd += ' \\\n  --trust-remote-code';

      // DP Attention: --dp matches --tp
      if (values.dpattention === 'enabled') {
        cmd += ` \\\n  --dp ${tpValue} \\\n  --enable-dp-attention`;
      }

      // Apply commandRule from all options
      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      cmd += ' \\\n  --host 0.0.0.0 \\\n  --port 30000';

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default KimiK25ConfigGenerator;
