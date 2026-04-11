import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * GLM-5 Configuration Generator
 * Supports GLM-5 744B (40B active) MoE model deployment configuration
 * with BF16/FP8 quantization, reasoning parser, DP attention, and speculative decoding
 *
 * GPU requirements:
 *   H100: FP8 tp=16, BF16 tp=32
 *   H200: FP8 tp=8, BF16 tp=16
 *   B200: NVFP4 tp=4, FP8 tp=8, BF16 tp=16
 *   MI300X/MI325X: BF16 tp=8
 *   MI355X: BF16 tp=8
 */
const GLM5ConfigGenerator = () => {
  const config = {
    modelFamily: 'zai-org',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false },
          { id: 'h100', label: 'H100', default: false },
          { id: 'mi300x', label: 'MI300X/MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        getDynamicItems: (values) => {
          const hw = values.hardware;
          const isAMD = hw === 'mi300x' || hw === 'mi355x';
          const isB200 = hw === 'b200';
          return [
            { id: 'bf16', label: 'BF16', subtitle: 'Full Weights', default: isAMD },
            { id: 'fp8', label: 'FP8', subtitle: 'High Throughput', default: !isAMD && !isB200, disabled: isAMD, disabledReason: isAMD ? 'FP8 not verified on AMD' : '' },
            { id: 'nvfp4', label: 'NVFP4', subtitle: 'Highest Throughput', default: isB200, disabled: !isB200, disabledReason: !isB200 ? 'NVFP4 only available on B200' : '' }
          ];
        }
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        condition: (values) => values.quantization !== 'nvfp4',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser glm45' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        condition: (values) => values.quantization !== 'nvfp4',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser glm47' : null
      },
      dpattention: {
        name: 'dpattention',
        title: 'DP Attention',
        condition: (values) => values.quantization !== 'nvfp4',
        items: [
          { id: 'disabled', label: 'Disabled', subtitle: 'Low Latency', default: true },
          { id: 'enabled', label: 'Enabled', subtitle: 'High Throughput', default: false }
        ],
        // dp value is dynamic (matches tp), handled in generateCommand
        commandRule: null
      },
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding',
        condition: (values) => values.hardware !== 'mi300x' && values.hardware !== 'mi355x' && values.quantization !== 'nvfp4',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4' : null
      }
    },

    // BF16 always needs 2x GPUs compared to FP8
    modelConfigs: {
      h100: { fp8: { tp: 16, mem: 0.85 }, bf16: { tp: 32, mem: 0.85 } },
      h200: { fp8: { tp: 8, mem: 0.85 }, bf16: { tp: 16, mem: 0.85 } },
      b200: { nvfp4: { tp: 4, mem: 0.9 }, fp8: { tp: 8, mem: 0.9 }, bf16: { tp: 16, mem: 0.9 } },
      mi300x: { bf16: { tp: 8, mem: 0.80 } },
      mi355x: { bf16: { tp: 8, mem: 0.80 } }
    },

    generateCommand: function (values) {
      const { hardware, quantization } = values;
      const isAMD = hardware === 'mi300x' || hardware === 'mi355x';
      const isNVFP4 = quantization === 'nvfp4';

      // AMD only supports BF16; NVIDIA supports BF16, FP8, and NVFP4 (B200 only)
      const effectiveQuant = isAMD ? 'bf16' : quantization;

      // Model name varies by quantization
      let modelName;
      if (isNVFP4) {
        modelName = 'nvidia/GLM-5-NVFP4';
      } else {
        const modelSuffix = effectiveQuant === 'fp8' ? '-FP8' : '';
        modelName = `${this.modelFamily}/GLM-5${modelSuffix}`;
      }

      const hwConfig = this.modelConfigs[hardware][effectiveQuant];
      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;

      let cmd = 'sglang serve \\\n';
      cmd += `  --model ${modelName}`;
      cmd += ` \\\n  --tp ${tpValue}`;

      // NVFP4 B200: trtllm NSA backends, flashinfer fusion, FP8 KV cache
      if (isNVFP4) {
        cmd += ' \\\n  --trust-remote-code';
        cmd += ' \\\n  --quantization modelopt_fp4';
        cmd += ' \\\n  --kv-cache-dtype fp8_e4m3';
        cmd += ' \\\n  --nsa-decode-backend trtllm';
        cmd += ' \\\n  --nsa-prefill-backend trtllm';
        cmd += ' \\\n  --moe-runner-backend flashinfer_trtllm';
        cmd += ' \\\n  --enable-flashinfer-allreduce-fusion';
        cmd += ' \\\n  --enable-dp-lm-head';
        cmd += ' \\\n  --disable-radix-cache';
        cmd += ' \\\n  --max-prefill-tokens 32768';
        cmd += ' \\\n  --chunked-prefill-size 32768';
        cmd += ` \\\n  --mem-fraction-static ${memFraction}`;
        cmd += ' \\\n  --scheduler-recv-interval 10';
        cmd += ' \\\n  --tokenizer-worker-num 6';
        return cmd;
      }

      // AMD-specific: NSA tilelang backend
      if (isAMD) {
        cmd += ' \\\n  --trust-remote-code';
        cmd += ' \\\n  --nsa-prefill-backend tilelang';
        cmd += ' \\\n  --nsa-decode-backend tilelang';
        cmd += ' \\\n  --chunked-prefill-size 131072';
        cmd += ' \\\n  --watchdog-timeout 1200';
      }

      // DP Attention: --dp matches --tp
      if (values.dpattention === 'enabled') {
        cmd += ` \\\n  --dp ${tpValue} \\\n  --enable-dp-attention`;
      }

      // Apply commandRule from all options
      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      // B200 FP8: all optimized flags consolidated
      if (hardware === 'b200' && effectiveQuant === 'fp8') {
        cmd += ' \\\n  --ep 1';
        cmd += ' \\\n  --quantization fp8';
        cmd += ' \\\n  --attention-backend nsa';
        cmd += ' \\\n  --nsa-decode-backend trtllm';
        cmd += ' \\\n  --nsa-prefill-backend trtllm';
        cmd += ' \\\n  --moe-runner-backend flashinfer_trtllm';
        cmd += ' \\\n  --enable-flashinfer-allreduce-fusion';
      }

      // Memory fraction based on hardware and quantization
      cmd += ` \\\n  --mem-fraction-static ${memFraction}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default GLM5ConfigGenerator;
