import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Step-3.5-Flash Configuration Generator
 * Supports Step-3.5-Flash with speculative decoding
 *
 * GPU requirements:
 *   H200: tp=4 (BF16), tp=4 (FP8)
 *   MI300X: tp=4 (BF16/FP8)
 *   MI325X: tp=4 (BF16/FP8)
 *   MI350X: tp=4 (BF16/FP8)
 *   MI355X: tp=4 (BF16/FP8)
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
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi350x', label: 'MI350X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
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
          { id: 'bf16', label: 'BF16', default: true },
          { id: 'fp8', label: 'FP8', default: false }
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
        h200: { tp: 4, bf16: true },
        mi300x: { tp: 4, bf16: true },
        mi325x: { tp: 4, bf16: true },
        mi350x: { tp: 4, bf16: true },
        mi355x: { tp: 4, bf16: true },
      },
    },

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize, quantization, reasoningParser } = values;
      const isAMD = hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi350x' || hardware === 'mi355x';

      const config = this.modelConfigs[modelSize];
      const hwConfig = config[hardware];
      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `stepfun-ai/Step-3.5-Flash${quantSuffix}`;

      let tpValue = hwConfig.tp;

      let cmd = '';

      cmd += 'sglang serve \\\n';
      cmd += `  --model-path ${modelName}`;

      if (tpValue > 1) {
        cmd += ` \\\n  --tp ${tpValue}`;
      }
      // EP required for FP8, and for AMD BF16 (AITER CK GEMM N=320 crash without EP)
      if (quantSuffix === '-FP8' || isAMD) {
        cmd += ` \\\n  --ep ${tpValue}`;
      }

      // Trust remote code for custom architecture
      cmd += ' \\\n  --trust-remote-code';

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
