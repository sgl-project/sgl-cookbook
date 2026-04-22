import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * GLM-5.1 Configuration Generator
 * Supports GLM-5.1 744B (40B active) MoE model deployment configuration
 * with BF16/FP8/MXFP4 quantization, reasoning parser, DP attention, and speculative decoding
 *
 * GPU requirements (BF16 needs 2x GPUs compared to FP8):
 *   H100: FP8 tp=16, BF16 tp=32
 *   H200: FP8 tp=8, BF16 tp=16
 *   B200: FP8 tp=8, BF16 tp=16
 *   GB300: FP8 tp=4
 *   MI300X: BF16 tp=8, FP8 tp=8
 *   MI325X: BF16 tp=8, FP8 tp=4
 *   MI355X: BF16 tp=8, FP8 tp=4, MXFP4 tp=2
 */
const GLM51ConfigGenerator = () => {
  const config = {
    modelFamily: 'zai-org',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: false },
          { id: 'b200', label: 'B200', default: false },
          { id: 'gb300', label: 'GB300', default: false },
          { id: 'h100', label: 'H100', default: false },
          { id: 'mi300x', label: 'MI300X', default: true },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        getDynamicItems: (values) => {
          const hw = values.hardware;
          const isAMD = hw === 'mi300x' || hw === 'mi325x' || hw === 'mi355x';
          const isMI355X = hw === 'mi355x';
          const isGB300 = hw === 'gb300';

          return [
            {
              id: 'bf16',
              label: 'BF16',
              subtitle: 'Full Weights',
              default: isAMD,
              disabled: isGB300,
              disabledReason: isGB300 ? 'BF16 is not recommended on GB300 for GLM-5.1' : ''
            },
            { id: 'fp8', label: 'FP8', subtitle: 'High Throughput', default: !isAMD },
            {
              id: 'mxfp4',
              label: 'FP4',
              subtitle: 'Ultra Low Memory',
              default: false,
              disabled: !isMI355X,
              disabledReason: !isMI355X ? 'FP4 is only supported on AMD MI355X GPU' : ''
            }
          ];
        }
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => (value === 'enabled' ? '--reasoning-parser glm45' : null)
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => (value === 'enabled' ? '--tool-call-parser glm47' : null)
      },
      dpattention: {
        name: 'dpattention',
        title: 'DP Attention',
        items: [
          { id: 'disabled', label: 'Disabled', subtitle: 'Low Latency', default: true },
          { id: 'enabled', label: 'Enabled', subtitle: 'High Throughput', default: false }
        ],
        commandRule: null
      },
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding (MTP)',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => (value === 'enabled'
          ? '--speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4'
          : null)
      }
    },

    modelConfigs: {
      h100: { fp8: { tp: 16, mem: 0.85 }, bf16: { tp: 32, mem: 0.85 } },
      h200: { fp8: { tp: 8, mem: 0.85 }, bf16: { tp: 16, mem: 0.85 } },
      b200: { fp8: { tp: 8, mem: 0.9 }, bf16: { tp: 16, mem: 0.9 } },
      gb300: { fp8: { tp: 4, mem: 0.9 } },
      mi300x: { bf16: { tp: 8, mem: 0.8 }, fp8: { tp: 8, mem: 0.85 } },
      mi325x: { bf16: { tp: 8, mem: 0.8 }, fp8: { tp: 4, mem: 0.85 } },
      mi355x: { bf16: { tp: 8, mem: 0.8 }, fp8: { tp: 4, mem: 0.85 }, mxfp4: { tp: 2, mem: 0.85 } }
    },

    generateCommand: function (values) {
      const { hardware, quantization } = values;
      const isAMD = hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x';
      const isGB300 = hardware === 'gb300';
      const isMXFP4 = quantization === 'mxfp4';

      // Determine effective quantization
      const effectiveQuant = isGB300 && quantization === 'bf16' ? 'fp8' : quantization;

      // Determine model name and path
      let modelName;
      if (isMXFP4) {
        modelName = 'amd/GLM-5.1-MXFP4';
      } else {
        const modelSuffix = effectiveQuant === 'fp8' ? '-FP8' : '';
        modelName = `${this.modelFamily}/GLM-5.1${modelSuffix}`;
      }

      const hwConfig = this.modelConfigs[hardware][effectiveQuant];
      if (!hwConfig) {
        return '# Configuration not available for the selected hardware and quantization.';
      }
      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;
      const enableSpec = values.speculative === 'enabled';

      let cmd = '';
      if (enableSpec) {
        cmd += 'SGLANG_ENABLE_SPEC_V2=1 ';
      }
      cmd += 'sglang serve \\\n';
      cmd += `  --model-path ${modelName}`;
      cmd += ` \\\n  --tensor-parallel-size ${tpValue}`;

      cmd += ' \\\n  --trust-remote-code';

      if (isAMD) {
        if (isMXFP4) {
          // MXFP4-specific flags
          cmd += ' \\\n  --nsa-prefill-backend tilelang';
          cmd += ' \\\n  --nsa-decode-backend tilelang';
          cmd += ' \\\n  --kv-cache-dtype fp8_e4m3';
          cmd += ' \\\n  --model-loader-extra-config \'{"enable_multithread_load": true, "num_threads": 8}\'';
          cmd += ' \\\n  --tokenizer-worker-num 4';
          cmd += ' \\\n  --disable-radix-cache';
        } else {
          // BF16-specific flags
          cmd += ' \\\n  --nsa-prefill-backend tilelang';
          cmd += ' \\\n  --nsa-decode-backend tilelang';
          cmd += ' \\\n  --chunked-prefill-size 131072';
          cmd += ' \\\n  --watchdog-timeout 1200';
        }
      }

      if (values.dpattention === 'enabled') {
        cmd += ` \\\n  --dp ${tpValue} \\\n  --enable-dp-attention`;
      }

      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      cmd += ` \\\n  --mem-fraction-static ${memFraction}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default GLM51ConfigGenerator;
