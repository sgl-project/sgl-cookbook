import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * MiniMax-M2.7 Configuration Generator
 * Supports MiniMax-M2.7 model deployment configuration
 *
 * Model: ~220GB FP8 weights, MoE (256 experts, 8 active)
 * GPU requirements:
 *   A100 (80GB): TP=4 min
 *   H100 (80GB): TP=4 min
 *   H200 (141GB): TP=2 min, TP=4/8 recommended
 *   B200 (180GB): TP=2 min, TP=4/8 recommended
 *   GB300 (275GB): TP=2 min
 *   MI300X (192GB): TP=2 min
 *   MI325X (256GB): TP=2 min
 *   MI355X (288GB): TP=2 min
 */
const MiniMaxM27ConfigGenerator = () => {
  const config = {
    modelFamily: 'MiniMaxAI',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false },
          { id: 'gb300', label: 'GB300', default: false },
          { id: 'a100', label: 'A100', default: false },
          { id: 'h100', label: 'H100', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      gpuCount: {
        name: 'gpuCount',
        title: 'GPU Count',
        getDynamicItems: (values) => {
          const hw = values.hardware;
          const isAMD = hw === 'mi300x' || hw === 'mi325x' || hw === 'mi355x';
          const isGB300 = hw === 'gb300';
          const canUse2GPU = isAMD || isGB300;

          return [
            {
              id: '2gpu',
              label: '2',
              default: canUse2GPU,
              disabled: !canUse2GPU
            },
            {
              id: '4gpu',
              label: '4',
              default: !canUse2GPU,
              disabled: false
            },
            {
              id: '8gpu',
              label: '8',
              default: false,
              disabled: isGB300
            }
          ];
        }
      },
      thinking: {
        name: 'thinking',
        title: 'Thinking Capabilities',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ]
      }
    },

    generateCommand: function (values) {
      const { hardware, gpuCount, thinking, toolcall } = values;

      const isAMD = hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x';
      const isGB300 = hardware === 'gb300';
      const canUse2GPU = isAMD || isGB300;

      if (gpuCount === '2gpu' && !canUse2GPU) {
        return '# Please select compatible hardware\n# 2-GPU requires AMD MI300X/MI325X/MI355X or GB300';
      }

      const modelName = `${this.modelFamily}/MiniMax-M2.7`;

      let cmd = 'sglang serve \\\n';
      cmd += `  --model-path ${modelName}`;

      // TP and EP size based on GPU count
      if (gpuCount === '8gpu') {
        cmd += ' \\\n  --tp 8';
        cmd += ' \\\n  --ep 8';
      } else if (gpuCount === '4gpu') {
        cmd += ' \\\n  --tp 4';
        if (isAMD) {
          cmd += ' \\\n  --ep 4';
        }
      } else if (gpuCount === '2gpu') {
        cmd += ' \\\n  --tp 2';
        if (isAMD) {
          cmd += ' \\\n  --ep 2';
        }
      }

      if (toolcall === 'enabled') {
        cmd += ' \\\n  --tool-call-parser minimax-m2';
      }

      if (thinking === 'enabled') {
        cmd += ' \\\n  --reasoning-parser minimax-append-think';
      }

      cmd += ' \\\n  --trust-remote-code';
      cmd += ' \\\n  --mem-fraction-static 0.85';

      // AMD-specific backend configurations
      if (isAMD) {
        cmd += ' \\\n  --kv-cache-dtype fp8_e4m3';
        cmd += ' \\\n  --attention-backend triton';
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default MiniMaxM27ConfigGenerator;
