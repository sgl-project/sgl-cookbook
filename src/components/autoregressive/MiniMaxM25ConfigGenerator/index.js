import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * MiniMax-M2.5 Configuration Generator
 * Supports MiniMax-M2.5 model deployment configuration
 */
const MiniMaxM25ConfigGenerator = () => {
  const config = {
    modelFamily: 'MiniMaxAI',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false },
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
          const isAMD = values.hardware === 'mi300x' || values.hardware === 'mi325x' || values.hardware === 'mi355x';
          const isB200 = values.hardware === 'b200';

          // Show 2 GPU option for all hardware, but only enabled for AMD GPUs and B200
          return [
            {
              id: '2gpu',
              label: '2',
              default: isAMD,  // Default for all AMD GPUs
              disabled: !isAMD && !isB200  // Only enabled for AMD GPUs and B200
            },
            {
              id: '4gpu',
              label: '4',
              default: !isAMD,  // Default for NVIDIA GPUs
              disabled: false
            },
            {
              id: '8gpu',
              label: '8',
              default: false,
              disabled: false
            }
          ];
        }
      },
      thinking: {
        name: 'thinking',
        title: 'Thinking Capabilities',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser minimax-append-think' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser minimax-m2' : null
      }
    },

    generateCommand: function (values) {
      const { hardware, gpuCount, thinking, toolcall } = values;

      const isAMD = hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x';
      const isB200 = hardware === 'b200';

      // Validate 2-GPU configuration (only AMD and B200 support 2 GPUs)
      if (gpuCount === '2gpu' && !isAMD && !isB200) {
        return '# Please select compatible hardware\n# 2-GPU requires AMD MI300X/MI325X/MI355X or B200';
      }

      const modelName = `${this.modelFamily}/MiniMax-M2.5`;

      let cmd = '';
      cmd += 'python -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelName}`;

      // TP and EP size based on GPU count
      // NVIDIA (non-B200): EP only for 8-GPU configuration
      // B200 and AMD: EP=TP for all configurations
      if (gpuCount === '8gpu') {
        cmd += ` \\\n  --tp 8`;
        cmd += ` \\\n  --ep 8`;
      } else if (gpuCount === '4gpu') {
        cmd += ` \\\n  --tp 4`;
        if (isAMD || isB200) {
          cmd += ` \\\n  --ep 4`;
        }
      } else if (gpuCount === '2gpu') {
        cmd += ` \\\n  --tp 2`;
        if (isAMD || isB200) {
          cmd += ` \\\n  --ep 2`;
        }
      }

      // Add tool call parser if enabled
      if (toolcall === 'enabled') {
        cmd += ` \\\n  --tool-call-parser minimax-m2`;
      }

      // Add thinking parser if enabled
      if (thinking === 'enabled') {
        cmd += ` \\\n  --reasoning-parser minimax-append-think`;
      }

      cmd += ` \\\n  --trust-remote-code`;
      cmd += ` \\\n  --mem-fraction-static 0.85`;

      // Add AMD-specific backend configurations
      if (isAMD) {
        cmd += ` \\\n  --kv-cache-dtype fp8_e4m3`;
        cmd += ` \\\n  --attention-backend triton`;
      }

      // Add B200-specific configurations (FP8 KV cache)
      if (isB200) {
        cmd += ` \\\n  --kv-cache-dtype fp8_e4m3`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default MiniMaxM25ConfigGenerator;
