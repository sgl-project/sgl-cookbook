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

### Diffusion Models

#### Qwen-Image

- [ ] [Qwen-Image](./diffusions/Qwen-Image/Qwen-Image.md)
- [ ] [Qwen-Image-Edit](./diffusions/Qwen-Image/Qwen-Image-Edit.md)

#### Wan

- [ ] [Wan2.1](./diffusions/Wan/Wan2.1.md)
- [X] [Wan2.2](./diffusions/Wan/Wan2.2.md)

#### Z-Image

- [ ] [Z-Image](./diffusions/Z-Image/Z-Image-Turbo.md)

### LLMs & VLMs

#### Qwen

- [X] [Qwen3](./models/Qwen/Qwen3.md)
- [X] [Qwen3-VL](./models/Qwen/Qwen3-VL.md)
- [X] [Qwen3-Next](./models/Qwen/Qwen3-Next.md)
- [ ] [Qwen3-Coder-480B-A35B](./models/Qwen/Qwen3-Coder-480B-A35B.md)
- [ ] [Qwen2.5-VL](./models/Qwen/Qwen2.5-VL.md)

#### DeepSeek

- [X] [DeepSeek-V3.2](./models/DeepSeek/DeepSeek-V3_2.md)
- [ ] [DeepSeek-V3.1](./models/DeepSeek/DeepSeek-V3_1.md)
- [ ] [DeepSeek-V3](./models/DeepSeek/DeepSeek-V3.md)
- [X] [DeepSeek-R1](./models/DeepSeek/DeepSeek-R1.md)

#### Llama

- [ ] [Llama4-Scout](./models/Llama/Llama4-Scout.md)
- [ ] [Llama3.3-70B](./models/Llama/Llama3.3-70B.md)
- [ ] [Llama3.1](./models/Llama/Llama3.1.md)

#### GLM

- [ ] [Glyph](./models/GLM/Glyph.md)
- [X] [GLM-4.5V](./models/GLM/GLM-4.5V.md)
- [X] [GLM-4.6](./models/GLM/GLM-4.6.md)
- [X] [GLM-4.6V](./models/GLM/GLM-4.6V.md)

#### OpenAI

- [X] [gpt-oss](./models/OpenAI/GPT-OSS.md)

#### Moonshotai

- [X] [Kimi-K2](./models/Moonshotai/Kimi-K2.md)
- [ ] [Kimi-Linear](./models/Moonshotai/Kimi-Linear.md)

#### MiniMax

- [ ] [MiniMax-M2](./models/MiniMax/MiniMax-M2.md)

#### NVIDIA

- [X] [Nemotron-Nano-3-30B-A3B](./models/NVIDIA/Nemotron3-Nano.md)

#### Ernie

- [ ] [Ernie4.5](./models/Ernie/Ernie4.5.md)
- [ ] [Ernie4.5-VL](./models/Ernie/Ernie4.5-VL.md)

#### InternVL

- [ ] [InternVL3.5](./models/InternVL/InternVL3_5.md)

#### InternLM

- [ ] [Intern-S1](./models/InternLM/Intern-S1.md)

#### Jina AI

- [ ] [Jina-reranker-m0](./models/Jina/Jina-reranker-m0.md)

#### Mistral

- [ ] [Mistral-3](./models/Mistral/Mistral-3.md)
- [X] [Devstral 2](./models/Mistral/Devstral-2.md)


#### Xiaomi

- [X] [MiMo-V2-Flash](./models/Xiaomi/MiMo-V2-Flash.md)

### Benchmarks

- [X] [Diffusion Model Benchmark](./benchmarks/diffusion_model_benchmark.md)
- [X] [LLM Benchmark](./benchmarks/lm_benchmark.md)


## Reference

- [Server arguments](./reference/server_arguments.md) - Understanding all the arguments

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
