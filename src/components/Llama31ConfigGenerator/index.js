import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * Llama 3.1 70B Configuration Generator
 */
const Llama31ConfigGenerator = () => {
  const config = {
    modelFamily: 'meta-llama',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h100', label: 'H100 (4x)', default: true },
          { id: 'h200', label: 'H200 (4x)', default: false }
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
      const { hardware, optimization } = values;

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model meta-llama/Llama-3.1-70B-Instruct \\\n`;
      cmd += `  --tp 4`;

      if (optimization === 'throughput') {
        cmd += ` \\\n  --enable-dp-attention \\\n`;
        cmd += `  --mem-fraction-static 0.85`;
      } else if (optimization === 'latency') {
        cmd += ` \\\n  --speculative-algorithm EAGLE \\\n`;
        cmd += `  --speculative-num-steps 3 \\\n`;
        cmd += `  --speculative-eagle-topk 1 \\\n`;
        cmd += `  --speculative-num-draft-tokens 4 \\\n`;
        cmd += `  --disable-shared-experts-fusion \\\n`;
        cmd += `  --max-running-requests 64 \\\n`;
        cmd += `  --mem-fraction-static 0.85 \\\n`;
        cmd += `  --kv-cache-dtype fp8_e4m3 \\\n`;
        cmd += `  --context-length 32768 \\\n`;
        cmd += `  --quantization fp8`;
      }

      cmd += ` \\\n  --host 0.0.0.0 \\\n`;
      cmd += `  --port 8000`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Llama31ConfigGenerator;
