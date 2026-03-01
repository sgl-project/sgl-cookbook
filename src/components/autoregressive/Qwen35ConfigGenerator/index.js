import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen3.5-397B-A17B Configuration Generator
 * Supports Qwen3.5 397B (17B active) MoE VLM deployment configuration
 * with reasoning parser, tool calling, and speculative decoding
 *
 * GPU requirements:
 *   H100: tp=16 (model ~800GB in BF16, each rank needs ~100GB > 80GB)
 *   H200: tp=8
 *   B200: tp=8
 */
const Qwen35ConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false },
          { id: 'h100', label: 'H100', default: false }
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser qwen3' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen3_coder' : null
      },
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding (MTP)',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4' : null
      },
      mambaCache: {
        name: 'mambaCache',
        title: 'Mamba Radix Cache',
        items: [
          { id: 'v1', label: 'V1', default: true },
          { id: 'v2', label: 'V2', default: false }
        ],
        commandRule: (value) => value === 'v2' ? '--mamba-scheduler-strategy extra_buffer \\\n  --page-size 64' : null
      }
    },

    modelConfigs: {
      h100: { bf16: { tp: 16, mem: 0.8 } },
      h200: { bf16: { tp: 8, mem: 0.8 } },
      b200: { bf16: { tp: 8, mem: 0.82 } }
    },

    generateCommand: function (values) {
      const { hardware, speculative } = values;

      const modelName = `${this.modelFamily}/Qwen3.5-397B-A17B`;

      const hwConfig = this.modelConfigs[hardware].bf16;
      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;

      // Initialize the base command
      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;
      cmd += ` \\\n  --tp ${tpValue}`;

      // Apply commandRule from all options
      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      // Append B200-specific backend configurations
      if (hardware === 'b200') {
        cmd += ` \\\n  --attention-backend trtllm_mha`;
        cmd += ` \\\n  --moe-runner-backend flashinfer_trtllm`;
        cmd += ` \\\n  --disable-radix-cache`;
        cmd += ` \\\n  --enable-flashinfer-allreduce-fusion`;
        if (speculative === 'disabled') {
          cmd += ` \\\n  --tokenizer-worker-num 6`;
        }
      }

      // Add memory fraction
      cmd += ` \\\n  --mem-fraction-static ${memFraction}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen35ConfigGenerator;
