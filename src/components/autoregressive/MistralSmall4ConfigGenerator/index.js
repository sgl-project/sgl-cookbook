import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Mistral Small 4 Configuration Generator
 * Supports mistralai/Mistral-Small-4-119B-2603 (FP8)
 *         mistralai/Mistral-Small-4-119B-2603-NVFP4
 * 119B MoE (128 experts, 4 active = 6.5B activated params)
 *
 * GPU requirements (FP8, ~119 GB weights):
 *   H100 (80 GB):  tp=2 (2× H100 = 160 GB)
 *   H200 (141 GB): tp=2 (2× H200 = 282 GB)
 *   B200 (192 GB): tp=1
 *   B300 (288 GB): tp=1
 */
const MistralSmall4ConfigGenerator = () => {
  const config = {
    modelId: 'mistralai/Mistral-Small-4-119B-2603',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        getDynamicItems: (values) => {
          const isNvfp4 = values.quantization === 'fp4';
          return [
            { id: 'h100', label: 'H100', default: !isNvfp4, disabled: isNvfp4 },
            { id: 'h200', label: 'H200', default: false, disabled: isNvfp4 },
            { id: 'b200', label: 'B200', default: isNvfp4, disabled: false },
            { id: 'b300', label: 'B300', default: false, disabled: false },
          ];
        }
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'fp8', label: 'FP8', default: true },
          { id: 'fp4', label: 'NVFP4', subtitle: 'Blackwell only', default: false },
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
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding (EAGLE)',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--speculative-algorithm EAGLE \\\n  --speculative-draft-model-path mistralai/Mistral-Small-4-119B-2603-eagle \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4' : null
      },
    },

    modelConfigs: {
      h100: { fp8: { tp: 2 } },
      h200: { fp8: { tp: 2 } },
      b200: { fp8: { tp: 1 }, fp4: { tp: 1 } },
      b300: { fp8: { tp: 1 }, fp4: { tp: 1 } },
    },

    generateCommand: function (values) {
      const { hardware, quantization } = values;

      const hwConfig = this.modelConfigs[hardware]?.[quantization];
      if (!hwConfig) return `# Error: Unknown hardware/quantization combination`;

      const { tp } = hwConfig;

      const modelName = quantization === 'fp4'
        ? 'mistralai/Mistral-Small-4-119B-2603-NVFP4'
        : this.modelId;

      let cmd = `sglang serve --model-path ${modelName}`;
      cmd += ` \\\n  --tp ${tp}`;

      Object.entries(this.options).forEach(([key, option]) => {
        if (key === 'quantization' || key === 'hardware') return;
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) cmd += ` \\\n  ${rule}`;
        }
      });

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default MistralSmall4ConfigGenerator;
