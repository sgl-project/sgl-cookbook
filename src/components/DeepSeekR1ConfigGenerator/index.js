import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

const DeepSeekR1ConfigGenerator = () => {
  const config = {
    modelFamily: 'deepseek-ai',
    
    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h100', label: 'H100', default: false },
          { id: 'h200', label: 'H200', default: false },
          { id: 'b200', label: 'B200', default: true }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'fp8', label: 'FP8', default: true },
          { id: 'fp4', label: 'FP4', default: false }
        ]
      },
      strategy: {
        name: 'strategy',
        title: 'Deployment Strategy',
        type: 'checkbox',
        items: [
          { id: 'tp', label: 'TP', subtitle: 'Tensor Parallel', default: true, required: true },
          { id: 'dp', label: 'DP', subtitle: 'Data Parallel', default: false },
          { id: 'ep', label: 'EP', subtitle: 'Expert Parallel', default: false },
          { id: 'mtp', label: 'MTP', subtitle: 'Multi-token Prediction', default: false }
        ]
      },
      thinking: {
        name: 'thinking',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
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
    
    generateCommand: function(values) {
      const { hardware, quantization, strategy, thinking, toolcall } = values;
      
      const strategyArray = Array.isArray(strategy) ? strategy : [];
      
      // Validation checks
      // Check H100 compatibility - H100 only supports FP8
      if (hardware === 'h100' && quantization === 'fp4') {
        return '# Error: H100 only supports FP8 quantization\n# Please select FP8 quantization or use B200 hardware';
      }
      
      // Model path based on quantization
      let modelPath = '';
      if (quantization === 'fp8') {
        modelPath = 'deepseek-ai/DeepSeek-R1-0528';
      } else if (quantization === 'fp4') {
        modelPath = 'nvidia/DeepSeek-R1-0528-FP4-v2';
      }
      
      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath}`;
      
      // Add tokenizer path only for FP4
      if (quantization === 'fp4') {
        cmd += ` \\\n  --tokenizer-path ${modelPath}`;
      }
      
      // TP strategy
      if (strategyArray.includes('tp')) {
        cmd += ` \\\n  --tp 8`;
      }
      
      // DP strategy
      if (strategyArray.includes('dp')) {
        cmd += ` \\\n  --dp 8 \\\n  --enable-dp-attention`;
      }
      
      // EP strategy (only for FP4)
      if (strategyArray.includes('ep') && quantization === 'fp4') {
        cmd += ` \\\n  --ep 8`;
      }
      
      // MTP strategy
      if (strategyArray.includes('mtp')) {
        cmd += ` \\\n  --speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4`;
      }
      
      // Disable radix cache (always)
      cmd += ` \\\n  --disable-radix-cache`;
      
      // Quantization
      if (quantization === 'fp8') {
        cmd += ` \\\n  --quantization fp8`;
      } else if (quantization === 'fp4') {
        cmd += ` \\\n  --quantization modelopt_fp4`;
      }
      
      // Attention backend (B200 specific)
      if (hardware === 'b200') {
        cmd += ` \\\n  --attention-backend trtllm_mla`;
        cmd += ` \\\n  --enable-flashinfer-allreduce-fusion`;
      }
      
      // FP4 specific optimization
      if (quantization === 'fp4') {
        cmd += ` \\\n  --enable-symm-mem`;
      }
      
      // Add reasoning parser if enabled
      if (thinking === 'enabled') {
        cmd += ` \\\n  --reasoning-parser deepseek-r1`;
      }
      
      // Add tool call parser if enabled
      if (toolcall === 'enabled') {
        cmd += ` \\\n  --tool-call-parser deepseekv3 \\\n  --chat-template examples/chat_template/tool_chat_template_deepseekr1.jinja`;
      }
      
      return cmd;
    }
  };
  
  return <ConfigGenerator config={config} />;
};

export default DeepSeekR1ConfigGenerator;

