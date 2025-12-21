import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * GLM-4.6 Configuration Generator
 * Supports GLM-4.6 model deployment configuration
 */
const GLM46ConfigGenerator = () => {
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
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser glm45' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser glm45' : null
      }
    },

    specialCommands: {
      'h100-bf16-tp': '# Error: GLM-4.6 in BF16 precision requires more VRAM than 8*H100\n# Please use H200/B200 or select FP8 quantization',
      'h100-bf16-dp': '# Error: GLM-4.6 in BF16 precision requires more VRAM than 8*H100\n# Please use H200/B200 or select FP8 quantization',
      'h100-bf16-ep': '# Error: GLM-4.6 in BF16 precision requires more VRAM than 8*H100\n# Please use H200/B200 or select FP8 quantization',
      'h100-bf16-mtp': '# Error: GLM-4.6 in BF16 precision requires more VRAM than 8*H100\n# Please use H200/B200 or select FP8 quantization'
    },

    generateCommand: function (values) {
      const { hardware, quantization, strategy, thinking, toolcall } = values;

      // Check for H100 + BF16 error
      const strategyArray = Array.isArray(strategy) ? strategy : [];
      if (hardware === 'h100' && quantization === 'bf16') {
        return '# Error: GLM-4.6 in BF16 precision requires more VRAM than 8*H100\n# Please use H200/B200 or select FP8 quantization';
      }

      const modelSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `${this.modelFamily}/GLM-4.6${modelSuffix}`;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      // TP is mandatory
      cmd += ` \\\n  --tp 8`;

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
        cmd += ` \\\n  --tool-call-parser glm45`;
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

export default GLM46ConfigGenerator;
