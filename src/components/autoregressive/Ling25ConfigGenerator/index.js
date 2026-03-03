import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Ling-2.5-1T Configuration Generator
 * Multi-node deployment configuration for Ling-2.5-1T 1T parameter instant model
 *
 * Hardware configurations:
 *   H200:        tp=8, pp=2, 2 nodes, mem-frac=0.95
 *   B200:        tp=8, pp=2, 2 nodes
 *   GB200/GB300: tp=4 pp=2 or tp=8, 2 nodes, NCCL_IB_DISABLE=1, mem-frac=0.95
 */
const Ling25ConfigGenerator = () => {
  const config = {
    modelFamily: 'inclusionAI',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false },
          { id: 'gb200', label: 'GB200', default: false },
          { id: 'gb300', label: 'GB300', default: false }
        ]
      },
      parallelism: {
        name: 'parallelism',
        title: 'Parallelism Strategy',
        condition: (values) => values.hardware === 'gb200' || values.hardware === 'gb300',
        items: [
          { id: 'tp4pp2', label: 'TP + PP', default: true },
          { id: 'tp8', label: 'TP', default: false }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'enabled', label: 'Enabled', default: true },
          { id: 'disabled', label: 'Disabled', default: false }
        ],
      }
    },

    generateCommand: function (values) {
      const { hardware, parallelism, toolcall } = values;

      const isGB = hardware === 'gb200' || hardware === 'gb300';
      const envPrefix = isGB ? 'NCCL_IB_DISABLE=1 ' : '';

      let tp, pp;
      if (isGB && parallelism === 'tp8') {
        tp = 8;
        pp = null;
      } else if (isGB) {
        tp = 4;
        pp = 2;
      } else {
        tp = 8;
        pp = 2;
      }

      const needMemFrac = hardware === 'h200' || (isGB && parallelism !== 'tp8');

      const generateNodeCmd = (rank) => {
        let cmd = `${envPrefix}python3 -m sglang.launch_server \\\n`;
        cmd += `--model-path inclusionAI/Ling-2.5-1T \\\n`;
        cmd += `--trust-remote-code \\\n`;
        cmd += `--tp-size ${tp} \\\n`;
        if (pp) {
          cmd += `--pp-size ${pp} \\\n`;
        }
        cmd += `--nnodes 2 \\\n`;
        cmd += `--node-rank ${rank} \\\n`;
        if (rank === 0) {
          cmd += `--host 0.0.0.0 \\\n`;
          cmd += `--port \${PORT} \\\n`;
        }
        cmd += `--dist-init-addr \${MASTER_IP}:\${DIST_PORT}`;
        if (toolcall === 'enabled') {
          cmd += ` \\\n--tool-call-parser qwen`;
        }
        if (needMemFrac) {
          cmd += ` \\\n--mem-frac 0.95`;
        }
        return cmd;
      };

      let output = `# MASTER_IP is Node 0 IP. PORT and DIST_PORT can be assigned by yourself.\n\n`;
      output += `# Node 0:\n`;
      output += generateNodeCmd(0);
      output += `\n\n\n# Node 1:\n`;
      output += generateNodeCmd(1);

      return output;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Ling25ConfigGenerator;
