import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * NVIDIA Nemotron-Nano-3-30B-A3B Configuration Generator
 */
const NemotronConfigGenerator = () => {
  const config = {
    modelFamily: 'nvidia',
    
    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false }
        ]
      },
      modelVariant: {
        name: 'modelVariant',
        title: 'Model Variant',
        items: [
          { id: 'bf16', label: 'BF16', default: false },
          { id: 'fp8', label: 'FP8', default: true }
        ]
      },
      tp: {
        name: 'tp',
        title: 'Tensor Parallel (TP)',
        items: [
          { id: '1', label: 'TP=1 (current SGL support)', default: true },
          { id: '2', label: 'TP=2 (coming in future SGL)', default: false },
          { id: '4', label: 'TP=4 (coming in future SGL)', default: false },
          { id: '8', label: 'TP=8 (coming in future SGL)', default: false }
        ]
      },
      kvcache: {
        name: 'kvcache',
        title: 'KV Cache DType',
        items: [
          { id: 'fp8_e4m3', label: 'fp8_e4m3 (recommended)', default: true },
          { id: 'bf16', label: 'bf16', default: false }
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
        default: '30000',
        placeholder: '30000'
      }
    },
    
    generateCommand: function(values) {
      const { hardware, modelVariant, tp, kvcache, host, port } = values;
      
      // Default to FP8 if not selected
      const variant = modelVariant || 'fp8';
      const baseName = 'NVIDIA-Nemotron-3-Nano-30B-A3B';
      
      const modelName =
        variant === 'bf16'
          ? `${this.modelFamily}/${baseName}-BF16`
          : `${this.modelFamily}/${baseName}-FP8`;
      
      // Current SGL version only supports TP=1 for this model
      const effectiveTp = '1';
      
      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelName} \\\n`;
      cmd += `  --trust-remote-code \\\n`;
      cmd += `  --tp ${effectiveTp} \\\n`;
      cmd += `  --kv-cache-dtype ${kvcache} \\\n`;
      
      // B200 uses FlashInfer backend; H200 can use the default attention backend
      if (hardware === 'b200') {
        cmd += `  --attention-backend flashinfer \\\n`;
      }
      
      cmd += `  --host ${host || '0.0.0.0'} \\\n`;
      cmd += `  --port ${port || '30000'}`;
      
      return cmd;
    }
  };
  
  return <ConfigGenerator config={config} />;
};

export default NemotronConfigGenerator;
