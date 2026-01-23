import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * GLM-4.7-Flash Configuration Generator
 * Supports GLM-4.7-Flash model deployment configuration
 * Hardware options: H100, H200, B200
 */
const GLM47FlashConfigGenerator = () => {
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
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', default: true }
        ]
      },
      strategy: {
        name: 'strategy',
        title: 'Deployment Strategy',
        type: 'checkbox',
        items: [
          { id: 'tp', label: 'TP', subtitle: 'Tensor Parallel', default: true, required: true },
          { id: 'dp', label: 'DP', subtitle: 'Data Parallel', default: false },
          { id: 'mtp', label: 'MTP', subtitle: 'Multi-token Prediction', default: false }
        ]
      },
      thinking: {
        name: 'thinking',
        title: 'Thinking Capabilities',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser glm45' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser glm47' : null
      }
    },

    specialCommands: {},

    generateCommand: function (values) {
      const { hardware, quantization, strategy, thinking, toolcall } = values;

      const strategyArray = Array.isArray(strategy) ? strategy : [];

      const modelName = `${this.modelFamily}/GLM-4.7-Flash`;

      // GLM-4.7-Flash is a 30B-A3B MoE model, lighter than GLM-4.7
      const tpValue = 1; // Default for single GPU

      let cmd = 'python -m sglang.launch_server \\\n ';
      cmd += `  --model ${modelName}`;

      // TP is mandatory
      cmd += ` \\\n   --tp ${tpValue}`;

      if (hardware === 'b200') {
        cmd += ` \\\n   --attention-backend triton`;
      }

      // Strategy-specific parameters
      if (strategyArray.includes('dp')) {
        cmd += ` \\\n   --dp 1 \\\n   --enable-dp-attention`;
      }
      if (strategyArray.includes('mtp')) {
        cmd = 'SGLANG_ENABLE_SPEC_V2=1 ' + cmd;

        if (hardware === 'b200') {
          cmd += ` \\\n   --speculative-draft-attention-backend triton`;
        }
        cmd += ` \\\n   --speculative-algorithm EAGLE \\\n   --speculative-num-steps 3 \\\n   --speculative-eagle-topk 1 \\\n   --speculative-num-draft-tokens 4`;
      }

      // Add tool call parser if enabled
      if (toolcall === 'enabled') {
        cmd += ` \\\n   --tool-call-parser glm47`;
      }

      // Add thinking parser if enabled
      if (thinking === 'enabled') {
        cmd += ` \\\n  --reasoning-parser glm45`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default GLM47FlashConfigGenerator;
