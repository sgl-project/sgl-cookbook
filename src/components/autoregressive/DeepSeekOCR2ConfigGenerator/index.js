import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

const DeepSeekOCR2ConfigGenerator = () => {
  const config = {
    modelFamily: 'deepseek-ai',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false },
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
      const { strategy } = values;

      const strategyArray = Array.isArray(strategy) ? strategy : [];

      // Model path
      let modelPath = 'deepseek-ai/DeepSeek-OCR-2';

      let cmd = 'sglang serve \\\n';
      cmd += `  --model-path ${modelPath}`;
      cmd += ` \\\n  --enable-multimodal`;

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

      cmd += ` \\\n  --host 0.0.0.0 \\\n  --port 30000`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default DeepSeekOCR2ConfigGenerator;
