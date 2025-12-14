import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * GLM-4.6V Configuration Generator
 * Supports GLM-4.6V (106B) and GLM-4.6V-Flash (9B) models
 */
const GLM46VConfigGenerator = () => {
  const config = {
    modelFamily: 'zai-org',
    
    // Model configurations for different sizes and hardware
    modelConfigs: {
      '106b': {
        baseName: 'GLM-4.6V',
        h100: { tp: 8, bf16: true, fp8: true },
        h200: { tp: 8, bf16: true, fp8: true },
        b200: { tp: 8, bf16: true, fp8: true }
      },
      '9b': {
        baseName: 'GLM-4.6V-Flash',
        h100: { tp: 1, bf16: true, fp8: true },
        h200: { tp: 1, bf16: true, fp8: true },
        b200: { tp: 1, bf16: true, fp8: true }
      }
    },
    
    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h100', label: 'H100', default: false },
          { id: 'h200', label: 'H200', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '106b', label: '106B', subtitle: 'GLM-4.6V', default: true },
          { id: '9b', label: '9B', subtitle: 'GLM-4.6V-Flash', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', default: true },
          { id: 'fp8', label: 'FP8', default: false }
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'enabled', label: 'Enabled', default: true },
          { id: 'disabled', label: 'Disabled', default: false }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'enabled', label: 'Enabled', default: true },
          { id: 'disabled', label: 'Disabled', default: false }
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
      const { hardware, modelsize, quantization, reasoning, toolcall, host, port } = values;
      
      // Get model configuration
      const modelConfig = this.modelConfigs[modelsize];
      if (!modelConfig) {
        return `# Error: Unknown model size: ${modelsize}`;
      }
      
      const hwConfig = modelConfig[hardware];
      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }
      
      // Build model name
      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';
      const modelName = `${this.modelFamily}/${modelConfig.baseName}${quantSuffix}`;
      
      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;
      
      // Add TP if needed
      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
      }
      
      // Add reasoning parser if enabled
      if (reasoning === 'enabled') {
        cmd += ` \\\n  --reasoning-parser glm45`;
      }
      
      // Add tool call parser if enabled
      if (toolcall === 'enabled') {
        cmd += ` \\\n  --tool-call-parser glm45`;
      }
      
      // Add host and port
      const finalHost = host || '0.0.0.0';
      const finalPort = port || '30000';
      cmd += ` \\\n  --host ${finalHost} \\\n  --port ${finalPort}`;
      
      return cmd;
    }
  };
  
  return <ConfigGenerator config={config} />;
};

export default GLM46VConfigGenerator;

