import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * GLM-OCR Configuration Generator
 * Supports GLM-OCR model deployment configuration with optional MTP (EAGLE speculative decoding)
 * Hardware options: H100, H200, B200
 */
const GLMOCRConfigGenerator = () => {
  const config = {
    modelFamily: 'zai-org',

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
      strategy: {
        name: 'strategy',
        title: 'Deployment Strategy',
        type: 'checkbox',
        items: [
          { id: 'mtp', label: 'MTP', subtitle: 'Multi-token Prediction', default: true }
        ]
      }
    },

    specialCommands: {},

    generateCommand: function (values) {
      const { strategy } = values;

      const strategyArray = Array.isArray(strategy) ? strategy : [];

      const modelName = `${this.modelFamily}/GLM-OCR`;

      let cmd = 'SGLANG_USE_CUDA_IPC_TRANSPORT=1 python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      // MTP with EAGLE speculative decoding
      if (strategyArray.includes('mtp')) {
        cmd += ` \\\n  --speculative-algorithm EAGLE`;
        cmd += ` \\\n  --speculative-num-steps 3`;
        cmd += ` \\\n  --speculative-eagle-topk 1`;
        cmd += ` \\\n  --speculative-num-draft-tokens 4`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default GLMOCRConfigGenerator;
