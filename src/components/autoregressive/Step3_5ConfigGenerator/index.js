import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * GPT-OSS Configuration Generator
 * Supports GPT-OSS 120B and 20B models with speculative decoding
 */
const Step3_5ConfigGenerator = () => {
  const config = {
    modelFamily: 'Step',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b300', label: 'B300', default: true },
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '120b', label: '120B', subtitle: 'MOE', default: true },
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', default: true }
        ]
      },
      reasoningParser: {
        name: 'reasoningParser',
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
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen3_coder' : null
      },
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => {
          if (value !== 'enabled') return null;

          let cmd = '--speculative-algorithm EAGLE3 \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4 \\\n  --enable-multi-layer-eagle ';

          return cmd;
        }
      }
    },

    modelConfigs: {
      '120b': {
        baseName: '120b',
        isMOE: true,
        b300: { tp: 8, ep: 0, bf16: true },
      },
    },

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize, quantization, reasoningParser } = values;
        
      const config = this.modelConfigs[modelSize];
      const hwConfig = config[hardware];

      const modelName = `stepfun-ai/step3.5`;

      let cmd = '';

      if (values.speculative === 'enabled') {
        cmd += 'SGLANG_ENABLE_SPEC_V2=1 SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1 \\\n';
      }

      cmd += 'sglang serve \\\n';
      cmd += `  --model-path ${modelName} \\\n`;
      cmd += '  --model-loader-extra-config \'{"enable_multithread_load": true, "num_threads": 8}\'';

      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
      }

      let ep = hwConfig.ep;

      if (ep > 0) {
        cmd += ` \\\n  --ep ${ep}`;
      }

      for (const [key, option] of Object.entries(this.options)) {

        if (option.commandRule) {
          const rule = option.commandRule(values[key], values);

          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Step3_5ConfigGenerator;
