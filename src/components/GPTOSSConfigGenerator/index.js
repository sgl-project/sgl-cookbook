import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * GPT-OSS Configuration Generator
 * Supports GPT-OSS 120B and 20B models with speculative decoding
 */
const GPTOSSConfigGenerator = () => {
  const config = {
    modelFamily: 'GPT-OSS',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h200', label: 'H200', default: false },
          { id: 'h100', label: 'H100', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '120b', label: '120B', subtitle: 'MOE', default: true },
          { id: '20b', label: '20B', subtitle: 'MOE', default: false },
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'mxfp4', label: 'MXFP4', default: true },
          { id: 'bf16', label: 'BF16', default: false }
        ]
      },
      thinking: {
        name: 'thinking',
        title: 'Thinking Capabilities',
        items: [
          { id: 'instruct', label: 'Instruct', subtitle: 'General Purpose', default: true },
          { id: 'thinking', label: 'Thinking', subtitle: 'Reasoning / CoT', default: false }
        ],
        commandRule: (value) => value === 'thinking' ? '--reasoning-parser gpt-oss' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser gpt-oss' : null
      },
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value, allValues) => {
          if (value !== 'enabled') return null;

          let cmd = '--speculative-algorithm EAGLE3 \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4';
                
          if (allValues.modelsize === '120b') {
              cmd += ' \\\n  --speculative-draft-model-path nvidia/gpt-oss-120b-Eagle3';
          } else if (allValues.modelsize === '20b') {
              cmd += ' \\\n  --speculative-draft-model-path zhuyksir/EAGLE3-gpt-oss-20b-bf16';
          }

          return cmd;
        }
      }
    },

    modelConfigs: {
      '120b': {
        baseName: '120b',
        isMOE: true,
        h100: { tp: 8, ep: 0, mxfp4: true, bf16: false },
        h200: { tp: 8, ep: 0, mxfp4: true, bf16: false },
        b200: { tp: 8, ep: 0, mxfp4: true, bf16: false }
      },
      '20b': {
        baseName: '20b',
        isMOE: true,
        h100: { tp: 1, ep: 0, mxfp4: true, bf16: false },
        h200: { tp: 1, ep: 0, mxfp4: true, bf16: false },
        b200: { tp: 1, ep: 0, mxfp4: true, bf16: false }
      }
    },

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize, quantization, thinking } = values;
      const commandKey = `${hardware}-${modelSize}-${quantization}-${thinking}`;

      const config = this.modelConfigs[modelSize];
      if (!config) {
        return `# Error: Unknown model size: ${modelSize}`;
      }

      const hwConfig = config[hardware];
      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }

      const quantSuffix = quantization === 'bf16' ? '-bf16' : '';
      const orgPrefix = quantization === 'bf16' ? 'lmsys' : 'openai';
      const modelName = `${orgPrefix}/gpt-oss-${config.baseName}${quantSuffix}`;

      let cmd = '';
        
      if (modelSize === '20b' && values.speculative === 'enabled') {
          cmd += 'SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1 ';
      }
      
      cmd += 'python -m sglang.launch_server \\\n';

      cmd += `  --model ${modelName}`;

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

export default GPTOSSConfigGenerator;
