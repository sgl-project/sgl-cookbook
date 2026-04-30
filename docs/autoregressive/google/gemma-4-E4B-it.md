

## AMD MI355X

### Docker Setup

```bash
docker run -d \
  --device=/dev/kfd --device=/dev/dri \
  --group-add video --cap-add=SYS_PTRACE \
  --security-opt seccomp=unconfined \
  --shm-size=32g --ipc=host --network=host \
  lmsysorg/sglang:nightly-dev-20260423-0bee2113 bash
```

### Model Deployment

```bash
sglang serve \
  --model-path google/gemma-4-E4B-it \
  --reasoning-parser gemma4 \
  --tool-call-parser gemma4 \
  --mem-fraction-static 0.85 \
  --host 0.0.0.0 \
  --port 30000
```

### Benchmark Results

| Task | Shots | Metric | Score |
|------|-------|--------|-------|
| gsm8k | 8 | exact_match | 0.7619 |

### Configuration Comparison

| Config | gsm8k (8-shot) |
|--------|----------------|
| TP=, mem-fraction-static=0.85, reasoning-parser=gemma4, tool-call-parser=gemma4 | 0.7619 |
| TP=, mem-fraction-static=0.9, reasoning-parser=gemma4, tool-call-parser=gemma4 | 0.7536 |
| TP=, mem-fraction-static=0.9, reasoning-parser=gemma4, tool-call-parser=gemma4 | 0.6983 |
| TP=, mem-fraction-static=0.9, reasoning-parser=gemma4, tool-call-parser=gemma4 | 0.6778 |

