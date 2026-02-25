import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Llama 4 Configuration Generator
 * Supports Llama 4 Scout and Llama 4 Maverick deployment configuration
 */
const Llama4ConfigGenerator = () => {
  const config = {
    modelFamily: 'meta-llama',

    options: {
      model: {
        name: 'model',
        title: 'Model',
        items: [
          { id: 'scout', label: 'Llama 4 Scout (109B)', default: true },
          { id: 'maverick', label: 'Llama 4 Maverick (400B)', default: false }
        ]
      },
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        getDynamicItems: (values) => {
          if (values.model === 'maverick') {
            return [
              { id: 'b200', label: 'B200', default: false },
              { id: 'h100', label: 'H100', default: false },
              { id: 'h200', label: 'H200', default: true }
            ];
          }
          return [
            { id: 'b200', label: 'B200', default: false },
            { id: 'h100', label: 'H100', default: true },
            { id: 'h200', label: 'H200', default: false }
          ];
        }
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
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
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding (EAGLE3)',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enable EAGLE3', default: false }
        ]
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
      const { model, hardware, quantization, toolcall, speculative, host, port } = values;

      const isScout = model === 'scout';
      const modelPath = isScout
        ? 'meta-llama/Llama-4-Scout-17B-16E-Instruct'
        : 'meta-llama/Llama-4-Maverick-17B-128E-Instruct';

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath}`;
      cmd += ` \\\n  --tp 8`;

      if (quantization === 'fp8') {
        cmd += ` \\\n  --quantization fp8`;
      }

      if (toolcall === 'enabled') {
        cmd += ` \\\n  --tool-call-parser pythonic`;
      }

      if (speculative === 'enabled') {
        const draftModel = isScout
          ? 'lmsys/sglang-EAGLE3-Llama-4-Scout-17B-16E-Instruct-v1'
          : 'nvidia/Llama-4-Maverick-17B-128E-Eagle3';
        cmd += ` \\\n  --speculative-algorithm EAGLE3`;
        cmd += ` \\\n  --speculative-draft-model-path ${draftModel}`;
        cmd += ` \\\n  --speculative-num-steps 3`;
        cmd += ` \\\n  --speculative-eagle-topk 1`;
        cmd += ` \\\n  --speculative-num-draft-tokens 4`;
        cmd += ` \\\n  --mem-fraction-static 0.75`;
        cmd += ` \\\n  --cuda-graph-max-bs 2`;
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

export default Llama4ConfigGenerator;
