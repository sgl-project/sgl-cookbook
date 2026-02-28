import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen3.5-397B-A17B Configuration Generator
 * Supports Qwen3.5 397B (17B active) MoE VLM deployment configuration
 * with reasoning parser, tool calling, speculative decoding, and quantization options
 *
 * GPU requirements (BF16):
 *   H100: tp=16 (model ~800GB in BF16, each rank needs ~100GB > 80GB)
 *   H200: tp=8
 *   B200: tp=8
 *   B300: tp=4
 *
 * GPU requirements (FP8):
 *   H100: tp=8 (model ~400GB in FP8, each rank needs ~50GB < 80GB)
 *   H200: tp=4
 *   B200: tp=4
 *   B300: tp=2
 *
 * GPU requirements (FP4):
 *   B200: tp=4 (FP4 requires Blackwell)
 *   B300: tp=2 (FP4 requires Blackwell)
 */
const Qwen35ConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        getDynamicItems: (values) => {
          const isNvfp4 = values.quantization === 'fp4';
          return [
            { id: 'h100', label: 'H100', default: !isNvfp4, disabled: isNvfp4 },
            { id: 'h200', label: 'H200', default: false, disabled: isNvfp4 },
            { id: 'b200', label: 'B200', default: false, disabled: false },
            { id: 'b300', label: 'B300', default: isNvfp4, disabled: false }
          ];
        }
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', default: false },
          { id: 'fp8', label: 'FP8', default: true },
          { id: 'fp4', label: 'FP4', default: false }
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
      }
    },

    modelConfigs: {
      h100: { bf16: { tp: 16, mem: 0.8 }, fp8: { tp: 8, mem: 0.8 } },
      h200: { bf16: { tp: 8,  mem: 0.8 }, fp8: { tp: 4, mem: 0.8 } },
      b200: { bf16: { tp: 8,  mem: 0.8 }, fp8: { tp: 4, mem: 0.8 }, fp4: { tp: 4, mem: 0.8 } },
      b300: { bf16: { tp: 4,  mem: 0.8 }, fp8: { tp: 2, mem: 0.8 }, fp4: { tp: 2, mem: 0.8 } }
    },

    generateCommand: function (values) {
      const { hardware, quantization, speculative } = values;

      // Validate hardware supports the quantization
      const hwConfig = this.modelConfigs[hardware]?.[quantization];
      if (!hwConfig) {
        return '# Please select compatible hardware for the chosen quantization\n# FP4 requires B200/B300 (Blackwell)';
      }

      let modelName;
      if (quantization === 'fp4') {
        modelName = 'nvidia/Qwen3.5-397B-A17B-NVFP4';
      } else {
        const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
        modelName = `${this.modelFamily}/Qwen3.5-397B-A17B${quantSuffix}`;
      }

      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;

      // Initialize the base command
      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;
      cmd += ` \\\n  --tp ${tpValue}`;

      // Apply commandRule from all options except quantization (handled via model name)
      Object.entries(this.options).forEach(([key, option]) => {
        if (key === 'quantization') return;
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      // Enable allreduce fusion for all Qwen3.5 configs.
      cmd += ` \\\n  --enable-flashinfer-allreduce-fusion`;

      // Append backend configurations
      if (hardware === 'b200' || hardware === 'b300') {
        cmd += ` \\\n  --attention-backend trtllm_mha`;
      }

      // Append B200/B300-specific backend configurations
      if (hardware === 'b200' || hardware === 'b300') {
        if (speculative === 'disabled') {
          cmd += ` \\\n  --tokenizer-worker-num 6`;
        }
      }

      // FP4-specific backend settings
      if (quantization === 'fp4') {
        cmd += ' \\\n  --moe-runner-backend flashinfer_trtllm \\\n  --fp4-gemm-backend flashinfer_cutlass \\\n  --kv-cache-dtype fp8_e4m3';
      }

      // Add memory fraction last
      cmd += ` \\\n  --mem-fraction-static ${memFraction}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen35ConfigGenerator;
