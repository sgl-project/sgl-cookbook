import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Kimi-K2.5 Configuration Generator
 * Supports Kimi-K2.5 multimodal agentic model
 */
const KimiK25ConfigGenerator = () => {
  const config = {
    modelFamily: 'moonshotai',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b300', label: 'B300', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      strategy: {
        name: 'strategy',
        title: 'Deployment Strategy',
        type: 'checkbox',
        items: [
          { id: 'tp', label: 'TP', default: true, required: true }
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ]
      }
    },

    generateCommand: function (values) {
      const { hardware, strategy, reasoning, toolcall } = values;

      const isAMD = hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x';
      const modelName = `${this.modelFamily}/Kimi-K2.5`;

      let cmd = '';

      // Add AMD-specific environment variables
      if (isAMD) {
        cmd += 'export SGLANG_USE_AITER=0\n';
        cmd += 'export SGLANG_ROCM_FUSED_DECODE_MLA=0\n\n';
      }

      cmd += 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelName}`;

      // TP is mandatory
      cmd += ` \\\n  --tp 8`;

      // Add trust-remote-code (required for Kimi-K2.5)
      cmd += ` \\\n  --trust-remote-code`;

      // Add tool-call-parser if enabled
      if (toolcall === 'enabled') {
        cmd += ` \\\n  --tool-call-parser kimi_k2`;
      }

      // Add reasoning-parser if enabled
      if (reasoning === 'enabled') {
        cmd += ` \\\n  --reasoning-parser kimi_k2`;
      }

      // Add AMD-specific backend configurations
      if (isAMD) {
        cmd += ` \\\n  --kv-cache-dtype fp8_e4m3`;
        cmd += ` \\\n  --attention-backend triton`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default KimiK25ConfigGenerator;