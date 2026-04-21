import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

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
          { id: 'b200', label: 'B200', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
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
      const strategyArray = Array.isArray(strategy) ? strategy : [];

      // H200 + DP attention: 2-node deployment
      if (hardware === 'h200' && strategyArray.includes('dp')) {
        const buildNodeCmd = (nodeRank, isLeader) => {
          const args = [
            `--model-path ${modelName}`,
            `--tp 16`,
            `--dp-size 2`,
            `--enable-dp-attention`,
            `--dist-init-addr $MASTER_IP:50000`,
            `--nnodes 2`,
            `--node-rank ${nodeRank}`,
            `--trust-remote-code`,
          ];
          if (strategyArray.includes('ep')) {
            args.push(
              `--ep 16`,
              `--enable-dp-lm-head`,
              `--moe-a2a-backend deepep`,
              `--moe-runner-backend deep_gemm`,
              `--moe-dense-tp-size 1`,
              `--deepep-mode auto`,
            );
          }
          if (toolcall === 'enabled') args.push(`--tool-call-parser kimi_k2`);
          if (reasoning === 'enabled') args.push(`--reasoning-parser kimi_k2`);
          if (isLeader) {
            args.push(`--host 0.0.0.0`);
            args.push(`--port 30000`);
          }
          return `sglang serve \\\n  ` + args.join(` \\\n  `);
        };
        return `# Node 0\n${buildNodeCmd(0, true)}\n\n# Node 1\n${buildNodeCmd(1, false)}`;
      }

      // Single-node deployment
      let cmd = 'sglang serve \\\n';

      if (hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x') {
        cmd = 'SGLANG_ROCM_FUSED_DECODE_MLA=0 ' + cmd;
      }

      cmd += `  --model-path ${modelName}`;

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
