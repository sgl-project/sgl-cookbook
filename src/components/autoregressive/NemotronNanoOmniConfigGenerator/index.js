import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

const MODEL_PATHS = {
  'reasoning': 'nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning',
  'bf16':      'nvidia/Nemotron-3-Nano-Omni-30B-A3B-BF16',
  'fp8':       'nvidia/Nemotron-3-Nano-Omni-30B-A3B-FP8',
  'nvfp4':     'nvidia/Nemotron-3-Nano-Omni-30B-A3B-NVFP4',
};

/**
 * NVIDIA Nemotron 3 Nano Omni Configuration Generator
 */
const NemotronNanoOmniConfigGenerator = () => {
  const config = {
    modelFamily: 'nvidia',

    options: {
      model: {
        name: 'model',
        title: 'Model',
        items: [
          { id: 'reasoning', label: 'Reasoning', default: true  },
          { id: 'bf16',      label: 'BF16',      default: false },
          { id: 'fp8',       label: 'FP8',       default: false },
          { id: 'nvfp4',     label: 'NVFP4',     default: false },
        ]
      },
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h100',  label: 'H100',  default: true  },
          { id: 'h200',  label: 'H200',  default: false },
          { id: 'b200',  label: 'B200',  default: false },
          { id: 'a100',  label: 'A100',  default: false },
          { id: 'l40s',  label: 'L40S',  default: false },
        ]
      },
      tp: {
        name: 'tp',
        title: 'Tensor Parallel (TP)',
        items: [
          { id: '1', label: 'TP=1', default: false },
          { id: '2', label: 'TP=2', default: false },
          { id: '4', label: 'TP=4', default: true  },
          { id: '8', label: 'TP=8', default: false },
        ]
      },
      kvcache: {
        name: 'kvcache',
        title: 'KV Cache DType',
        items: [
          { id: 'none',      label: 'None',      default: true  },
          { id: 'fp8_e4m3',  label: 'fp8_e4m3',  default: false },
        ]
      },
      thinking: {
        name: 'thinking',
        title: 'Reasoning Parser',
        items: [
          { id: 'enabled',  label: 'Enabled',  default: true  },
          { id: 'disabled', label: 'Disabled', default: false },
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser deepseek-r1' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'enabled',  label: 'Enabled',  default: true  },
          { id: 'disabled', label: 'Disabled', default: false },
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen3_coder' : null
      },
    },

    generateCommand: function(values) {
      const { tp, kvcache, model } = values;

      const modelPath = MODEL_PATHS[model] || MODEL_PATHS['reasoning'];

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath} \\\n`;
      cmd += `  --host 0.0.0.0 \\\n`;
      cmd += `  --port 5000 \\\n`;
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

export default NemotronNanoOmniConfigGenerator;
