import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Ring-2.5-1T Configuration Generator
 * Supports Ring-2.5-1T 1T parameter model deployment configuration
 * with FP8 quantization, reasoning parser, and tool calling
 *
 * GPU requirements:
 *   H200 / B200 / GB200 / GB300 / MI355X: single-node (tp per platform; MI355X has enough memory)
 *   MI300X / MI325X: two nodes, tp-size 8, pp-size 2 (see generated scripts)
 */
const Ring25ConfigGenerator = () => {
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
          { id: 'gb300', label: 'GB300', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser deepseek-r1' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen' : null
      }
    },

    modelConfigs: {
      h200: { fp8: { tp: 8 } },
      b200: { fp8: { tp: 8 } },
      gb200: { fp8: { tp: 4 } },
      gb300: { fp8: { tp: 4 } },
      mi300x: { fp8: { tp: 8, pp: 2, nnodes: 2 } },
      mi325x: { fp8: { tp: 8, pp: 2, nnodes: 2 } },
      mi355x: { fp8: { tp: 8 } }
    },

    generateCommand: function (values) {
      const { hardware } = values;

      const modelName = `${this.modelFamily}/Ring-2.5-1T`;
      const amdMultiNode = hardware === 'mi300x' || hardware === 'mi325x';

      if (amdMultiNode) {
        const hwConfig = this.modelConfigs[hardware].fp8;
        const tpSize = hwConfig.tp;
        const ppSize = hwConfig.pp;

        const extraFlags = [];
        Object.entries(this.options).forEach(([key, option]) => {
          if (option.commandRule) {
            const rule = option.commandRule(values[key]);
            if (rule) {
              extraFlags.push(rule);
            }
          }
        });

        const buildAmdNodeCmd = (nodeRank) => {
          let cmd = 'sglang serve \\\n';
          cmd += `--model-path ${modelName} \\\n`;
          cmd += '--trust-remote-code \\\n';
          cmd += `--tp-size ${tpSize} \\\n`;
          cmd += `--pp-size ${ppSize} \\\n`;
          cmd += `--nnodes ${hwConfig.nnodes} \\\n`;
          cmd += `--node-rank ${nodeRank} \\\n`;
          if (nodeRank === 0) {
            cmd += '--host 0.0.0.0 \\\n';
            cmd += '--port 30000 \\\n';
          }
          cmd += '--dist-init-addr ${MASTER_IP}:${DIST_PORT} \\\n';
          cmd += '--attention-backend triton \\\n';
          cmd += '--model-loader-extra-config \'{"enable_multithread_load": "true","num_threads": 64}\' \\\n';
          cmd += '--mem-frac 0.95';
          extraFlags.forEach((flag) => {
            cmd += ` \\\n${flag}`;
          });
          return cmd;
        };

        const envBlock =
          'export MASTER_IP=<your-node0-ip> # Replace with the IP of Node 0\n' +
          'export PORT=30000\n' +
          'export DIST_PORT=20000\n' +
          '# Replace <nic-ifname> with your actual NIC interface name\n' +
          'export GLOO_SOCKET_IFNAME=<nic-ifname>\n' +
          'export TP_SOCKET_IFNAME=<nic-ifname>\n';

        let out = envBlock + '\n';

        out += '\n# Node 0:\n';
        out += buildAmdNodeCmd(0);

        out += '\n\n\n# Node 1:\n';
        out += buildAmdNodeCmd(1);

        return out;
      }

      const hwConfig = this.modelConfigs[hardware].fp8;
      const tpValue = hwConfig.tp;

      let cmd = 'sglang serve \\\n';
      cmd += `  --model-path ${modelName}`;
      cmd += ` \\\n  --tp ${tpValue}`;
      cmd += ' \\\n  --trust-remote-code';

      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Ring25ConfigGenerator;
