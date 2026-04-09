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

          // Show 2 GPU option for all hardware, but only enabled for AMD GPUs
          return [
            {
              id: '2gpu',
              label: '2',
              default: isAMD,  // Default for all AMD GPUs
              disabled: !isAMD  // Only enabled for AMD GPUs
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

      // Validate 2-GPU configuration (only AMD supports 2 GPUs)
      const isAMD = hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x';
      if (gpuCount === '2gpu' && !isAMD) {
        return '# Please select compatible hardware\n# 2-GPU requires AMD MI300X/MI325X/MI355X';
      }

      const modelName = `${this.modelFamily}/MiniMax-M2.5`;

      let cmd = '';
      cmd += 'python -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelName}`;

      // TP and EP size based on GPU count
      // NVIDIA: EP only for 8-GPU configuration
      // AMD: EP=TP for all configurations
      if (gpuCount === '8gpu') {
        cmd += ` \\\n  --tp 8`;
        cmd += ` \\\n  --ep 8`;
      } else if (gpuCount === '4gpu') {
        cmd += ` \\\n  --tp 4`;
        // Only add EP for AMD GPUs
        if (isAMD) {
          cmd += ` \\\n  --ep 4`;
        }
      } else if (gpuCount === '2gpu') {
        cmd += ` \\\n  --tp 2`;
        // Only add EP for AMD GPUs (MI355X only supports 2 GPU)
        if (isAMD) {
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

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default MiniMaxM25ConfigGenerator;
