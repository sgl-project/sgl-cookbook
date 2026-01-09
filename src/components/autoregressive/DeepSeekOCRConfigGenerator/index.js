import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

const DeepSeekOCRConfigGenerator = () => {
  const config = {
    modelFamily: 'deepseek-ai',

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
          { id: 'fp16', label: 'FP16', default: true },
        ]
      },
      strategy: {
        name: 'strategy',
        title: 'Deployment Strategy',
        type: 'checkbox',
        items: [
          { id: 'tp', label: 'TP', subtitle: 'Tensor Parallel', default: true, required: true },
          { id: 'dp', label: 'DP', subtitle: 'Data Parallel', default: false },
          { id: 'ep', label: 'EP', subtitle: 'Expert Parallel', default: false }
        ]
      },
    },

    generateCommand: function (values) {
      const { hardware, quantization, strategy } = values;

      const strategyArray = Array.isArray(strategy) ? strategy : [];

      // Validation checks
      // Check MI300X compatibility - MI300X + DeepSeek-OCR only supports FP16 quantization
      if ((hardware === 'mi300x') && quantization !== 'fp16') {
        return '# Error: MI300X + DeepSeek-OCR only supports FP16 quantization\n# Please select FP16 quantization';
      }

      // Model path
      let modelPath = 'deepseek-ai/DeepSeek-OCR';

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath}`;
      cmd += ` \\\n  --dtype float16`;

      // TP strategy
      if (strategyArray.includes('tp')) {
        cmd += ` \\\n  --tp 1`;
      }

      // DP strategy
      if (strategyArray.includes('dp')) {
        cmd += ` \\\n  --dp 1 \\\n  --enable-dp-attention`;
      }

      // EP strategy
      if (strategyArray.includes('ep')) {
        cmd += ` \\\n  --ep 1`;
      }

      cmd += ` \\\n  --enable-symm-mem # Optional: improves performance, but may be unstable`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default DeepSeekOCRConfigGenerator;
