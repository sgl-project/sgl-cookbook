import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

const MODEL_PATHS = {
  'bf16': 'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16',
  'fp8':  'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-FP8',
  'nvfp4': 'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4',
};

/**
 * NVIDIA Nemotron3-Super Configuration Generator
 */
const NemotronSuperConfigGenerator = () => {
  const config = {
    modelFamily: 'nvidia',

    options: {
      model: {
        name: 'model',
        title: 'Model',
        items: [
          { id: 'bf16',   label: 'BF16',   default: true  },
          { id: 'fp8',    label: 'FP8',    default: false },
          { id: 'nvfp4',  label: 'NVFP4',  default: false },
        ]
      },
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
          { id: '2', label: 'TP=2', default: false },
          { id: '4', label: 'TP=4', default: true },
          { id: '8', label: 'TP=8', default: false }
        ]
      },
      mtp: {
        name: 'mtp',
        title: 'Multi-token Prediction (MTP)',
        items: [
          { id: 'enabled', label: 'Enabled', default: false },
          { id: 'disabled', label: 'Disabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4 \\\n  --disable-radix-cache' : null
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
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser nemotron_3' : null
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
      const { tp, kvcache, model } = values;

      const modelPath = MODEL_PATHS[model] || MODEL_PATHS['bf16'];

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath} \\\n`;
      cmd += `  --trust-remote-code \\\n`;
      cmd += `  --tp ${tp} \\\n`;

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
