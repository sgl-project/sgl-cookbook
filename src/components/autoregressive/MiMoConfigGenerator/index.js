import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * MiMo-V2-Flash Configuration Generator
 */
const MiMoConfigGenerator = () => {
  const config = {
    modelFamily: 'Xiaomi',

    options: {
        hardware: {
            name: 'hardware',
            title: 'Hardware Platform',
            items: [
                { id: 'h200', label: 'H200', default: true },
                { id: 'h100', label: 'H100', default: false },
                { id: 'mi355x', label: 'MI355X', default: false }
            ]
        },
        modelname: {
            name: 'modelname',
            title: 'Model Name',
            items: [
                { id: 'mimo-v2-flash', label: 'MiMo-V2-Flash', default: true }
            ]
        },
        strategy: {
            name: 'strategy',
            title: 'Deployment Strategy',
            type: 'checkbox',
            items: [
                { id: 'tp', label: 'TP 8 (Required)', default: true, disabled: true },
                { id: 'dp', label: 'DP Attention (DP 2)', default: true },
                { id: 'mtp', label: 'Multi-token Prediction (MTP)', default: true },
                { id: 'optimization', label: 'Performance Optimizations', default: true }
            ]
        },
        reasoning: {
            name: 'reasoning',
            title: 'Reasoning & Tools',
            type: 'checkbox',
            items: [
                { id: 'reasoning', label: 'Reasoning Parser (Qwen3)', default: true },
                { id: 'toolcall', label: 'Tool Call Parser', default: true }
            ]
        }
    },

    generateCommand: function(values) {
        const { hardware, strategy, reasoning } = values;
        const isMI355X = hardware === 'mi355x';

        const modelPath = 'XiaomiMiMo/MiMo-V2-Flash';
        const strategyArray = Array.isArray(strategy) ? strategy : [];
        const reasoningArray = Array.isArray(reasoning) ? reasoning : [];

        if (isMI355X && strategyArray.includes('mtp')) {
            return '# MI355X Speculative Decoding (EAGLE): Work In Progress\n'
                + '# Uncheck "Multi-token Prediction (MTP)" to view the validated non-speculative MI355X command.';
        }

        const commandPrefix = isMI355X
            ? 'PYTHONPATH=/sgl-workspace/aiter SGLANG_USE_AITER=0 USE_ROCM_AITER_ROPE_BACKEND=0'
            : 'SGLANG_ENABLE_SPEC_V2=1';
        const tpSize = isMI355X ? 4 : 8;

        let cmd = `${commandPrefix} sglang serve \\\n`;
        cmd += `  --model-path ${modelPath} \\\n`;
        cmd += `  --trust-remote-code \\\n`;
        cmd += `  --tp-size ${tpSize}`;

        // DP settings
        if (!isMI355X && strategyArray.includes('dp')) {
            cmd += ` \\\n  --dp-size 2 \\\n  --enable-dp-attention`;
        }

        // Performance Optimizations
        if (strategyArray.includes('optimization')) {
             cmd += ` \\\n  --mem-fraction-static 0.75 \\\n  --max-running-requests 128 \\\n  --chunked-prefill-size 16384 \\\n  --model-loader-extra-config '{"enable_multithread_load": "true","num_threads": 64}'`;
             cmd += isMI355X
                 ? ` \\\n  --attention-backend triton \\\n  --prefill-attention-backend triton \\\n  --decode-attention-backend triton \\\n  --disable-custom-all-reduce`
                 : ` \\\n  --attention-backend fa3`;
        }

        // MTP/Speculative settings
        if (!isMI355X && strategyArray.includes('mtp')) {
            cmd += ` \\\n  --speculative-algorithm EAGLE \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4 \\\n  --enable-multi-layer-eagle`;
        }

        // Reasoning Parser
        if (reasoningArray.includes('reasoning')) {
            cmd += ` \\\n  --reasoning-parser qwen3`;
        }

        // Tool Call Parser
        if (reasoningArray.includes('toolcall')) {
            cmd += ` \\\n  --tool-call-parser mimo`;
        }

        return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default MiMoConfigGenerator;
