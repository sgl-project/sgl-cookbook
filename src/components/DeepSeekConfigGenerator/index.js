import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

/**
 * DeepSeek V3.2 Configuration Generator
 * Supports DeepSeek-V3.2, V3.2-Speciale, and V3.2-Exp models
 */
const DeepSeekConfigGenerator = () => {
  const config = {
    modelFamily: 'deepseek-ai',

    options: {
        hardware: {
            name: 'hardware',
            title: 'Hardware Platform',
            items: [
                { id: 'h200', label: 'H200', default: true },
                { id: 'b200', label: 'B200', default: false }
            ]
        },
        modelname: {
            name: 'modelname',
            title: 'Model Name',
            items: [
                { id: 'v32', label: 'DeepSeek-V3.2', default: true },
                { id: 'v32speciale', label: 'DeepSeek-V3.2-Speciale', default: false },
                { id: 'v32exp', label: 'DeepSeek-V3.2-Exp', default: false }
            ]
        },
        strategy: {
            name: 'strategy',
            title: 'Deployment Strategy',
            type: 'checkbox',
            items: [
                { id: 'tp', label: 'TP', default: true, required: true },
                { id: 'dp', label: 'DP attention', default: false },
                { id: 'ep', label: 'EP', default: false },
                { id: 'mtp', label: 'Multi-token Prediction', default: false }
            ]
        },
        reasoningParser: {
            name: 'reasoningParser',
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
            ]
        }
    },

    generateCommand: function(values) {
        const { hardware, modelname, strategy, reasoningParser, toolcall } = values;

        // Validation: DeepSeek-V3.2-Speciale doesn't support tool calling
        if (modelname === 'v32speciale' && toolcall === 'enabled') {
            return `# Error: DeepSeek-V3.2-Speciale doesn't support tool calling\n# Please select "Disabled" for Tool Call Parser or choose a different model`;
        }

        // Model name mapping
        const modelMap = {
            'v32': 'DeepSeek-V3.2',
            'v32exp': 'DeepSeek-V3.2-Exp',
            'v32speciale': 'DeepSeek-V3.2-Speciale'
        };

        const modelName = `${this.modelFamily}/${modelMap[modelname]}`;

        let cmd = 'python3 -m sglang.launch_server \\\n';
        cmd += `  --model-path ${modelName}`;

        // Strategy configurations
        const strategyArray = Array.isArray(strategy) ? strategy : [];
        // TP is mandatory
        cmd += ` \\\n  --tp 8`;
        if (strategyArray.includes('dp')) {
            cmd += ` \\\n  --dp 8 \\\n  --enable-dp-attention`;
        }
        if (strategyArray.includes('ep')) {
            cmd += ` \\\n  --ep 8`;
        }
        // Multi-token prediction (MTP) configuration
        if (strategyArray.includes('mtp')) {
            cmd += ` \\\n  --speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4`;
        }

        // Add tool-call-parser if enabled (not supported for Speciale)
        if (toolcall === 'enabled' && modelname !== 'v32speciale') {
            if (modelname === 'v32exp') {
                cmd += ` \\\n  --tool-call-parser deepseekv31`;
            } else if (modelname === 'v32') {
                cmd += ` \\\n  --tool-call-parser deepseekv32`;
            }
        }

        // Add reasoning-parser when enabled
        if (reasoningParser === 'enabled') {
            cmd += ` \\\n  --reasoning-parser deepseek-v3`;
        }

        // Add chat-template if tool calling is enabled (only for v32exp)
        if (toolcall === 'enabled' && modelname === 'v32exp') {
            cmd += ` \\\n  --chat-template ./examples/chat_template/tool_chat_template_deepseekv32.jinja`;
        }

        return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default DeepSeekConfigGenerator;
