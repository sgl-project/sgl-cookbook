import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen3.5 Configuration Generator
 *
 * MoE models (Gated Delta Networks + sparse MoE, hybrid architecture):
 *   397B-A17B, 122B-A10B, 35B-A3B
 *
 * Dense models (standard transformer):
 *   27B, 9B, 4B, 2B, 0.8B
 *
 * GPU requirements (BF16):
 *   397B-A17B: H100 tp=16, H200 tp=8, B200 tp=8, B300 tp=4, MI300X tp=8, MI325X tp=4, MI355X tp=4
 *   122B-A10B: H100 tp=4,  H200 tp=2, B200 tp=2, B300 tp=1, MI300X tp=2, MI325X tp=1, MI355X tp=1
 *   35B-A3B:   H100 tp=1,  H200 tp=1, B200 tp=1, B300 tp=1, MI300X tp=1, MI325X tp=1, MI355X tp=1
 *   27B/9B/4B/2B/0.8B: tp=1 on all hardware (including MI300X, MI325X, MI355X)
 *
 * GPU requirements (FP8, where available):
 *   397B-A17B: H100 tp=8, H200 tp=4, B200 tp=4, B300 tp=2, MI300X tp=4, MI325X tp=2, MI355X tp=2
 *   122B-A10B: H100 tp=2, H200 tp=1, B200 tp=1, B300 tp=1, MI300X tp=1, MI325X tp=1, MI355X tp=1
 *   35B-A3B:   H100 tp=1, H200 tp=1, B200 tp=1, B300 tp=1, MI300X tp=1, MI325X tp=1, MI355X tp=1
 *   27B:       tp=1 on all hardware (including MI300X, MI325X, MI355X)
 *
 * FP4 (397B only, Blackwell required): B200 tp=4, B300 tp=2
 */

const MOE_MODELS = new Set(['397b', '122b', '35b']);
const FP8_MODELS = new Set(['397b', '122b', '35b', '27b']);

// Maps model id → HuggingFace model name suffix
const MODEL_SUFFIX = {
  '397b': '397B-A17B',
  '122b': '122B-A10B',
  '35b':  '35B-A3B',
  '27b':  '27B',
  '9b':   '9B',
  '4b':   '4B',
  '2b':   '2B',
  '0.8b': '0.8B',
};

