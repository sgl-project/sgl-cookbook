import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * DeepSeek-Math-V2 Configuration Generator
 * Supports DeepSeek-Math-V2 mathematical reasoning model deployment configuration
 * with BF16 quantization, reasoning parser, and DP attention
 *
 * GPU requirements:
 *   B200/B300 (180GB): BF16 tp=8
 *   H200 (80GB): Insufficient memory
 */
const DeepSeekMathV2ConfigGenerator = () => {
  const config = {
    modelFamily: 'deepseek-ai',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', subtitle: '80GB', default: false },
          { id: 'b200', label: 'B200', subtitle: '180GB', default: true },
          { id: 'b300', label: 'B300', subtitle: '180GB', default: false }
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser deepseek-r1' : null
      },
      dpattention: {
        name: 'dpattention',
        title: 'DP Attention',
        items: [
          { id: 'disabled', label: 'Disabled', subtitle: 'Low Latency', default: true },
          { id: 'enabled', label: 'Enabled', subtitle: 'High Throughput', default: false }
        ],
        commandRule: null
      }
    },

    // BF16 only, B200/B300 tp=8, H200 insufficient memory
    modelConfigs: {
      b200: { bf16: { tp: 8, mem: null } },
      b300: { bf16: { tp: 8, mem: null } },
      h200: null  // Insufficient memory
    },

    generateCommand: function (values) {
      const { hardware } = values;

      // Check for insufficient memory
      if (hardware === 'h200') {
        return '# Error: H200 (80GB) has insufficient memory for DeepSeek-Math-V2\n# This model requires at least 180GB GPU memory per card\n# Please use B200 or B300 (180GB) instead';
      }

      const modelName = `${this.modelFamily}/DeepSeek-Math-V2`;

      const hwConfig = this.modelConfigs[hardware].bf16;
      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;

      let cmd = 'sglang serve --model-path';
      cmd += ` ${modelName}`;

      // TP setting
      cmd += ` \\\n  --tp ${tpValue}`;

      // DP Attention: --dp matches --tp
      if (values.dpattention === 'enabled') {
        cmd += ` \\\n  --dp ${tpValue} \\\n  --enable-dp-attention`;
      }

      // EP setting (commonly matches tp for MoE models)
      cmd += ` \\\n  --ep ${tpValue}`;

      // Apply commandRule from all options
      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      // Memory fraction based on hardware and quantization (skip for 8-card configs)
      if (memFraction) {
        cmd += ` \\\n  --mem-fraction-static ${memFraction}`;
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default DeepSeekMathV2ConfigGenerator;
