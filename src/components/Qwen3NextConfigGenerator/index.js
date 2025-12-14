import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * Qwen3-Next Configuration Generator
 * Supports Qwen3-Next 80B model with speculative decoding option
 */
const Qwen3NextConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',
    
    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h200', label: 'H200', default: false },
          { id: 'h100', label: 'H100', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '80b', label: '80B', subtitle: 'MOE', default: true }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', subtitle: 'Full Weights', default: true },
          { id: 'fp8', label: 'FP8', subtitle: 'High Throughput', default: false }
        ]
      },
      thinking: {
        name: 'thinking',
        title: 'Thinking Capabilities',
        items: [
          { id: 'instruct', label: 'Instruct', subtitle: 'General Purpose', default: true },
          { id: 'thinking', label: 'Thinking', subtitle: 'Reasoning / CoT', default: false }
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
        title: 'Speculative Decoding',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ]
      }
    },
    
    modelConfigs: {
      '80b': {
        baseName: '80B-A3B',
        isMOE: true,
        h100: { tp: 4, ep: 0, bf16: true, fp8: true },
        h200: { tp: 2, ep: 0, bf16: true, fp8: true },
        b200: { tp: 2, ep: 0, bf16: true, fp8: true }
      }
    },
    
    generateCommand: function(values) {
      const { hardware, modelsize, quantization, thinking, toolcall, speculative } = values;
      
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
      const modelName = `Qwen/Qwen3-Next-${modelConfig.baseName}${thinkingSuffix}${quantSuffix}`;
      
      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;
      
      // Add TP
      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
      }
      
      // Add EP if needed
      let ep = hwConfig.ep;
      if (quantization === 'fp8' && hwConfig.tp >= 4) {
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
      
      // Add speculative decoding if enabled
      if (speculative === 'enabled') {
        cmd += ` \\\n  --speculative-algorithm NEXTN \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4`;
      }
      
      return cmd;
    }
  };
  
  return <ConfigGenerator config={config} />;
};

export default Qwen3NextConfigGenerator;

