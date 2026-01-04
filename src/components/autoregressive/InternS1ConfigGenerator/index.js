import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Intern-S1 Configuration Generator
 * Supports Intern-S1 (235B MOE) and Intern-S1-mini (8B Dense) models
 */
const InternS1ConfigGenerator = () => {
  const config = {
    modelFamily: 'Intern',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h100', label: 'H100', default: false },
          { id: 'h200', label: 'H200', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: 'S1', label: '235b', subtitle: 'MOE', default: true },
          { id: 'S1-mini', label: '8b', subtitle: 'Dense', default: false }
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
      reasoning_parser: {
        name: 'reasoning_parser',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ]
      }
    },

    modelConfigs: {
      'S1': {
        baseName: 'S1',
        isMOE: true,
        h100: { tp: 8, ep: 0, bf16: true, fp8: true },
        h200: { tp: 8, ep: 0, bf16: true, fp8: true },
        b200: { tp: 8, ep: 0, bf16: true, fp8: true }
      },
      'S1-mini': {
        baseName: 'S1-mini',
        isMOE: true,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      }
    },

    generateCommand: function(values) {
      const { hardware, modelsize, quantization, reasoning_parser, toolcall } = values;

      const modelConfig = this.modelConfigs[modelsize];
      if (!modelConfig) {
        return `# Error: Unknown model size: ${modelsize}`;
      }

      const hwConfig = modelConfig[hardware];
      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }

      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `internlm/Intern-${modelConfig.baseName}${quantSuffix}`;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
      }

      let ep = hwConfig.ep;
      if (quantization === 'fp8' && hwConfig.tp === 8) {
        ep = 2;
      }

      if (ep > 0) {
        cmd += ` \\\n  --ep ${ep}`;
      }

      if (reasoning_parser === 'enabled') {
        cmd += ` \\\n  --reasoning-parser interns1`;
      }

      if (toolcall === 'enabled') {
        cmd += ` \\\n  --tool-call-parser interns1`;
      }

      cmd += ` \\\n  --trust-remote-code`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default InternS1ConfigGenerator;
