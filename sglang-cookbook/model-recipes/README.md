# Model Recipes

SGL Model Recipes is a community-maintained hub of reference setups that make deploying and operating SGL fast, consistent, and reproducible. Inside you’ll find curated configurations, scripts, and best-practice guides covering a range of models, hardware targets, and deployment environments. 
Each recipe is designed to be copy-paste friendly, benchmarkable, and easy to adapt to your needs. 
Contributions are welcome: submit new recipes, improvements, or bug fixes via PRs, and open issues for requests

---

## Overview

The repository provides:

- **Curated configurations and scripts** for SGL deployment  
- **Usage guidelines and tuning notes** contributed by the community  
- Coverage across a broad range of **models, hardware platforms, and application scenarios**  

Each recipe is designed to be:

- **Reliable** – validated and tested in real environments  
- **Reproducible** – including environment details and exact launch commands  
- **Adaptable** – easy to extend for your own needs  

---

## Guides

### DeepSeek <img src="https://avatars.githubusercontent.com/u/148330874?s=200&v=4" alt="DeepSeek" width="16" height="16" style="vertical-align:middle;">

- DeepSeek Model Recipes (model-recipes/deepseek-v3.1-v3-r1/)
  Reference configurations and scripts for running DeepSeek models with SGL across different hardware setups.  

### GPT-OSS <img src="https://avatars.githubusercontent.com/u/14957082?v=4" alt="OpenAI" width="16" height="16" style="vertical-align:middle;">

- GPT-OSS Model Recipes (model-recipes/gpt-oss/)
  Reference configurations and scripts for running GPT-OSS models with SGL across different hardware setups.
  
---

## Contributing

We welcome contributions from the community!  

1. Start from the template in `Model Recipes/_template/`.  
2. Include:  
   - **Environment details** (driver, CUDA, SGL version, OS)  
   - **Hardware description** (GPU type, count, interconnect)  
   - **Configuration** (key flags, parallelism, quantization, memory settings)  
   - **Reproducibility steps** (exact commands or YAMLs)  
   - **Results and benchmarks** (tokens/s, latency, throughput, etc.)  
   - **Known issues / caveats**  

3. Submit a PR with a short summary of:  
   - **What** you added  
   - **Why** it is useful  
   - **How** to reproduce the results 

---

> 🚀 Whether you’re running small experiments or scaling to production, these recipes are here to help you get the most out of **SGL**.
