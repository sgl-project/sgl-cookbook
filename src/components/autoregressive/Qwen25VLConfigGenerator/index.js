import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen2.5-VL Configuration Generator
 * Supports Qwen2.5-VL model sizes (72B, 32B, 7B, 3B)
 */
const Qwen25VLConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

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
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '72b', label: '72B', subtitle: 'Dense', default: true },
          { id: '32b', label: '32B', subtitle: 'Dense', default: false },
          { id: '7b', label: '7B', subtitle: 'Dense', default: false },
          { id: '3b', label: '3B', subtitle: 'Dense', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', default: true }
        ]
      }
    },

    modelConfigs: {
      '72b': {
        baseName: '72B',
        mi300x: { tp: 8, ep: 0 },
        mi325x: { tp: 8, ep: 0 },
        mi355x: { tp: 8, ep: 0 }
      },
      '32b': {
        baseName: '32B',
        mi300x: { tp: 2, ep: 0 },
        mi325x: { tp: 2, ep: 0 },
        mi355x: { tp: 2, ep: 0 }
      },
      '7b': {
        baseName: '7B',
        mi300x: { tp: 1, ep: 0 },
        mi325x: { tp: 1, ep: 0 },
        mi355x: { tp: 1, ep: 0 }
      },
      '3b': {
        baseName: '3B',
        mi300x: { tp: 1, ep: 0 },
        mi325x: { tp: 1, ep: 0 },
        mi355x: { tp: 1, ep: 0 }
      }
    },

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize } = values;

      const config = this.modelConfigs[modelSize];
      if (!config) {
        return `# Error: Unknown model size: ${modelSize}`;
      }

      const hwConfig = config[hardware];
      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }

      const modelName = `Qwen/Qwen2.5-VL-${config.baseName}-Instruct`;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
      }

      if ((hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x') && modelSize === '72b') {
        cmd += ` \\\n  --context-length 128000`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen25VLConfigGenerator;
