import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * Kimi-K2 Configuration Generator
 * Supports Kimi-K2-Instruct and Kimi-K2-Thinking models
 */
const KimiK2ConfigGenerator = () => {
  const config = {
    modelFamily: 'moonshotai',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false }
        ]
      },
      modelname: {
        name: 'modelname',
        title: 'Model Name',
        items: [
          { id: 'instruct', label: 'Kimi-K2-Instruct', default: true },
          { id: 'thinking', label: 'Kimi-K2-Thinking', default: false }
        ]
      },
      strategy: {
        name: 'strategy',
        title: 'Deployment Strategy',
        type: 'checkbox',
        items: [
          { id: 'tp', label: 'TP', default: true, required: true },
          { id: 'dp', label: 'DP attention', default: false },
          { id: 'ep', label: 'EP', default: false }
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
      const { hardware, modelname, strategy, reasoning, toolcall } = values;

      // Validation: Kimi-K2-Instruct doesn't support reasoning parser
      if (modelname === 'instruct' && reasoning === 'enabled') {
        return `# Error: Kimi-K2-Instruct doesn't support reasoning parser\n# Please select "Disabled" for Reasoning Parser or choose Kimi-K2-Thinking model`;
      }

      // Model name mapping
      const modelMap = {
        'instruct': 'Kimi-K2-Instruct',
        'thinking': 'Kimi-K2-Thinking'
      };

      const modelName = `${this.modelFamily}/${modelMap[modelname]}`;

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelName}`;

      // Strategy configurations
      const strategyArray = Array.isArray(strategy) ? strategy : [];
      // TP is mandatory
      cmd += ` \\\n  --tp 8`;
      if (strategyArray.includes('dp')) {
        cmd += ` \\\n  --dp 4 \\\n  --enable-dp-attention`;
      }
      if (strategyArray.includes('ep')) {
        cmd += ` \\\n  --ep 4`;
      }

      // Add trust-remote-code (required for Kimi-K2)
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

export default KimiK2ConfigGenerator;
