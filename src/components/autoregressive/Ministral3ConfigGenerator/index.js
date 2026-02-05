import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Mistral 3 Configuration Generator
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
          { id: 'mi300x', label: 'MI300x', default: false },
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
      weights: {
        name: 'weights',
        title: 'Weights / Precision',
        items: [
          { id: 'fp8', label: 'FP8', default: true }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser mistral' : null
      }
    },

    modelConfigs: {
      small: {
        modelId: 'mistralai/Ministral-3-8B-Instruct-2512',
        tpByHardware: { mi300x: 1, mi325x: 1, mi355x: 1 },
        allowedWeights: ['fp8']
      },
      large: {
        modelId: 'mistralai/Ministral-3-14B-Instruct-2512',
        tpByHardware: { mi300x: 1, mi325x: 1, mi355x: 1 },
        allowedWeights: ['fp8']
      }
    },

    generateCommand: function (values) {
      const { hardware, model, weights } = values;

      const modelCfg = this.modelConfigs[model];
      if (!modelCfg) return `# Error: Unknown model selection: ${model}`;

      if (!modelCfg.allowedWeights.includes(weights)) {
        const allowed = modelCfg.allowedWeights.map(w => w.toUpperCase()).join(', ');
        return `# Error: ${modelCfg.modelId} only supports: ${allowed}\n# Please change "Weights / Precision" to a supported value.`;
      }

      const tp = modelCfg.tpByHardware[hardware];
      if (!tp) return `# Error: Unknown hardware platform: ${hardware}`;

      let cmd = 'python -m sglang.launch_server \\\n';


      cmd += `  --model ${modelCfg.modelId}`;

      if (tp > 1) {
        cmd += ` \\\n  --tp ${tp}`;
      }

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

export default Devstral2ConfigGenerator;
