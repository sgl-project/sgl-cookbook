import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Step3-VL-10B Configuration Generator
 * Supports Step3-VL-10B with BF16 and FP8 quantization
 */
const Step3VL10BConfigGenerator = () => {
  const config = {
    modelFamily: 'Step3-VL',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h100', label: 'H100', default: false },
          { id: 'h200', label: 'H200', default: false },
          { id: 'a100', label: 'A100', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '10b', label: '10B', subtitle: 'Dense', default: true }
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
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser hermes' : null
      }
    },

    modelConfigs: {
      '10b': {
        baseName: '10B',
        isMOE: false,
        b200: { tp: 1, bf16: true, fp8: true },
        h100: { tp: 1, bf16: true, fp8: true },
        h200: { tp: 1, bf16: true, fp8: true },
        a100: { tp: 1, bf16: true, fp8: true }
      }
    },

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize, quantization } = values;

      const config = this.modelConfigs[modelSize];
      if (!config) {
        return `# Error: Unknown model size: ${modelSize}`;
      }

      const hwConfig = config[hardware];
      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }

      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `stepfun-ai/Step3-VL-10B${quantSuffix}`;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
      }

      cmd += ' \\\n  --host 0.0.0.0 \\\n  --port 30000';
      if (hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x') {
        cmd += ' \\\n  --attention-backend triton';
      }
      cmd += ' \\\n  --trust-remote-code';

      for (const [key, option] of Object.entries(this.options)) {
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

export default Step3VL10BConfigGenerator;
