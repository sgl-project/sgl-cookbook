# NVIDIA NVIDIA-Nemotron-3-Nano-30B-A3B

## 1. Model Introduction

`NVIDIA-Nemotron-3-Nano-30B-A3B` is a 30B-parameter hybrid LLM that mixes Mixture-of-Experts (MoE) feed-forward layers, Mamba2 sequence-modeling layers, and standard self-attention layers in a single stack rather than classic “attention + MLP” transformer blocks.

The BF16 variant (`nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16`) is designed as a high-fidelity reference model, while the FP8 variant (`nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8`) targets optimized inference performance on modern NVIDIA GPUs.

At a high level:

- **Hybrid layer stack (Mamba2 + MoE + attention):** The network is composed of interleaved layers that are *either* Mamba2, *or* MoE feed-forward, *or* attention-only. 
- **Non-uniform layer ordering:** The order and mix of these specialized layers is not a simple, rigid pattern, enabling the model to trade off sequence modeling, routing capacity, and expressivity across depth.
- **Deployment-friendly precision:** Use BF16 for accuracy-sensitive and evaluation workloads; use FP8 for latency- and throughput-critical serving on recent NVIDIA GPUs.

---

## 2. SGLang Installation

SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

---

## 3. Model Deployment

This section provides a progressive guide from quick deployment to performance tuning.

### 3.1 Basic Configuration

**Interactive Command Generator**: select hardware, model variant, and common knobs to generate a launch command.

<div id="config-container" style="max-width: 1000px; margin: 0 auto; padding: 15px;"></div>

