import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * LLaDA 2.1 Configuration Generator
 * Supports LLaDA2.1-mini (16B MoE) and LLaDA2.1-flash (100B MoE) deployment configuration
 */
const LLaDA21ConfigGenerator = () => {
  const config = {
    modelFamily: 'inclusionAI',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h100', label: 'H100', default: true },
          { id: 'h200', label: 'H200', default: false },
          { id: 'b200', label: 'B200', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: 'mini', label: 'Mini (16B)', subtitle: 'MoE', default: true },
          { id: 'flash', label: 'Flash (100B)', subtitle: 'MoE', default: false }
        ]
      }
    },

    generateCommand: function(values) {
      const { hardware, modelsize } = values;

      // Model path
      const modelName = modelsize === 'mini' ? 'LLaDA2.1-mini' : 'LLaDA2.1-flash';
      const modelPath = `${this.modelFamily}/${modelName}`;

      // Determine TP size based on model and hardware
      let tpSize;
      if (modelsize === 'mini') {
        tpSize = 1;
      } else {
        // flash (100B MoE)
        if (hardware === 'b200') {
          tpSize = 2;
        } else {
          tpSize = 4;
        }
      }

      // Build command args
      const args = [];
      args.push(`--model-path ${modelPath}`);
      args.push(`--dllm-algorithm JointThreshold`);
      args.push(`--tp ${tpSize}`);
      args.push(`--trust-remote-code`);
      args.push(`--mem-fraction-static 0.8`);
      args.push(`--max-running-requests 1`);
      args.push(`--attention-backend flashinfer`);

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  ${args.join(' \\\n  ')}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default LLaDA21ConfigGenerator;
