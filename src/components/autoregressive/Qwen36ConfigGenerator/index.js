import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen3.6 Configuration Generator
 *
 * Qwen3.6-35B-A3B: MoE model (Gated DeltaNet + sparse MoE, hybrid architecture)
 *   35B total parameters, 3B activated
 *   256 experts, 8 routed + 1 shared
 *
 * GPU requirements (BF16, ~70GB weights):
 *   H100 (80GB):  tp=1
 *   H200 (141GB): tp=1
 *   B200 (180GB): tp=1
 *
 * GPU requirements (FP8, ~35GB weights):
 *   H100 (80GB):  tp=1
 *   H200 (141GB): tp=1
 *   B200 (180GB): tp=1
 */

const Qwen36ConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h100', label: 'H100', default: true },
          { id: 'h200', label: 'H200', default: false },
          { id: 'b200', label: 'B200', default: false },
          { id: 'mi300x', label: 'MI300X', default: true },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'fp8', label: 'FP8', default: true },
          { id: 'bf16', label: 'BF16', default: false }
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
        getDynamicItems: (values) => {
          const mtpEnabled = values.speculative === 'enabled';
          if (mtpEnabled) {
            return [
              { id: 'v1', label: 'V1', default: false, disabled: true },
              { id: 'v2', label: 'V2', default: true }
            ];
          }
          return [
            { id: 'v1', label: 'V1', default: true },
            { id: 'v2', label: 'V2', default: false }
          ];
        },
        commandRule: (value) => value === 'v2' ? '--mamba-scheduler-strategy extra_buffer' : null
      }
    },

    modelConfigs: {
      h100: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
      h200: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
      b200: { bf16: { tp: 1, mem: 0.8 }, fp8: { tp: 1, mem: 0.8 } },
      mi300x: { bf16: { tp: 4, mem: 0.8 }, fp8: { tp: 4, mem: 0.8 } },
      mi325x: { bf16: { tp: 4, mem: 0.8 }, fp8: { tp: 4, mem: 0.8 } },
      mi355x: { bf16: { tp: 4, mem: 0.8 }, fp8: { tp: 4, mem: 0.8 } }
    },

    generateCommand: function (values) {
      const { hardware, quantization, speculative } = values;
      const isNvidia = hardware === 'h100' || hardware === 'h200' || hardware === 'b200';
      
      const hwConfig = this.modelConfigs[hardware]?.[quantization];
      if (!hwConfig) {
        return '# Please select a valid hardware and quantization combination';
      }

      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `${this.modelFamily}/Qwen3.6-35B-A3B${quantSuffix}`;

      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;

      // Prepend env var if MTP is enabled
      let cmd = '';
      if (speculative === 'enabled' && isNvidia ) {
        cmd += 'SGLANG_ENABLE_SPEC_V2=1 ';
      }
      // AMD MTP configs
      if (speculative === 'enabled' && !isNvidia ) {
        cmd += ` \\\n  --speculative-algorithm EAGLE`;
        cmd += ` \\\n  --speculative-num-steps 3`;
        cmd += ` \\\n  --speculative-eagle-topk 1`;
        cmd += ` \\\n  --speculative-num-draft-tokens 4`;       
      }
      
      cmd += `sglang serve --model-path ${modelName}`;
      if (tpValue > 1) {
        cmd += ` \\\n  --tp ${tpValue}`;
      }

      // MTP requires V2 mamba radix cache
      const actualMambaCache = speculative === 'enabled' ? 'v2' : values.mambaCache;
      const adjustedValues = { ...values, mambaCache: actualMambaCache };

      // Apply commandRule from all options except quantization and hardware
      Object.entries(this.options).forEach(([key, option]) => {
        if (key === 'quantization' || key === 'hardware') return;
        if (option.commandRule) {
          const rule = option.commandRule(adjustedValues[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      // Blackwell backend
      if (hardware === 'b200') {
        cmd += ` \\\n  --attention-backend trtllm_mha`;
      }

      // Add memory fraction last
      cmd += ` \\\n  --mem-fraction-static ${memFraction}`;

      // AMD-specific flags
      if (!isNvidia) {
        cmd += ` \\\n  --attention-backend triton`;
        cmd += ` \\\n  --ep-size 1`;
        cmd += ` \\\n  --enable-flashinfer-allreduce-fusion`;
        cmd += ` \\\n  --disable-radix-cache`;
        cmd += ` \\\n  --trust-remote-code`;    
      }      
      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen36ConfigGenerator;
