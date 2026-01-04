import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * NVIDIA Nemotron-Nano-3-30B-A3B Configuration Generator
 */
const NemotronNano3ConfigGenerator = () => {
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
      modelVariant: {
        name: 'modelVariant',
        title: 'Model Variant',
        items: [
          { id: 'bf16', label: 'BF16', default: true },
          { id: 'fp8', label: 'FP8', default: false }
        ]
      },
      tp: {
        name: 'tp',
        title: 'Tensor Parallel (TP)',
        items: [
          { id: '1', label: 'TP=1', default: true },
          { id: '2', label: 'TP=2', default: false },
          { id: '4', label: 'TP=4', default: false },
          { id: '8', label: 'TP=8', default: false }
        ]
      },
      kvcache: {
        name: 'kvcache',
        title: 'KV Cache DType',
        items: [
          { id: 'fp8_e4m3', label: 'fp8_e4m3', default: true },
          { id: 'bf16', label: 'bf16', default: false }
        ]
      },
      thinking: {
        name: 'thinking',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser nano_v3' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen3_coder' : null
      }
    },

    generateCommand: function(values) {
      const { hardware, modelVariant, tp, kvcache, thinking, toolcall } = values;

      // Default to FP8 if not selected
      const variant = modelVariant || 'fp8';
      const baseName = 'NVIDIA-Nemotron-3-Nano-30B-A3B';

      const modelName =
        variant === 'bf16'
          ? `${this.modelFamily}/${baseName}-BF16`
          : `${this.modelFamily}/${baseName}-FP8`;

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelName} \\\n`;
      cmd += `  --trust-remote-code \\\n`;
      cmd += `  --tp ${tp} \\\n`;
      cmd += `  --kv-cache-dtype ${kvcache} \\\n`;

      // Add thinking parser and tool call parser if enabled
      for (const [key, option] of Object.entries(this.options)) {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += `  ${rule}  \\\n`;
          }
        }
      }

      // Remove trailing backslash from last option
      cmd = cmd.trimEnd();
      if (cmd.endsWith('\\')) {
        cmd = cmd.slice(0, -1).trimEnd();
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default NemotronNano3ConfigGenerator;
