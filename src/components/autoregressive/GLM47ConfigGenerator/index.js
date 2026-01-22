import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * GLM-4.7 Configuration Generator
 * Supports GLM-4.7 model deployment configuration
 */
const GLM47ConfigGenerator = () => {
  const config = {
    modelFamily: 'zai-org',

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
      strategy: {
        name: 'strategy',
        title: 'Deployment Strategy',
        type: 'checkbox',
        items: [
          { id: 'tp', label: 'TP', subtitle: 'Tensor Parallel', default: true, required: true },
          { id: 'dp', label: 'DP', subtitle: 'Data Parallel', default: false },
          { id: 'ep', label: 'EP', subtitle: 'Expert Parallel', default: false },
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
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser glm47' : null
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

      const modelSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `${this.modelFamily}/GLM-4.7${modelSuffix}`;

      // Determine TP value based on hardware and quantization
      let tpValue = 4; // Default for MI300X and MI325X
      if (hardware === 'mi355x') {
        tpValue = quantization === 'fp8' ? 2 : 4; // MI355X: TP=2 for FP8, TP=4 for BF16
      }

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      // TP is mandatory
      cmd += ` \\\n  --tp ${tpValue}`;

      // MI300X/MI325X BF16 requires extra flags
      if ((hardware === 'mi300x' || hardware === 'mi325x') && quantization === 'bf16') {
        cmd += ` \\\n  --context-length 8192 \\\n  --mem-fraction-static 0.9`;
      }

      // Strategy-specific parameters
      if (strategyArray.includes('dp')) {
        cmd += ` \\\n  --dp 8 \\\n  --enable-dp-attention`;
      }
      if (strategyArray.includes('ep')) {
        cmd += ` \\\n  --ep 8`;
      }
      if (strategyArray.includes('mtp')) {
        cmd = 'SGLANG_ENABLE_SPEC_V2=1 ' + cmd;
        cmd += ` \\\n  --speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4`;
      }

      // Add tool call parser if enabled
      if (toolcall === 'enabled') {
        cmd += ` \\\n  --tool-call-parser glm47`;
      }

      // Add thinking parser if enabled
      if (thinking === 'enabled') {
        cmd += ` \\\n  --reasoning-parser glm47`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default GLM47ConfigGenerator;
