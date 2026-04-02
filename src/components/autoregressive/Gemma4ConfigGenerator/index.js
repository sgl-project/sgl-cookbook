import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Gemma 4 Configuration Generator
 * Supports google/gemma-4-E2B-it, gemma-4-E4B-it, gemma-4-31B-it, gemma-4-26B-A4B-it
 *
 * SGLang auto-selects the Triton attention backend for all variants
 *
 * GPU requirements (BF16):
 *   E2B:       1x H200 (tp=1)
 *   E4B:       1x H200 (tp=1)
 *   31B:       2x H200 (tp=2), 1x MI300X (tp=1)
 *   26B-A4B:   1x H200 (tp=1), 1x MI300X (tp=1)
 */
const Gemma4ConfigGenerator = () => {
  const config = {
    modelId: 'google/gemma-4-E4B-it',

    options: {
      modelSize: {
        name: 'modelSize',
        title: 'Model Variant',
        items: [
          { id: 'e2b', label: 'E2B (~2B)', default: false },
          { id: 'e4b', label: 'E4B (~4B)', default: true },
          { id: '31b', label: '31B (Dense)', default: false },
          { id: '26b-a4b', label: '26B-A4B (MoE)', default: false },
        ]
      },
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        getDynamicItems: (values) => {
          const size = values.modelSize;
          const showMI300X = size === '31b' || size === '26b-a4b';
          return [
            { id: 'h200', label: 'H200', default: true },
            { id: 'b200', label: 'B200', default: false },
            { id: 'mi300x', label: 'MI300X', default: false, disabled: !showMI300X },
          ];
        }
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser gemma4' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser gemma4' : null
      },
    },

    modelConfigs: {
      h200: {
        e2b: { tp: 1, mem: 0.85 },
        e4b: { tp: 1, mem: 0.85 },
        '31b': { tp: 2, mem: 0.85 },
        '26b-a4b': { tp: 1, mem: 0.85 },
      },
      b200: {
        e2b: { tp: 1, mem: 0.9 },
        e4b: { tp: 1, mem: 0.9 },
        '31b': { tp: 1, mem: 0.9 },
        '26b-a4b': { tp: 1, mem: 0.9 },
      },
      mi300x: {
        '31b': { tp: 1, mem: 0.80 },
        '26b-a4b': { tp: 1, mem: 0.80 },
      },
    },

    generateCommand: function (values) {
      const { hardware, modelSize } = values;

      const hwConfig = this.modelConfigs[hardware]?.[modelSize];
      if (!hwConfig) return `# Error: Unknown hardware/model combination`;

      const { tp, mem } = hwConfig;

      const modelNames = {
        'e2b': 'google/gemma-4-E2B-it',
        'e4b': 'google/gemma-4-E4B-it',
        '31b': 'google/gemma-4-31B-it',
        '26b-a4b': 'google/gemma-4-26B-A4B-it',
      };

      let cmd = `sglang serve --model-path ${modelNames[modelSize]}`;
      if (tp > 1) {
        cmd += ` \\\n  --tp ${tp}`;
      }

      Object.entries(this.options).forEach(([key, option]) => {
        if (key === 'modelSize' || key === 'hardware') return;
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) cmd += ` \\\n  ${rule}`;
        }
      });

      cmd += ` \\\n  --mem-fraction-static ${mem}`;
      cmd += ` \\\n  --host 0.0.0.0 --port 30000`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Gemma4ConfigGenerator;