<script>
const CONFIG = {
  modelFamily: 'nvidia',

  options: {
    hardware: {
      name: 'hardware',
      title: 'Hardware Platform',
      items: [
        { id: 'h200', label: 'H200', default: true },
        { id: 'b200', label: 'B200', default: false }
      ]
    },

    modelVariant: {
      name: 'modelVariant',
      title: 'Model Variant',
      items: [
        { id: 'bf16', label: 'BF16', default: false },
        { id: 'fp8', label: 'FP8', default: true }
      ]
    },

    tp: {
      name: 'tp',
      title: 'Tensor Parallel (TP)',
      items: [
        { id: '1', label: 'TP=1 (current SGL support)', default: true },
        { id: '2', label: 'TP=2 (coming in future SGL)', default: false },
        { id: '4', label: 'TP=4 (coming in future SGL)', default: false },
        { id: '8', label: 'TP=8 (coming in future SGL)', default: false }
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

reasoning: {
  name: 'reasoning',
  title: 'Reasoning Parser',
  items: [
    { id: 'disabled', label: 'Disabled', default: true },
    { id: 'enabled', label: 'Enabled', default: false }
  ]
}
  },

  generateCommand(values) {
  const {
    hardware, modelVariant, tp, host, port,
    outputFormat, toolcall, reasoning
  } = values;

  const variant = modelVariant || 'fp8';
  const baseName = 'NVIDIA-Nemotron-3-Nano-30B-A3B';

  const modelName =
    variant === 'bf16'
      ? `${this.modelFamily}/${baseName}-BF16`
      : `${this.modelFamily}/${baseName}-FP8`;

  const effectiveTp = '1';

  const args = [
    'python3 -m sglang.launch_server',
    `--model-path ${modelName}`,
    '--trust-remote-code',
    `--tp ${effectiveTp}`,
  ];

  if (hardware === 'b200') {
    args.push('--attention-backend flashinfer');
  }

  // parsers
  if (toolcall === 'enabled') {
    args.push('--tool-call-parser qwen3_coder');
  }
  if (reasoning === 'enabled') {
    args.push('--reasoning-parser nano_v3');
  }

  args.push(`--host ${host || '0.0.0.0'}`);
  args.push(`--port ${port || '30000'}`);

  // Output formatting
  if (outputFormat === 'singleline') {
    return args.join(' ');
  }

  const lines = [];
  for (let i = 0; i < args.length; i++) {
    const isFirst = i === 0;
    const isLast = i === args.length - 1;
    if (isFirst) lines.push(args[i] + ' \\');
    else if (isLast) lines.push(`  ${args[i]}`);
    else lines.push(`  ${args[i]} \\`);
  }
  return lines.join('\n');
}
};

function renderUI() {
  const container = document.getElementById('config-container');
  if (!container) return;

  let html = '';
  let index = 1;

  for (const [_, option] of Object.entries(CONFIG.options)) {
    html += `
<div style="background: var(--md-default-bg-color, #ffffff); padding: 16px; border-radius: 10px; margin-bottom: 12px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); border: 1px solid var(--md-default-fg-color--lightest, #e0e0e0);">
  <div style="font-size: 14px; font-weight: 600; color: var(--md-default-fg-color, #2d3748); margin-bottom: 10px; display: flex; align-items: center;">
    <span style="background: #667eea; color: white; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px; font-size: 12px;">${index}</span>
    ${option.title}
  </div>
  <div style="display: flex; gap: 8px; flex-wrap: wrap;">`;

    if (option.type === 'text') {
      html += `
    <input type="text" id="input-${option.name}" name="${option.name}" value="${option.default || ''}" placeholder="${option.placeholder || ''}"
      style="padding: 8px 12px; border: 1px solid var(--md-default-fg-color--lightest, #e2e8f0); border-radius: 6px; font-size: 14px; width: 100%; max-width: 420px; color: var(--md-default-fg-color, #2d3748); background: var(--md-default-bg-color, white);">`;
    } else {
      option.items.forEach(item => {
        const inputId = `${option.name}-${item.id}`;
        const checked = item.default ? 'checked' : '';
        html += `
    <input type="radio" id="${inputId}" name="${option.name}" value="${item.id}" ${checked} style="display: none;">
    <label for="${inputId}"
      style="padding: 8px 18px; border: 2px solid var(--md-default-fg-color--lightest, #e2e8f0); border-radius: 6px; cursor: pointer; display: inline-block; font-weight: 500; font-size: 13px; transition: all 0.3s; background: var(--md-default-bg-color, white); color: var(--md-default-fg-color, #2d3748);">
      ${item.label}
    </label>`;
      });
    }

    html += `</div></div>`;
    index++;
  }

  html += `
<div style="background: var(--md-default-bg-color, #ffffff); padding: 16px; border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.08); border: 1px solid var(--md-default-fg-color--lightest, #e0e0e0);">
  <div style="font-size: 15px; font-weight: 600; color: var(--md-default-fg-color, #2d3748); margin-bottom: 10px;">
    Generated Command
  </div>
  <div id="command-display"
    style="padding: 16px; background: #2d3748; border-radius: 6px; font-family: 'Menlo','Monaco','Courier New',monospace; font-size: 13px; line-height: 1.7; color: #e2e8f0; white-space: pre-wrap; overflow-x: auto;">
  </div>
</div>`;

  container.innerHTML = html;
}

function updateCommand() {
  const values = {};
  for (const [_, option] of Object.entries(CONFIG.options)) {
    if (option.type === 'text') {
      const input = document.getElementById(`input-${option.name}`);
      values[option.name] = input ? input.value : (option.default || '');
    } else {
      const selected = document.querySelector(`input[name="${option.name}"]:checked`);
      values[option.name] = selected ? selected.value : option.items.find(x => x.default)?.id;
    }
  }

  const cmd = CONFIG.generateCommand(values);
  const out = document.getElementById('command-display');
  if (out) out.textContent = cmd;

  updateStyles();
}

function updateStyles() {
  document.querySelectorAll('label').forEach(label => {
    label.style.backgroundColor = '';
    label.style.color = '';
    label.style.borderColor = '#e2e8f0';
  });

  document.querySelectorAll('input[type="radio"]:checked').forEach(input => {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      label.style.backgroundColor = '#dc3545';
      label.style.color = 'white';
      label.style.borderColor = '#d55816';
    }
  });
}

function init() {
  const container = document.getElementById('config-container');
  if (!container) return;
  if (container.dataset.initialized) return;
  container.dataset.initialized = 'true';

  renderUI();
  container.addEventListener('change', updateCommand);
  container.addEventListener('input', updateCommand);

  updateCommand();
  updateStyles();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
setTimeout(init, 500);
</script>

### 3.2 Configuration Tips


- **Attention backend**:
  
    **H200**: default attention backend is sufficient.
  
    **B200**: use `--attention-backend flashinfer` (automatically added by the generator).
  
- **TP support**:
  
    Current SGL version: only `TP=1` is supported for this model.
  
    `TP=2/4/8` will be supported for coming SGL release; the generator already exposes these options for forward compatibility but still emits `--tp 1` today.

---

## 4. Model Invocation

### 4.1 Basic Usage (OpenAI-Compatible API)

SGLang provides an OpenAI-compatible endpoint. Example with the OpenAI Python client:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY",
)

resp = client.chat.completions.create(
    model="nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Summarize what MoE models are in 5 bullets."},
    ],
    temperature=0.7,
    max_tokens=256,
)

print(resp.choices[0].message.content)

```

Streaming chat completion
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY",
)

stream = client.chat.completions.create(
    model="nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8",
    messages=[
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "What are the first 5 prime numbers?"}
    ],
    temperature=0.7,
    max_tokens=1024,
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta
    if delta and delta.content:
        print(delta.content, end="", flush=True)
```

### 4.2 Reasoning
Note: The model supports two modes - Reasoning ON (default) vs OFF. This can be toggled by setting enable_thinking to False, as shown below.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY",
)

# Reasoning on (default)
print("Reasoning on")
resp = client.chat.completions.create(
    model="nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Write a haiku about GPUs."}
    ],
    temperature=0.7,
    max_tokens=256,
)
print(resp.choices[0].message.reasoning_content, resp.choices[0].message.content)

# Reasoning off
print("Reasoning off")
resp = client.chat.completions.create(
    model="nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Give me 3 interesting facts about SGLang."}
    ],
    temperature=0.6,
    max_tokens=256,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}}
)
print(resp.choices[0].message.reasoning_content, resp.choices[0].message.content)

