---
sidebar_position: 1
slug: /
description: The SGLang Cookbook is a practical collection of examples and guides that show developers how to efficiently run SGLang with a variety of models on different platforms.
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

### Autoregressive Models

#### Qwen

- [ ] [Qwen3.5](./autoregressive/Qwen/Qwen3.5.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>
- [x] [Qwen3](./autoregressive/Qwen/Qwen3.md)
- [x] [Qwen3-Next](./autoregressive/Qwen/Qwen3-Next.md)
- [x] [Qwen3-VL](./autoregressive/Qwen/Qwen3-VL.md)
- [ ] [Qwen3-Coder](./autoregressive/Qwen/Qwen3-Coder.md)
- [ ] [Qwen2.5-VL](./autoregressive/Qwen/Qwen2.5-VL.md)

#### DeepSeek

- [x] [DeepSeek-V3.2](./autoregressive/DeepSeek/DeepSeek-V3_2.md)
- [x] [DeepSeek-V3.1](./autoregressive/DeepSeek/DeepSeek-V3_1.md)
- [x] [DeepSeek-V3](./autoregressive/DeepSeek/DeepSeek-V3.md)
- [x] [DeepSeek-R1](./autoregressive/DeepSeek/DeepSeek-R1.md)
- [x] [DeepSeek-OCR](./autoregressive/DeepSeek/DeepSeek-OCR.md)

#### Llama

- [ ] [Llama4-Scout](./autoregressive/Llama/Llama4-Scout.md)
- [x] [Llama3.3-70B](./autoregressive/Llama/Llama3.3-70B.md)
- [x] [Llama3.1](./autoregressive/Llama/Llama3.1.md)

#### GLM

- [ ] [GLM-Glyph](./autoregressive/GLM/Glyph.md)
- [x] [GLM-4.5](./autoregressive/GLM/GLM-4.5.md)
- [x] [GLM-4.5V](./autoregressive/GLM/GLM-4.5V.md)
- [x] [GLM-4.6](./autoregressive/GLM/GLM-4.6.md)
- [x] [GLM-4.6V](./autoregressive/GLM/GLM-4.6V.md)
- [x] [GLM-4.7](./autoregressive/GLM/GLM-4.7.md)
- [x] [GLM-4.7-Flash](./autoregressive/GLM/GLM-4.7-Flash.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>

#### OpenAI

- [x] [gpt-oss](./autoregressive/OpenAI/GPT-OSS.md)

#### Moonshotai

- [x] [Kimi-K2](./autoregressive/Moonshotai/Kimi-K2.md)
- [ ] [Kimi-Linear](./autoregressive/Moonshotai/Kimi-Linear.md)
- [x] [Kimi-K2.5](./autoregressive/Moonshotai/Kimi-K2.5.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>

#### MiniMax

- [ ] [MiniMax-M2](./autoregressive/MiniMax/MiniMax-M2.md)

#### NVIDIA

- [x] [Nemotron-Nano-3-30B-A3B](./autoregressive/NVIDIA/Nemotron3-Nano.md)

#### Ernie

- [ ] [Ernie4.5](./autoregressive/Ernie/Ernie4.5.md)
- [ ] [Ernie4.5-VL](./autoregressive/Ernie/Ernie4.5-VL.md)

#### InternVL

- [ ] [InternVL3.5](./autoregressive/InternVL/InternVL3_5.md)

#### InternLM

- [ ] [Intern-S1](./autoregressive/InternLM/Intern-S1.md)

#### Jina AI

- [ ] [Jina-reranker-m0](./autoregressive/Jina/Jina-reranker-m0.md)

#### Mistral

- [ ] [Mistral-3](./autoregressive/Mistral/Mistral-3.md)
- [x] [Devstral 2](./autoregressive/Mistral/Devstral-2.md)

#### Xiaomi

- [x] [MiMo-V2-Flash](./autoregressive/Xiaomi/MiMo-V2-Flash.md)

#### FlashLabs

- [x] [Chroma 1.0](./autoregressive/FlashLabs/Chroma1.0.md)<span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>

### Diffusion Models

#### FLUX

- [x] [FLUX](./diffusion/FLUX/FLUX.md)

#### Qwen-Image

- [ ] [Qwen-Image](./diffusion/Qwen-Image/Qwen-Image.md)
- [x] [Qwen-Image-Edit](./diffusion/Qwen-Image/Qwen-Image-Edit.md)

#### Wan

- [ ] [Wan2.1](./diffusion/Wan/Wan2.1.md)
- [x] [Wan2.2](./diffusion/Wan/Wan2.2.md)

#### Z-Image

- [ ] [Z-Image](./diffusion/Z-Image/Z-Image-Turbo.md)

### Benchmarks

- [x] [Diffusion Model Benchmark](./base/benchmarks/diffusion_model_benchmark.md)
- [x] [LLM Benchmark](./base/benchmarks/lm_benchmark.md)

## Reference

- [Installation (PyPI)](./base/installation.md) - Install SGLang via pip or uv (stable and nightly)
- [Server arguments](./base/reference/server_arguments.md) - Understanding all the arguments

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
