import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

const DeepSeekV3ConfigGenerator = () => {
  const config = {
    modelFamily: 'deepseek-ai',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h100', label: 'H100', default: false },
          { id: 'h200', label: 'H200', default: false },
          { id: 'b200', label: 'B200', default: true },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
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
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser deepseek-v3' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser deepseekv3 \\\n  --chat-template examples/chat_template/tool_chat_template_deepseekv3.jinja' : null
      }
    },

    generateCommand: function (values) {
      const { hardware, quantization, strategy } = values;

      const strategyArray = Array.isArray(strategy) ? strategy : [];

      // Validation checks
      // Check H100 compatibility - H100 only supports FP8
      if ((hardware === 'h100' || hardware === 'mi300x') && quantization === 'fp4') {
        return '# Error: H100 and MI300X only supports FP8 quantization\n# Please select FP8 quantization or use B200/MI355X hardware';
      }

      // Model path based on quantization
      let modelPath = '';
      if (quantization === 'fp8') {
        modelPath = 'deepseek-ai/DeepSeek-V3';
      } else if (quantization === 'fp4') {
        modelPath = 'nvidia/DeepSeek-V3-0324-NVFP4';
      }

      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath}`;

      // TP strategy
      if (strategyArray.includes('tp')) {
        cmd += ` \\\n  --tp 8`;
      }

      // DP strategy
      if (strategyArray.includes('dp')) {
        cmd += ` \\\n  --dp 8 \\\n  --enable-dp-attention`;
      }

      // EP strategy
      if (strategyArray.includes('ep')) {
        cmd += ` \\\n  --ep 8`;
      }

      // MTP strategy
      if (strategyArray.includes('mtp')) {
        cmd = 'SGLANG_ENABLE_SPEC_V2=1 ' + cmd;
        cmd += ` \\\n  --speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4`;
      }

      cmd += ` \\\n  --enable-symm-mem # Optional: improves performance, but may be unstable`;

      if (hardware === 'b200') {
        cmd += ` \\\n  --kv-cache-dtype fp8_e4m3 # Optional: enables fp8 kv cache and fp8 attention kernels to improve performance`;
      }

      // Add thinking parser and tool call parser if enabled
      for (const [key, option] of Object.entries(this.options)) {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default DeepSeekV3ConfigGenerator;
