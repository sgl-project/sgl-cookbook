import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * NVIDIA Nemotron3-Super Configuration Generator
 * TODO: Update modelPath when the public model name is available.
 */
const NemotronSuperConfigGenerator = () => {
  const config = {
    modelFamily: 'nvidia',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: false },
          { id: 'b200', label: 'B200', default: true }
        ]
      },
      tp: {
        name: 'tp',
        title: 'Tensor Parallel (TP)',
        items: [
          { id: '1', label: 'TP=1', default: false },
          { id: '2', label: 'TP=2', default: false },
          { id: '4', label: 'TP=4', default: true },
          { id: '8', label: 'TP=8', default: false }
        ]
      },
      kvcache: {
        name: 'kvcache',
        title: 'KV Cache DType',
        items: [
          { id: 'none', label: 'None', default: true },
          { id: 'fp8_e4m3', label: 'fp8_e4m3', default: false },
          { id: 'bf16', label: 'bf16', default: false }
        ]
      },
      thinking: {
        name: 'thinking',
        title: 'Reasoning Parser',
        items: [
          { id: 'enabled', label: 'Enabled', default: true },
          { id: 'disabled', label: 'Disabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser nano_v3' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'enabled', label: 'Enabled', default: true },
          { id: 'disabled', label: 'Disabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen3_coder' : null
      }
    },

    generateCommand: function(values) {
      const { tp, kvcache } = values;

      // TODO: Update model path when the public model name is available
      const modelPath = 'nvidia/nemotron-super-sft-020426';

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath} \\\n`;
      cmd += `  --trust-remote-code \\\n`;
      cmd += `  --tp ${tp} \\\n`;
      cmd += `  --ep 1 \\\n`;

      if (kvcache && kvcache !== 'none') {
        cmd += `  --kv-cache-dtype ${kvcache} \\\n`;
      }

      for (const [key, option] of Object.entries(this.options)) {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += `  ${rule} \\\n`;
          }
        }
      }

      cmd = cmd.trimEnd();
      if (cmd.endsWith('\\')) {
        cmd = cmd.slice(0, -1).trimEnd();
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default NemotronSuperConfigGenerator;
