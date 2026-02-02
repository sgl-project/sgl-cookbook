import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Step-3.5-Flash Configuration Generator
 * Supports Step-3.5-Flash with speculative decoding
 */
const Step3_5ConfigGenerator = () => {
  const config = {
    modelFamily: 'Step-3.5',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '196b', label: '196B', subtitle: 'MOE', default: true },
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
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser step3p5' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser step3p5' : null
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

          let cmd = '--speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4 \\\n  --enable-multi-layer-eagle ';

          return cmd;
        }
      }
    },

    modelConfigs: {
      '196b': {
        baseName: '196b',
        isMOE: true,
        h200: { tp: 4, ep: 4, bf16: true },
      },
    },

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize, quantization, reasoningParser } = values;

      const config = this.modelConfigs[modelSize];
      const hwConfig = config[hardware];

      const modelName = `stepfun-ai/Step-3.5-Flash`;

      let cmd = '';

      cmd += 'sglang serve \\\n';
      cmd += `  --model-path ${modelName}`;

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
