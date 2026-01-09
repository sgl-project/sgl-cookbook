import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

const ErnieConfigGenerator = () => {
  const config = {
    modelFamily: 'baidu',

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
      strategy: {
        name: 'strategy',
        title: 'Deployment Strategy',
        type: 'checkbox',
        items: [
          { id: 'tp', label: 'TP', subtitle: 'Tensor Parallel', default: true, required: true },
          { id: 'dp', label: 'DP', subtitle: 'Data Parallel', default: false },
          { id: 'ep', label: 'EP', subtitle: 'Expert Parallel', default: false }
        ]
      }
    },

    generateCommand: function (values) {
      const { hardware, strategy } = values;

      const strategyArray = Array.isArray(strategy) ? strategy : [];

      // Model path
      const modelPath = 'baidu/ERNIE-4.5-21B-A3B-PT';

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath}`;

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

      cmd += ` \\\n  --host 0.0.0.0 \\\n  --port 8000`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default ErnieConfigGenerator;
