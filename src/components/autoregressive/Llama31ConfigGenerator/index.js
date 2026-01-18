import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Llama 3.1 Configuration Generator
 */
const Llama31ConfigGenerator = () => {
  const config = {
    modelFamily: 'meta-llama',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h100', label: 'H100', default: true },
          { id: 'h200', label: 'H200', default: false },
          { id: 'b200', label: 'B200', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '8b', label: '8B', default: false },
          { id: '70b', label: '70B', default: true },
          { id: '405b', label: '405B', default: false }
        ]
      },
      category: {
        name: 'category',
        title: 'Category',
        items: [
          { id: 'base', label: 'Base', default: false },
          { id: 'instruct', label: 'Instruct', default: true }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        visibleIf: (values) => {
          // Show for 405B on all platforms, or for any size on AMD GPUs
          const isAMD = values.hardware === 'mi300x' || values.hardware === 'mi325x' || values.hardware === 'mi355x';
          return values.modelsize === '405b' || isAMD;
        },
        items: [
          { id: 'bf16', label: 'BF16', default: true },
          { id: 'fp8', label: 'FP8', default: false }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ]
      },
      optimization: {
        name: 'optimization',
        title: 'Optimization Mode',
        items: [
          { id: 'basic', label: 'Basic', default: true },
          { id: 'throughput', label: 'Throughput Optimized', default: false },
          { id: 'latency', label: 'Latency Optimized', default: false }
        ]
      }
    },

    generateCommand: function(values) {
      const { hardware, optimization, modelsize, category, toolcall, quantization } = values;

      const isAMD = hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x';

      // Model size mapping
      const sizeMap = {
        '8b': '8B',
        '70b': '70B',
        '405b': '405B'
      };
      const sizeToken = sizeMap[modelsize] || '70B';
      const categorySuffix = category === 'instruct' ? '-Instruct' : '';

      // Determine model path
      let modelPath;
      if (quantization === 'fp8' && category === 'instruct') {
        if (modelsize === '405b') {
          // Meta official FP8 for 405B
          modelPath = `meta-llama/Llama-3.1-${sizeToken}${categorySuffix}-FP8`;
        } else if (isAMD) {
          // AMD FP8-KV variants for 70B/8B on AMD GPUs
          modelPath = `amd/Llama-3.1-${sizeToken}${categorySuffix}-FP8-KV`;
        } else {
          modelPath = `meta-llama/Llama-3.1-${sizeToken}${categorySuffix}`;
        }
      } else {
        modelPath = `meta-llama/Llama-3.1-${sizeToken}${categorySuffix}`;
      }

      // Determine TP size
      let tpSize;
      if (isAMD) {
        // AMD GPU TP configuration
        const amdTpConfig = {
          'mi300x': {
            '405b': { bf16: 8, fp8: 4 },
            '70b': { bf16: 1, fp8: 1 },
            '8b': { bf16: 1, fp8: 1 }
          },
          'mi325x': {
            '405b': { bf16: 8, fp8: 4 },
            '70b': { bf16: 1, fp8: 1 },
            '8b': { bf16: 1, fp8: 1 }
          },
          'mi355x': {
            '405b': { bf16: 4, fp8: 2 },
            '70b': { bf16: 1, fp8: 1 },
            '8b': { bf16: 1, fp8: 1 }
          }
        };
        tpSize = quantization === 'fp8'
          ? amdTpConfig[hardware][modelsize].fp8
          : amdTpConfig[hardware][modelsize].bf16;
      } else {
        // NVIDIA GPU TP configuration
        if (modelsize === '405b') {
          tpSize = 8;
        } else if (modelsize === '70b' && (hardware === 'h100' || hardware === 'h200')) {
          tpSize = 2;
        }
      }

      // Build command args
      const args = [];
      args.push(`--model-path ${modelPath}`);

      if (tpSize) {
        args.push(`--tp ${tpSize}`);
      }

      // Add quantization flag only if not using FP8 variant model
      if (quantization === 'fp8' && category !== 'instruct') {
        args.push(`--quantization fp8`);
      }

      // NVIDIA-specific optimizations
      if (!isAMD) {
        if (optimization === 'throughput') {
          args.push(`--enable-dp-attention`);
          args.push(`--mem-fraction-static 0.85`);
        } else if (optimization === 'latency') {
          args.push(`--speculative-algorithm EAGLE3`);
          args.push(`--speculative-num-steps 3`);
          args.push(`--speculative-eagle-topk 1`);
          args.push(`--speculative-num-draft-tokens 4`);
          if (modelsize === '8b' && category === 'instruct') {
            args.push(`--speculative-draft-model-path yuhuili/EAGLE3-LLaMA3.1-Instruct-8B`);
          } else {
            args.push(`--speculative-draft-model-path \${EAGLE3_MODEL_PATH}`);
          }
          args.push(`--disable-shared-experts-fusion`);
          args.push(`--max-running-requests 64`);
          args.push(`--mem-fraction-static 0.85`);
          args.push(`--kv-cache-dtype fp8_e4m3`);
          args.push(`--context-length 32768`);
        }
      }

      if (toolcall === 'enabled') {
        args.push(`--tool-call-parser llama3`);
      }

      let cmd = 'sglang serve \\\n';
      cmd += `  ${args.join(' \\\n  ')}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Llama31ConfigGenerator;
