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
          { id: 'h100', label: 'H100', default: true }
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
      const { hardware, optimization, modelsize, category, toolcall } = values;

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
      args.push(`--model ${modelName}`);

      // Tensor parallel: include only for 405B on H100
      if (hardware === 'h100' && modelsize === '405b') {
        args.push(`--tp 8`);
      }

      if (optimization === 'throughput') {
        args.push(`--enable-dp-attention`);
        args.push(`--mem-fraction-static 0.85`);
      } else if (optimization === 'latency') {
        args.push(`--speculative-algorithm EAGLE`);
        args.push(`--speculative-num-steps 3`);
        args.push(`--speculative-eagle-topk 1`);
        args.push(`--speculative-num-draft-tokens 4`);
        args.push(`--disable-shared-experts-fusion`);
        args.push(`--max-running-requests 64`);
        args.push(`--mem-fraction-static 0.85`);
        args.push(`--kv-cache-dtype fp8_e4m3`);
        args.push(`--context-length 32768`);
      }

      if (toolcall === 'enabled') {
        // Llama tool-call parser
        args.push(`--tool-call-parser llama`);
      }

      args.push(`--host 0.0.0.0`);
      args.push(`--port 8000`);

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  ${args.join(' \\\n  ')}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Llama31ConfigGenerator;
