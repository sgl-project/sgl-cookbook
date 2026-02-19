import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';

/**
 * Qwen3.5-397B-A17B Configuration Generator
 * Supports Qwen3.5 397B (17B active) MoE VLM deployment configuration
 * with reasoning parser, tool calling, and speculative decoding
 *
 * GPU requirements:
 *   H100: tp=16 (model ~800GB in BF16, each rank needs ~100GB > 80GB)
 *   H200: tp=8
 *   B200: tp=8
 */
const Qwen35ConfigGenerator = () => {
  const config = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h200', label: 'H200', default: true },
          { id: 'b200', label: 'B200', default: false },
          { id: 'h100', label: 'H100', default: false }
        ]
      },
      reasoning: {
        name: 'reasoning',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--reasoning-parser qwen3' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen3_coder' : null
      },
      speculative: {
        name: 'speculative',
        title: 'Speculative Decoding (MTP)',
        items: [
          { id: 'disabled', label: 'Disabled', default: false },
          { id: 'enabled', label: 'Enabled', default: true }
        ],
        commandRule: (value) => value === 'enabled' ? '--speculative-algo NEXTN \\\n  --speculative-num-steps 3 \\\n  --speculative-eagle-topk 1 \\\n  --speculative-num-draft-tokens 4' : null
      }
    },

    modelConfigs: {
      h100: { bf16: { tp: 16, mem: 0.8 } },
      h200: { bf16: { tp: 8, mem: 0.8 } },
      b200: { bf16: { tp: 8, mem: 0.8 } }
    },

    generateCommand: function (values) {
      const { hardware, speculative } = values;

      const modelName = `${this.modelFamily}/Qwen3.5-397B-A17B`;

      const hwConfig = this.modelConfigs[hardware].bf16;
      const tpValue = hwConfig.tp;
      const memFraction = hwConfig.mem;

      if (hardware === 'b200' && speculative === 'disabled') {
        let cmd = 'python3 -m sglang.launch_server \\\n';
        cmd += `  --model-path ${modelName} \\\n`;
        cmd += `  --served-model-name "${modelName}" \\\n`;
        cmd += `  --host 0.0.0.0 \\\n`;
        cmd += `  --port $PORT \\\n`;
        cmd += `  --trust-remote-code \\\n`;
        cmd += `  --tensor-parallel-size ${tpValue} \\\n`;
        cmd += `  --disable-radix-cache \\\n`;
        cmd += `  --mem-fraction-static $MEM_FRAC_STATIC \\\n`;
        cmd += `  --chunked-prefill-size $CHUNKED_PREFILL_SIZE \\\n`;
        cmd += `  --max-prefill-tokens $MAX_PREFILL_TOKENS \\\n`;
        cmd += `  --cuda-graph-max-bs $CUDA_GRAPH_MAX_BATCH_SIZE \\\n`;
        cmd += `  --max-running-requests $MAX_RUNNING_REQUESTS \\\n`;
        cmd += `  --context-length $CONTEXT_LENGTH \\\n`;
        cmd += `  --attention-backend trtllm_mha \\\n`;
        cmd += `  --moe-runner-backend flashinfer_trtllm \\\n`;
        cmd += `  --tokenizer-worker-num 6 \\\n`;
        cmd += `  --stream-interval 30 \\\n`;
        cmd += `  --scheduler-recv-interval $SCHEDULER_RECV_INTERVAL \\\n`;
        cmd += `  --enable-flashinfer-allreduce-fusion`;

        Object.entries(this.options).forEach(([key, option]) => {
          if (option.commandRule) {
            const rule = option.commandRule(values[key]);
            if (rule) {
              cmd += ` \\\n  ${rule}`;
            }
          }
        });

        return cmd;
      }

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      cmd += ` \\\n  --tp ${tpValue}`;

      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule) {
          const rule = option.commandRule(values[key]);
          if (rule) {
            cmd += ` \\\n  ${rule}`;
          }
        }
      });

      cmd += ` \\\n  --mem-fraction-static ${memFraction}`;

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default Qwen35ConfigGenerator;
