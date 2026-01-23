import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Llama 3.3 70B Configuration Generator
 * Supports AMD GPUs (MI300X, MI325X, MI355X)
 */
const Llama33ConfigGenerator = () => {
  const config = {
    modelFamily: 'meta-llama',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'mi300x', label: 'MI300X', default: true },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
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
      toolcall: {
        name: 'toolcall',
        title: 'Tool Calling',
        items: [
          { id: 'enabled', label: 'Enabled', default: true },
          { id: 'disabled', label: 'Disabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser llama3' : null
      }
    },

    generateCommand: function(values) {
      const { hardware, quantization, toolcall } = values;

      // Select model based on quantization
      const modelPath = quantization === 'fp8'
        ? 'amd/Llama-3.3-70B-Instruct-FP8-KV'
        : 'meta-llama/Llama-3.3-70B-Instruct';

      // Build command
      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath} \\\n`;
      cmd += `  --tp 1`;

      // Add tool calling parser
      if (toolcall === 'enabled') {
        cmd += ' \\\n  --tool-call-parser llama3';
      }

      cmd += ' \\\n  --host 0.0.0.0 \\\n';
      cmd += '  --port 30000';

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Llama33ConfigGenerator;
