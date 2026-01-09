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
        visibleIf: (values) => values.modelsize === '405b', // 只有选了 405b 才显示
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

      // Compute model name based on size and category
      const sizeMap = {
        '8b': '8B',
        '70b': '70B',
        '405b': '405B'
      };
      const sizeToken = sizeMap[modelsize] || '70B';
      const categorySuffix = category === 'instruct' ? '-Instruct' : '';
      const modelName = `meta-llama/Llama-3.1-${sizeToken}${categorySuffix}`;

      // Collect command args to avoid stray blank lines
      const args = [];
      if (quantization === 'fp8') {
        args.push(`--model-path ${modelName}-FP8`);
      }else{
        args.push(`--model-path ${modelName}`);
      }

      // Tensor parallel
      if (modelsize === '405b'){
        args.push(`--tp 8`);
      }
      if (hardware === 'h100' || hardware=== 'h200') {
        if (modelsize === '70b') {
          args.push(`--tp 2`);
        }
      }


      if (optimization === 'throughput') {
        args.push(`--enable-dp-attention`);
        args.push(`--mem-fraction-static 0.85`);
      } else if (optimization === 'latency') {
        args.push(`--speculative-algorithm EAGLE3`);
        args.push(`--speculative-num-steps 3`);
        args.push(`--speculative-eagle-topk 1`);
        args.push(`--speculative-num-draft-tokens 4`);
        if ( modelsize === '8b' && category === 'instruct') {
          args.push(`--speculative-draft-model-path yuhuili/EAGLE3-LLaMA3.1-Instruct-8B`);
        } else{
          args.push(`--speculative-draft-model-path \${EAGLE3_MODEL_PATH}`);
        }
        args.push(`--disable-shared-experts-fusion`);
        args.push(`--max-running-requests 64`);
        args.push(`--mem-fraction-static 0.85`);
        args.push(`--kv-cache-dtype fp8_e4m3`);
        args.push(`--context-length 32768`);
      }

      if (toolcall === 'enabled') {
        // Llama tool-call parser
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
