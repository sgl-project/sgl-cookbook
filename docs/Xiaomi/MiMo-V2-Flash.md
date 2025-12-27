# MiMo-V2-Flash

## Introduction

XiaomiMiMo/MiMo-V2-Flash, with 309B total parameters and 15B activated parameters, is a new inference-centric model designed to maximize decoding efficiency. It is based on two key designs: **sliding window attention** and **multi-layer MTP**. MiMo-V2-Flash is explicitly co-designed for real-world serving workloads, enabling flexible tradeoffs between throughput and latency on different hardware.

## Installation

MiMo-V2-Flash is currently available in SGLang via Docker image and pip install.

### Docker

```bash
# Pull the docker image
docker pull lmsysorg/sglang:dev-pr-15207

# Launch the container
docker run -it --gpus all \
  --shm-size=32g \
  --ipc=host \
  --network=host \
  lmsysorg/sglang:dev-pr-15207 bash
```

### Pip Installation

```bash
# On a machine with SGLang dependencies installed or inside a SGLang nightly container
# Start an SGLang nightly container
docker run -it --gpus all \
  --shm-size=32g \
  --ipc=host \
  --network=host \
  lmsysorg/sglang:nightly-dev-20251215-4449c170 bash

# If you already have SGLang installed, uninstall the current SGLang version
pip uninstall sglang -y

# Install the PyPI Package
pip install sglang==0.5.6.post2.dev8005+pr.15207.g39d5bd57a \
  --extra-index-url https://sgl-project.github.io/whl/pr/
```

## Model Deployment

Use the configuration selector below to automatically generate the appropriate deployment command.

import MiMoConfigGenerator from '@site/src/components/MiMoConfigGenerator';

<MiMoConfigGenerator />

## Testing the deployment

Once the server is running, test it with a chat completion request in another terminal:

```bash
curl http://localhost:30000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "XiaomiMiMo/MiMo-V2-Flash",
    "messages": [
      {"role": "user", "content": "Hello! What can you help me with?"}
    ],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

**Expected response:**

```json
{
  "id": "...",
  "object": "chat.completion",
  "model": "XiaomiMiMo/MiMo-V2-Flash",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! I can help you with..."
    }
  }]
}
```

## Troubleshooting

**DeepGEMM Timeout Error**

Occasionally DeepGEMM timeout errors occur during first launch. Simply rerun the server command in the same container - the compiled kernels are cached and subsequent launches will be fast.