```

### 4.3 Tool calling
Call functions using the OpenAI Tools schema and inspect returned tool_calls.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:30000/v1",
    api_key="EMPTY",
)

# Tool calling via OpenAI tools schema
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate_tip",
            "parameters": {
                "type": "object",
                "properties": {
                    "bill_total": {
                        "type": "integer",
                        "description": "The total amount of the bill"
                    },
                    "tip_percentage": {
                        "type": "integer",
                        "description": "The percentage of tip to be applied"
                    }
                },
                "required": ["bill_total", "tip_percentage"]
            }
        }
    }
]

completion = client.chat.completions.create(
    model="nemotron",
    messages=[
        {"role": "system", "content": ""},
        {"role": "user", "content": "My bill is $50. What will be the amount for 15% tip?"}
    ],
    tools=TOOLS,
    temperature=0.6,
    top_p=0.95,
    max_tokens=512,
    stream=False
)

print(completion.choices[0].message.reasoning_content)
print(completion.choices[0].message.tool_calls)
```

---

## 5. Benchmark

### 5.1 Speed Benchmark

**Test Environment:**

- Hardware: NVIDIA B200 GPU

**FP8 variant**

- Model Deployment Command:

```shell
python3 -m sglang.launch_server \
  --model-path nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8 \
  --trust-remote-code \
  --tp 1 \
  --attention-backend flashinfer \
  --max-running-requests 1024 \
  --host 0.0.0.0 \
  --port 30000
```

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 30000 \
  --model nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8 \
  --dataset-name random \
  --random-input-len 1024 \
  --random-output-len 1024 \
  --num-prompts 4096 \
  --max-concurrency 256
```

- **Test Results:**

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 256
Successful requests:                     4096
Benchmark duration (s):                  183.18
Total input tokens:                      2081726
Total input text tokens:                 2081726
Total input vision tokens:               0
Total generated tokens:                  2116125
Total generated tokens (retokenized):    1076256
Request throughput (req/s):              22.36
Input token throughput (tok/s):          11364.25
Output token throughput (tok/s):         11552.04
Peak output token throughput (tok/s):    24692.00
Peak concurrent requests:                294
Total token throughput (tok/s):          22916.30
Concurrency:                             251.19
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   11233.74
Median E2E Latency (ms):                 11142.97
---------------Time to First Token----------------
Mean TTFT (ms):                          172.99
Median TTFT (ms):                        116.57
P99 TTFT (ms):                           1193.68
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          21.74
Median TPOT (ms):                        21.14
P99 TPOT (ms):                           41.12
---------------Inter-Token Latency----------------
Mean ITL (ms):                           21.45
Median ITL (ms):                         9.06
P95 ITL (ms):                            62.59
P99 ITL (ms):                            110.83
Max ITL (ms):                            5368.19
==================================================
```

**BF16 variant**

- Model Deployment Command:

```shell
python3 -m sglang.launch_server \
  --model-path nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 \
  --trust-remote-code \
  --tp 1 \
  --attention-backend flashinfer \
  --max-running-requests 1024 \
  --host 0.0.0.0 \
  --port 30000
```

- Benchmark Command:

```shell
python3 -m sglang.bench_serving \
  --backend sglang \
  --host 127.0.0.1 \
  --port 30000 \
  --model nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 \
  --dataset-name random \
  --random-input-len 1024 \
  --random-output-len 1024 \
  --num-prompts 4096 \
  --max-concurrency 256
```

- **Test Results:**

```
============ Serving Benchmark Result ============
Backend:                                 sglang
Traffic request rate:                    inf
Max request concurrency:                 256
Successful requests:                     4096
Benchmark duration (s):                  360.22
Total input tokens:                      2081726
Total input text tokens:                 2081726
Total input vision tokens:               0
Total generated tokens:                  2087288
Total generated tokens (retokenized):    1940652
Request throughput (req/s):              11.37
Input token throughput (tok/s):          5779.10
Output token throughput (tok/s):         5794.55
Peak output token throughput (tok/s):    9169.00
Peak concurrent requests:                276
Total token throughput (tok/s):          11573.65
Concurrency:                             249.76
----------------End-to-End Latency----------------
Mean E2E Latency (ms):                   21965.10
Median E2E Latency (ms):                 21706.35
---------------Time to First Token----------------
Mean TTFT (ms):                          211.54
Median TTFT (ms):                        93.06
P99 TTFT (ms):                           2637.66
-----Time per Output Token (excl. 1st token)------
Mean TPOT (ms):                          43.27
Median TPOT (ms):                        43.04
P99 TPOT (ms):                           61.15
---------------Inter-Token Latency----------------
Mean ITL (ms):                           42.77
Median ITL (ms):                         28.46
P95 ITL (ms):                            71.85
P99 ITL (ms):                            113.20
Max ITL (ms):                            5237.28
==================================================

```
### 5.2 Accuracy Benchmark

TODO
