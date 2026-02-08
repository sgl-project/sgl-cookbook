import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Kimi-Linear Configuration Generator
 * Supports Kimi-Linear models
 */
const KimiK2linearConfigGenerator = () => {
  const config = {
    modelFamily: 'moonshotai',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
<<<<<<< HEAD
		  { id: 'mi300x', label: 'MI300x', default: false },
          { id: 'mi325x', label: 'MI325x', default: false },
          { id: 'mi355x', label: 'MI355x', default: false }
=======
		  { id: 'mi300x', label: 'mi300x', default: false },
          { id: 'mi325x', label: 'mi325x', default: false },
          { id: 'mi355x', label: 'mi355x', default: false }
>>>>>>> 3b5314e (Create index.js)
        ]
      },
      modelname: {
        name: 'modelname',
        title: 'Model Name',
        items: [
          { id: 'instruct', label: 'Kimi-Linear-48B-A3B-Instruct', default: true },

        ]
      },
      strategy: {
        name: 'strategy',
        title: 'Deployment Strategy',
        type: 'checkbox',
        items: [
          { id: 'tp', label: 'TP', default: true, required: true },

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

      // Validation: Kimi-Linear doesn't support reasoning parser
      if (modelname === 'instruct' && reasoning === 'enabled') {
        return `# Error: Kimi-Linear doesn't support reasoning parser\n# Please select "Disabled" for Reasoning Parser or choose Kimi-Linear-Thinking model`;
      }

      // Model name mapping
      const modelMap = {
        'instruct': 'Kimi-Linear',
      };

      const modelName = `${this.modelFamily}/${modelMap[modelname]}`;

      let cmd = 'python3 -m sglang.launch_server \\\n';

	  if (hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x') {
        cmd = 'SGLANG_ROCM_FUSED_DECODE_MLA=0 ' + cmd;
      }


      cmd += `  --model-path ${modelName}`;

      // Strategy configurations

      const strategyArray = Array.isArray(strategy) ? strategy : [];
      // TP is mandatory
      cmd += ` \\\n  --tp 4`;

      // Add trust-remote-code (required for Kimi-Linear)
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
