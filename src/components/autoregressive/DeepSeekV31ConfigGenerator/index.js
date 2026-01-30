import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * DeepSeek V3.1 Configuration Generator
 * Supports DeepSeek-V3.1, V3.1-Terminus models
 */
const DeepSeekV31ConfigGenerator = () => {
  const config = {
    modelFamily: 'deepseek-ai',

    options: {
        hardware: {
            name: 'hardware',
            title: 'Hardware Platform',
            items: [
                { id: 'h200', label: 'H200', default: true },
                { id: 'b200', label: 'B200', default: false },
                { id: 'mi300x', label: 'MI300X', default: false },
                { id: 'mi325x', label: 'MI325X', default: false },
                { id: 'mi355x', label: 'MI355X', default: false },
            ]
        },
        modelname: {
            name: 'modelname',
            title: 'Model Name',
            items: [
                { id: 'v31', label: 'DeepSeek-V3.1', default: true },
                { id: 'v31terminus', label: 'DeepSeek-V3.1-Terminus', default: false }
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

        // Model name mapping
        const modelMap = {
            'v31': 'DeepSeek-V3.1',
            'v31terminus': 'DeepSeek-V3.1-Terminus'
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
        if (toolcall === 'enabled') {
            cmd += ` \\\n  --tool-call-parser deepseekv31`;
        }

        // Add reasoning-parser when enabled
        if (reasoningParser === 'enabled') {
            cmd += ` \\\n  --reasoning-parser deepseek-v3`;
        }

        // Add chat-template if tool calling is enabled (only for v32exp)
        if (toolcall === 'enabled') {
            cmd += ` \\\n  --chat-template ./examples/chat_template/tool_chat_template_deepseekv31.jinja`;
        }

        return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default DeepSeekV31ConfigGenerator;
