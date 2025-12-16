---
sidebar_position: 1
---

# SGLang Cookbook

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/sgl-project/sgl-cookbook/pulls)

A community-maintained repository of practical guides and recipes for deploying and using SGLang in production environments. Our mission is simple: answer the question **"How do I use SGLang (and related models) on hardware Y for task Z?"** with clear, actionable solutions.

## 🎯 What You'll Find Here

This cookbook aggregates battle-tested SGLang recipes covering:

- **Models**: Mainstream LLMs and Vision-Language Models (VLMs)
- **Use Cases**: Inference serving, deployment strategies, multimodal applications
- **Hardware**: GPU and CPU configurations, optimization for different accelerators
- **Best Practices**: Configuration templates, performance tuning, troubleshooting guides

Each recipe provides step-by-step instructions to help you quickly implement SGLang solutions for your specific requirements.

## Guides

### DeepSeek

- [x] [DeepSeek-V3.2](/docs/DeepSeek/DeepSeek-V3_2)
- [ ] [DeepSeek-V3.1](./DeepSeek/DeepSeek-V3_1)
- [ ] [DeepSeek-V3](./DeepSeek/DeepSeek-V3)
- [x] [DeepSeek-R1](/docs/DeepSeek/DeepSeek-R1)

### Ernie

- [ ] [Ernie4.5](./Ernie/Ernie4.5)
- [ ] [Ernie4.5-VL](./Ernie/Ernie4.5-VL)

### GLM

- [ ] [Glyph](./GLM/Glyph)
- [ ] [GLM-4.5V](./GLM/GLM-4.5V)
- [x] [GLM-4.6](./GLM/GLM-4.6)
- [x] [GLM-4.6V](./GLM/GLM-4.6V)

### InternVL

- [ ] [InternVL3.5](./InternVL/InternVL3_5)

### InternLM

- [ ] [Intern-S1](./InternLM/Intern-S1)

### Jina AI

- [ ] [Jina-reranker-m0](./Jina/Jina-reranker-m0)

### Llama

- [ ] [Llama4-Scout](./Llama/Llama4-Scout)
- [ ] [Llama3.3-70B](./Llama/Llama3.3-70B)
- [ ] [Llama3.1](./Llama/Llama3.1)

### MiniMax

- [ ] [MiniMax-M2](./MiniMax/MiniMax-M2)

### OpenAI

- [ ] [gpt-oss](./OpenAI/GPT-OSS)

### Qwen

- [x] [Qwen3](./Qwen/Qwen3)
- [x] [Qwen3-VL](./Qwen/Qwen3-VL)
- [x] [Qwen3-Next](./Qwen/Qwen3-Next)
- [ ] [Qwen3-Coder-480B-A35B](./Qwen/Qwen3-Coder-480B-A35B)
- [ ] [Qwen2.5-VL](./Qwen/Qwen2.5-VL)

### Moonshotai

- [x] [Kimi-K2](./Moonshotai/Kimi-K2)
- [ ] [Kimi-Linear](./Moonshotai/Kimi-Linear)

### NVIDIA

- [x] [Nemotron-Nano-3-30B-A3B](./NVIDIA/Nemotron3-Nano)

## 🚀 Quick Start

1. Browse the recipe index above to find your model
2. Follow the step-by-step instructions in each guide
3. Adapt configurations to your specific hardware and requirements
4. Join our community to share feedback and improvements

## 🤝 Contributing

We believe the best documentation comes from practitioners. Whether you've optimized SGLang for a specific model, solved a tricky deployment challenge, or discovered performance improvements, we encourage you to contribute your recipes!

**Ways to contribute:**

- Add a new recipe for a model not yet covered
- Improve existing recipes with additional tips or configurations
- Report issues or suggest enhancements
- Share your production deployment experiences

**To contribute:**

```shell
# Fork the repo and clone locally
git clone https://github.com/YOUR_USERNAME/sglang-cookbook.git
cd sglang-cookbook

# Create a new branch
git checkout -b add-my-recipe

# Add your recipe following the template in DeepSeek-V3.2
# Submit a PR!
```

## 🛠️ Local Development

### Prerequisites

- Node.js >= 20.0
- npm or yarn

### Setup and Run

Install dependencies and start the development server:

```shell
# Install dependencies
npm install

# Start development server (hot reload enabled)
npm start
```

The site will automatically open in your browser at `http://localhost:3000`.

## 📖 Resources

- [SGLang GitHub](https://github.com/sgl-project/sglang)
- [SGLang Documentation](https://sgl-project.github.io)
- [Community Slack/Discord](https://discord.gg/MpEEuAeb)

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](https://github.com/sgl-project/sgl-cookbook/blob/main/LICENSE) file for details.

---

**Let's build this resource together!** 🚀 Star the repo and contribute your recipes to help the SGLang community grow.
