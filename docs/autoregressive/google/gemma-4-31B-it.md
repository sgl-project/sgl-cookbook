

## AMD MI355X

### Docker Setup

```bash
docker run -d \
  --device=/dev/kfd --device=/dev/dri \
  --group-add video --cap-add=SYS_PTRACE \
  --security-opt seccomp=unconfined \
  --shm-size=32g --ipc=host --network=host \
  lmsysorg/sglang-rocm:v0.5.10.post1-rocm700-mi35x-20260427 bash
```

### Model Deployment

```bash
sglang serve \
  --model-path google/gemma-4-31B-it \
  --reasoning-parser gemma4 \
  --tool-call-parser gemma4 \
  --mem-fraction-static 0.8 \
  --host 0.0.0.0 \
  --port 30000
```

### Benchmark Results

| Task | Shots | Metric | Score |
|------|-------|--------|-------|
| gsm8k | 8 | exact_match | 0.7013 |

### Configuration Comparison

| Config | gsm8k (8-shot) |
|--------|----------------|
| TP=, mem-fraction-static=0.8, reasoning-parser=gemma4, tool-call-parser=gemma4 | 0.7013 |
| TP=, mem-fraction-static=0.9, reasoning-parser=gemma4, tool-call-parser=gemma4 | 0.6892 |

