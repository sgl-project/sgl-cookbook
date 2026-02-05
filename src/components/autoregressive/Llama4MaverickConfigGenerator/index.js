import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Llama 4-Maverick Configuration Generator
 */
const Llama4MaverickConfigGenerator = () => {
  const config = {
    modelFamily: 'meta-llama',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'mi300x', label: 'MI300x', default: false },
          { id: 'mi325x', label: 'MI325x', default: false },
          { id: 'mi355x', label: 'MI355x', default: false }
        ]
      },
      },
      host: {
        name: 'host',
        title: 'Host',
        type: 'text',
        default: '0.0.0.0',
        placeholder: '0.0.0.0'
      },
      port: {
        name: 'port',
        title: 'Port',
        type: 'text',
        default: '8000',
        placeholder: '8000'
      }
    },

    generateCommand: function(values) {
      const { hardware, quantization, toolcall, speculative, host, port } = values;

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model-path meta-llama/Llama-4-Scout-17B-16E-Instruct`;

      if (hardware === 'h100' || hardware === 'h200') {
        cmd += ` \\\n  --tp 8`;
      } else if (hardware === 'b200') {
        cmd += ` \\\n  --tp 8`;
      }else if (hardware === 'mi300x' || hardware === 'mi325x' || hardware === 'mi355x') {
        cmd += ` \\\n  --tp 8`;
      }

      if (quantization === 'fp8') {
        cmd += ` \\\n  --quantization fp8`;
      }

      if (toolcall === 'enabled') {
        cmd += ` \\\n  --tool-call-parser pythonic`;
      }

      if (speculative === 'enabled') {
        cmd += ` \\\n  --speculative-algorithm EAGLE3 \\\n`;
        cmd += `  --speculative-draft-model-path lmsys/sglang-EAGLE3-Llama-4-Scout-17B-16E-Instruct-v1 \\\n`;
        cmd += `  --speculative-num-steps 3 \\\n`;
        cmd += `  --speculative-eagle-topk 1 \\\n`;
        cmd += `  --speculative-num-draft-tokens 4 \\\n`;
        cmd += `  --mem-fraction-static 0.75 \\\n`;
        cmd += `  --cuda-graph-max-bs 2`;
      }

      cmd += ` \\\n  --enable-multimodal`;
      cmd += ` \\\n  --context-length 65536`;
      cmd += ` \\\n  --dtype bfloat16`;
      cmd += ` \\\n  --trust-remote-code`;
      cmd += ` \\\n  --host ${host || '0.0.0.0'}`;
      cmd += ` \\\n  --port ${port || '8000'}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Llama4MaverickConfigGenerator;
