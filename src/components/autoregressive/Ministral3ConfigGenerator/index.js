import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Ministral-3 Configuration Generator
 * Covers:
 * - mistralai/Ministral-3-14B-Instruct-2512
 * - mistralai/Ministral-3-8B-Instruct-2512
 */
const Ministral3ConfigGenerator = () => {
  const config = {
    modelFamily: 'mistralai',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'mi300x', label: 'MI300x', default: true },
          { id: 'mi325x', label: 'MI325x', default: false },
          { id: 'mi355x', label: 'MI355x', default: false }
        ]
      },
      model: {
        name: 'model',
        title: 'Model',
        items: [
          { id: 'small', label: 'Ministral-3-8B-Instruct-2512', default: true },
          { id: 'large', label: 'Ministral-3-14B-Instruct-2512', default: false }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'enabled', label: 'enabled', default: true },
          { id: 'disabled', label: 'disabled', default: false }
        ],
        commandRule: (value) => (value === 'enabled' ? '--tool-call-parser mistral' : null)
      }
    },

    modelConfigs: {
      small: {
        modelId: 'mistralai/Ministral-3-8B-Instruct-2512',
        tpByHardware: { mi300x: 1, mi325x: 1, mi355x: 1 }
      },
      large: {
        modelId: 'mistralai/Ministral-3-14B-Instruct-2512',
        tpByHardware: { mi300x: 1, mi325x: 1, mi355x: 1 }
      }
    },

    generateCommand: function (values) {
      const { hardware, model } = values;

      const modelCfg = this.modelConfigs[model];
      if (!modelCfg) return `# Error: Unknown model selection: ${model}`;

      const tp = modelCfg.tpByHardware[hardware];
      if (!tp) return `# Error: Unknown hardware platform: ${hardware}`;

      let cmd = 'sglang serve \\\n';

      cmd += `  --model ${modelCfg.modelId}`;

      if (tp > 1) {
        cmd += ` \\\n  --tp ${tp}`;
      }

      // Add trust-remote-code (required for Kimi-Linear)
      cmd += ` \\\n  --trust-remote-code`;

      // Append optional flags (e.g. tool calling)
      for (const [key, option] of Object.entries(this.options)) {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) cmd += ` \\\n  ${rule}`;
        }
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Ministral3ConfigGenerator;