const Qwen35ConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      model: {
        name: 'model',
        title: 'Model Variant',
        items: [
          { id: '397b',  label: '397B', subtitle: "MoE", default: true  },
          { id: '122b',  label: '122B', subtitle: "MoE", default: false },
          { id: '35b',   label: '35B', subtitle: "MoE", default: false },
          { id: '27b',   label: '27B', subtitle: "Dense", default: false },
          { id: '9b',    label: '9B', subtitle: "Dense", default: false },
          { id: '4b',    label: '4B', subtitle: "Dense", default: false },
          { id: '2b',    label: '2B', subtitle: "Dense", default: false },
          { id: '0.8b',  label: '0.8B', subtitle: "Dense", default: false },
        ]
      },
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        getDynamicItems: (values) => {
          const isNvfp4 = values.quantization === 'fp4';
          return [
            { id: 'h100', label: 'H100', default: !isNvfp4, disabled: isNvfp4 },
            { id: 'h200', label: 'H200', default: false, disabled: isNvfp4 },
            { id: 'b200', label: 'B200', default: false, disabled: false },
            { id: 'b300', label: 'B300', default: isNvfp4, disabled: false },
            { id: 'mi300x', label: 'MI300X', default: false, disabled: isNvfp4 },
            { id: 'mi325x', label: 'MI325X', default: false, disabled: isNvfp4 },
            { id: 'mi355x', label: 'MI355X', default: false, disabled: isNvfp4 }
          ];
        }
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        getDynamicItems: (values) => {
          const hasFp8 = FP8_MODELS.has(values.model);
          const hasFp4 = values.model === '397b';
          return [
            { id: 'bf16', label: 'BF16', default: !hasFp8 },
            { id: 'fp8',  label: 'FP8',  default: hasFp8,  disabled: !hasFp8,
              disabledReason: 'No FP8 variant available for this model' },
            { id: 'fp4',  label: 'FP4',  default: false,   disabled: !hasFp4,
              disabledReason: 'FP4 is only available for Qwen3.5-397B-A17B' }
          ];
        }
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
        condition: (values) => MOE_MODELS.has(values.model),
        getDynamicItems: (currentValues) => {
          const amdGpus = ['mi300x', 'mi325x', 'mi355x'];
          const isAmdGpu = amdGpus.includes(currentValues.hardware);

          // Show V2 as disabled for AMD GPUs (V2 requires FLA backend, NVIDIA only)
          if (isAmdGpu) {
            return [
              { id: 'v1', label: 'V1', default: true },
              { id: 'v2', label: 'V2', default: false, disabled: true }
            ];
          }

          // Show both V1 and V2 enabled for NVIDIA GPUs
          return [
            { id: 'v1', label: 'V1', default: true },
            { id: 'v2', label: 'V2', default: false }
          ];
        },
        commandRule: (value) => value === 'v2' ? '--mamba-scheduler-strategy extra_buffer \\\n  --page-size 64' : null
      }
    },

    modelConfigs: {
      '397b': {
        h100: { bf16: { tp: 16, mem: 0.8 }, fp8: { tp: 8, mem: 0.8 } },
        h200: { bf16: { tp: 8,  mem: 0.8 }, fp8: { tp: 4, mem: 0.8 } },
        b200: { bf16: { tp: 8,  mem: 0.8 }, fp8: { tp: 4, mem: 0.8 }, fp4: { tp: 4, mem: 0.8 } },
        b300: { bf16: { tp: 4,  mem: 0.8 }, fp8: { tp: 2, mem: 0.8 }, fp4: { tp: 2, mem: 0.8 } },
        mi300x: { bf16: { tp: 8, mem: 0.8 }, fp8: { tp: 4, mem: 0.8 } },
        mi325x: { bf16: { tp: 4, mem: 0.8 }, fp8: { tp: 2, mem: 0.8 } },
        mi355x: { bf16: { tp: 4, mem: 0.8 }, fp8: { tp: 2, mem: 0.8 } }
      },
      '122b': {
        h100: { bf16: { tp: 4, mem: 0.8 }, fp8: { tp: 2, mem: 0.8 } },
        h200: { bf16: { tp: 2, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        b200: { bf16: { tp: 2, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        b300: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        mi300x: { bf16: { tp: 2, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        mi325x: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        mi355x: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } }
      },
      '35b': {
        h100: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        h200: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        b200: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        b300: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        mi300x: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        mi325x: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        mi355x: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } }
      },
      '27b': {
        h100: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        h200: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        b200: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        b300: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        mi300x: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        mi325x: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
        mi355x: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } }
      },
      '9b': {
        h100: { bf16: { tp: 1, mem: 0.8 } },
        h200: { bf16: { tp: 1, mem: 0.8 } },
        b200: { bf16: { tp: 1, mem: 0.8 } },
        b300: { bf16: { tp: 1, mem: 0.8 } },
        mi300x: { bf16: { tp: 1, mem: 0.8 } },
        mi325x: { bf16: { tp: 1, mem: 0.8 } },
        mi355x: { bf16: { tp: 1, mem: 0.8 } }
      },
      '4b': {
        h100: { bf16: { tp: 1, mem: 0.8 } },
        h200: { bf16: { tp: 1, mem: 0.8 } },
        b200: { bf16: { tp: 1, mem: 0.8 } },
        b300: { bf16: { tp: 1, mem: 0.8 } },
        mi300x: { bf16: { tp: 1, mem: 0.8 } },
        mi325x: { bf16: { tp: 1, mem: 0.8 } },
        mi355x: { bf16: { tp: 1, mem: 0.8 } }
      },
      '2b': {
        h100: { bf16: { tp: 1, mem: 0.8 } },
        h200: { bf16: { tp: 1, mem: 0.8 } },
        b200: { bf16: { tp: 1, mem: 0.8 } },
        b300: { bf16: { tp: 1, mem: 0.8 } },
        mi300x: { bf16: { tp: 1, mem: 0.8 } },
        mi325x: { bf16: { tp: 1, mem: 0.8 } },
        mi355x: { bf16: { tp: 1, mem: 0.8 } }
      },
      '0.8b': {
        h100: { bf16: { tp: 1, mem: 0.8 } },
        h200: { bf16: { tp: 1, mem: 0.8 } },
        b200: { bf16: { tp: 1, mem: 0.8 } },
        b300: { bf16: { tp: 1, mem: 0.8 } },
        mi300x: { bf16: { tp: 1, mem: 0.8 } },
        mi325x: { bf16: { tp: 1, mem: 0.8 } },
        mi355x: { bf16: { tp: 1, mem: 0.8 } }
      }
    },

    generateCommand: function (values) {
      const { model, hardware, quantization, speculative, mambaCache } = values;

      const hwConfig = this.modelConfigs[model]?.[hardware]?.[quantization];
      if (!hwConfig) {
        if (quantization === 'fp4') {
          return '# FP4 requires B200/B300 (Blackwell) and is only available for Qwen3.5-397B-A17B';
        }
        return '# Please select a valid hardware and quantization combination';
      }

      let modelName;
      if (quantization === 'fp4') {
        modelName = 'nvidia/Qwen3.5-397B-A17B-NVFP4';
      } else {
        const suffix = MODEL_SUFFIX[model];
        const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
        modelName = `${this.modelFamily}/Qwen3.5-${suffix}${quantSuffix}`;
      }

      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;

      // Initialize the base command
      let cmd = `sglang serve --model-path ${modelName}`;
      if (tpValue > 1) {
        cmd += ` \\\n  --tp ${tpValue}`;
      }

      // Force Mamba V1 for AMD GPUs (V2 requires FLA backend)
      const amdGpus = ['mi300x', 'mi325x', 'mi355x'];
      const actualMambaCache = amdGpus.includes(hardware) ? 'v1' : mambaCache;
      const adjustedValues = { ...values, mambaCache: actualMambaCache };

      // Apply commandRule from all options except quantization (handled via model name)
      Object.entries(this.options).forEach(([key, option]) => {
        if (key === 'quantization' || key === 'model') return;
        // Skip options that don't pass their condition
        if (option.condition && !option.condition(values)) return;
        if (option.commandRule) {
          const rule = option.commandRule(adjustedValues[key]);
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

      // Append AMD GPU-specific backend configurations
      if (hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x') {
        cmd += ` \\\n  --attention-backend triton`;
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
