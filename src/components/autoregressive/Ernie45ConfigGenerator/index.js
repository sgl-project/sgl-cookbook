import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

const Ernie45ConfigGenerator = () => {
  const config = {
    modelFamily: 'baidu',

    options: {
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '21b', label: '21B', subtitle: 'A3B', default: true },
          { id: '300b', label: '300B', subtitle: 'A47B', default: false }
        ]
      },
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
          { id: 'dp', label: 'DP', subtitle: 'Data Parallel', default: false, disabledWhen: (values) => values.modelsize === '21b' },
          { id: 'ep', label: 'EP', subtitle: 'Expert Parallel', default: false, disabledWhen: (values) => values.modelsize === '21b' }
        ]
      }
    },

    generateCommand: function (values) {
      const { modelsize, hardware, strategy } = values;

      const strategyArray = Array.isArray(strategy) ? strategy : [];

      // Model path based on selected model size
      let modelPath;
      if (modelsize === '21b') {
        modelPath = 'baidu/ERNIE-4.5-21B-A3B-PT';
      } else if (modelsize === '300b') {
        modelPath = 'baidu/ERNIE-4.5-300B-A47B-PT';
      } else {
        modelPath = 'baidu/ERNIE-4.5-21B-A3B-PT'; // Default fallback
      }

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath}`;

      // Determine TP, DP, and EP values based on model size
      const tpValue = modelsize === '300b' ? 8 : 1;
      const dpValue = modelsize === '300b' ? 8 : null;
      const epValue = modelsize === '300b' ? 8 : null;

      // TP strategy
      if (strategyArray.includes('tp')) {
        cmd += ` \\\n  --tp ${tpValue}`;
      }

      // DP strategy (only valid for 300B)
      if (strategyArray.includes('dp') && modelsize === '300b') {
        cmd += ` \\\n  --dp ${dpValue} \\\n  --enable-dp-attention`;
      }

      // EP strategy (only valid for 300B)
      if (strategyArray.includes('ep') && modelsize === '300b') {
        cmd += ` \\\n  --ep ${epValue}`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Ernie45ConfigGenerator;
