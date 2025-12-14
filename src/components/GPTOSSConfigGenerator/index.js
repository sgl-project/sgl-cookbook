import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * GPT-OSS Configuration Generator
 * Supports GPT-OSS 120B and 20B models with speculative decoding
 */
const GPTOSSConfigGenerator = () => {
  const config = {
    modelFamily: 'GPT-OSS',
    
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
          { id: '120b', label: '120B', subtitle: 'MOE', default: true },
          { id: '20b', label: '20B', subtitle: 'MOE', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'mxfp4', label: 'MXFP4', default: true },
          { id: 'bf16', label: 'BF16', default: false }
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
      '120b': {
        baseName: '120b',
        isMOE: true,
        h100: { tp: 8, ep: 0, mxfp4: true, bf16: false },
        h200: { tp: 8, ep: 0, mxfp4: true, bf16: false },
        b200: { tp: 8, ep: 0, mxfp4: true, bf16: false }
      },
      '20b': {
        baseName: '20b',
        isMOE: true,
        h100: { tp: 1, ep: 0, mxfp4: true, bf16: false },
        h200: { tp: 1, ep: 0, mxfp4: true, bf16: false },
        b200: { tp: 1, ep: 0, mxfp4: true, bf16: false }
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
      const thinkingSuffix = thinking === 'thinking' ? '-Thinking' : '';
      const modelName = `nvidia/gpt-oss-${modelConfig.baseName}${thinkingSuffix}`;
      
      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;
      
      // Add quantization
      if (quantization === 'mxfp4') {
        cmd += ` \\\n  --quantization mxfp4`;
      }
      
      // Add TP
      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
      }
      
      // Add tool call parser if enabled
      if (toolcall === 'enabled') {
        cmd += ` \\\n  --tool-call-parser gpt-oss`;
      }
      
      // Add reasoning parser for thinking mode
      if (thinking === 'thinking') {
        cmd += ` \\\n  --reasoning-parser gpt-oss`;
      }
      
      // Add speculative decoding if enabled
      if (speculative === 'enabled') {
        cmd += ` \\\n  --speculative-algorithm EAGLE3 \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4`;
        
        // Add draft model path based on model size and quantization
        if (modelsize === '120b' && quantization === 'mxfp4') {
          cmd += ` \\\n  --speculative-draft-model-path nvidia/gpt-oss-120b-Eagle3`;
        } else if (modelsize === '20b' && quantization === 'mxfp4') {
          cmd += ` \\\n  --speculative-draft-model-path RedHatAI/gpt-oss-20b-speculator.eagle3`;
        } else if (modelsize === '120b' && quantization === 'bf16') {
          cmd += ` \\\n  --speculative-draft-model-path zhuyksir/EAGLE3-gpt-oss-120b-bf16`;
        } else if (modelsize === '20b' && quantization === 'bf16') {
          cmd += ` \\\n  --speculative-draft-model-path zhuyksir/EAGLE3-gpt-oss-20b-bf16`;
        }
      }
      
      return cmd;
    }
  };
  
  return <ConfigGenerator config={config} />;
};

export default GPTOSSConfigGenerator;
