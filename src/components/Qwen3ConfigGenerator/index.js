import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * Qwen3 Configuration Generator
 * Supports multiple Qwen3 model sizes (235B, 30B, 32B, 14B, 8B, 4B, 1.7B, 0.6B)
 */
const Qwen3ConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',
    
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
          { id: '235b', label: '235B', subtitle: 'MOE', default: true },
          { id: '30b', label: '30B', subtitle: 'MOE', default: false },
          { id: '32b', label: '32B', subtitle: 'Dense', default: false },
          { id: '14b', label: '14B', subtitle: 'Dense', default: false },
          { id: '8b', label: '8B', subtitle: 'Dense', default: false },
          { id: '4b', label: '4B', subtitle: 'Dense', default: false },
          { id: '1.7b', label: '1.7B', subtitle: 'Dense', default: false },
          { id: '0.6b', label: '0.6B', subtitle: 'Dense', default: false }
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
      thinking: {
        name: 'thinking',
        title: 'Thinking Capabilities',
        items: [
          { id: 'instruct', label: 'Instruct', default: true },
          { id: 'thinking', label: 'Thinking', default: false }
        ]
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ]
      }
    },
    
    modelConfigs: {
      '235b': {
        baseName: '235B-A22B',
        isMOE: true,
        h100: { tp: 8, ep: 0, bf16: true, fp8: true },
        h200: { tp: 8, ep: 0, bf16: true, fp8: true },
        b200: { tp: 8, ep: 0, bf16: true, fp8: true }
      },
      '30b': {
        baseName: '30B-A3B',
        isMOE: true,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '32b': {
        baseName: '32B',
        isMOE: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '14b': {
        baseName: '14B',
        isMOE: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '8b': {
        baseName: '8B',
        isMOE: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '4b': {
        baseName: '4B',
        isMOE: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '1.7b': {
        baseName: '1.7B',
        isMOE: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '0.6b': {
        baseName: '0.6B',
        isMOE: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      }
    },
    
    specialCommands: {
      'h100-235b-bf16-instruct': '# Error: Model is too large, cannot fit into 8*H100\n# Please use H200 (141GB) or select FP8 quantization',
      'h100-235b-bf16-thinking': '# Error: Model is too large, cannot fit into 8*H100\n# Please use H200 (141GB) or select FP8 quantization'
    },
    
    generateCommand: function(values) {
      const { hardware, modelsize, quantization, thinking, toolcall } = values;
      const commandKey = `${hardware}-${modelsize}-${quantization}-${thinking}`;
      
      // Check for special error cases
      if (this.specialCommands[commandKey]) {
        return this.specialCommands[commandKey];
      }
      
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
      const thinkingSuffix = thinking === 'thinking' ? '-Thinking' : '-Instruct';
      const modelName = `Qwen/Qwen3-${modelConfig.baseName}${thinkingSuffix}${quantSuffix}`;
      
      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;
      
      // Add TP if needed
      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
      }
      
      // Calculate EP (Expert Parallelism)
      let ep = hwConfig.ep;
      if (quantization === 'fp8' && hwConfig.tp === 8) {
        ep = 2;
      }
      
      if (ep > 0) {
        cmd += ` \\\n  --ep ${ep}`;
      }
      
      // Add tool call parser if enabled
      if (toolcall === 'enabled') {
        cmd += ` \\\n  --tool-call-parser qwen`;
      }
      
      // Add reasoning parser for thinking mode
      if (thinking === 'thinking') {
        cmd += ` \\\n  --reasoning-parser qwen3`;
      }
      
      return cmd;
    }
  };
  
  return <ConfigGenerator config={config} />;
};

export default Qwen3ConfigGenerator;

