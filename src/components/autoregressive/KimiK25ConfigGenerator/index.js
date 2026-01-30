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
          { id: 'b300', label: 'B300', default: false }
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

      const modelName = `${this.modelFamily}/Kimi-K2.5`;

      let cmd = 'python3 -m sglang.launch_server \\\n';
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

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default KimiK25ConfigGenerator;
