import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Devstral 2 Configuration Generator
 * Covers:
 * - mistralai/Devstral-Small-2-24B-Instruct-2512
 * - mistralai/Devstral-2-123B-Instruct-2512 (FP8 weights)
 */
const Devstral2ConfigGenerator = () => {
  const config = {
    modelFamily: 'Mistral',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h200', label: 'H200', default: false },
          { id: 'h100', label: 'H100', default: false },
          { id: 'mi300x', label: 'mi300x', default: false },
          { id: 'mi325x', label: 'mi325x', default: false },
          { id: 'mi355x', label: 'mi355x', default: false },
        ]
      },
      model: {
        name: 'model',
        title: 'Model',
        items: [
          { id: 'small', label: 'Devstral Small 2 (24B)', default: true },
          { id: 'large', label: 'Devstral 2 (123B)', default: false }
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
        modelId: 'mistralai/Devstral-Small-2-24B-Instruct-2512',
        tpByHardware: { h100: 1, h200: 1, b200: 1 },
        tpByHardware: { mi300x: 1, mi325x: 1, mi355x: 1 },
        allowedWeights: ['fp8']
      },
      large: {
        modelId: 'mistralai/Devstral-2-123B-Instruct-2512',
        tpByHardware: { h100: 4, h200: 2, b200: 2 },
        tpByHardware: { mi300x: 4, mi325x: 2, mi355x: 2 },
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
