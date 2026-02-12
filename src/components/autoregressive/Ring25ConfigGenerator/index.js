import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Ring-2.5-1T Configuration Generator
 * Supports Ring-2.5-1T 1T parameter model deployment configuration
 * with FP8 quantization on H200/B200 GPUs
 *
 * GPU requirements:
 *   H200: tp=8, --max-running-requests 64
 *   B200: tp=8
 */
const Ring25ConfigGenerator = () => {
  const config = {
    modelFamily: 'inclusionAI',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false }
        ]
      }
    },

    modelConfigs: {
      h200: { fp8: { tp: 8, maxRunningRequests: 64 } },
      b200: { fp8: { tp: 8 } }
    },

    generateCommand: function (values) {
      const { hardware } = values;

      const modelName = `${this.modelFamily}/Ring-2.5-1T`;
      const hwConfig = this.modelConfigs[hardware].fp8;
      const tpValue = hwConfig.tp;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelName}`;
      cmd += ` \\\n  --tp-size ${tpValue}`;
      cmd += ' \\\n  --trust-remote-code';

      // H200 specific: max-running-requests
      if (hwConfig.maxRunningRequests) {
        cmd += ` \\\n  --max-running-requests ${hwConfig.maxRunningRequests}`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Ring25ConfigGenerator;
