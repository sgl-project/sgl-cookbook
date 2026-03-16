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

- [x] [Qwen3.5](./autoregressive/Qwen/Qwen3.5.md)
- [x] [Qwen3](./autoregressive/Qwen/Qwen3.md)
- [x] [Qwen3-Next](./autoregressive/Qwen/Qwen3-Next.md)
- [x] [Qwen3-VL](./autoregressive/Qwen/Qwen3-VL.md)
- [x] [Qwen3-Coder](./autoregressive/Qwen/Qwen3-Coder.md)
- [x] [Qwen3-Coder-Next](./autoregressive/Qwen/Qwen3-Coder-Next.md)
- [x] [Qwen2.5-VL](./autoregressive/Qwen/Qwen2.5-VL.md)

#### DeepSeek

- [x] [DeepSeek-V3.2](./autoregressive/DeepSeek/DeepSeek-V3_2.md)
- [x] [DeepSeek-V3.1](./autoregressive/DeepSeek/DeepSeek-V3_1.md)
- [x] [DeepSeek-V3](./autoregressive/DeepSeek/DeepSeek-V3.md)
- [x] [DeepSeek-R1](./autoregressive/DeepSeek/DeepSeek-R1.md)
- [x] [DeepSeek-OCR](./autoregressive/DeepSeek/DeepSeek-OCR.md)
- [x] [DeepSeek-OCR-2](./autoregressive/DeepSeek/DeepSeek-OCR-2.md)

#### Llama

- [ ] [Llama4-Scout](./autoregressive/Llama/Llama4-Scout.md)
- [x] [Llama3.3-70B](./autoregressive/Llama/Llama3.3-70B.md)
- [x] [Llama3.1](./autoregressive/Llama/Llama3.1.md)

#### GLM

- [x] [GLM-5](./autoregressive/GLM/GLM-5.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>
- [x] [GLM-OCR](./autoregressive/GLM/GLM-OCR.md)
- [x] [GLM-Glyph](./autoregressive/GLM/Glyph.md)
- [x] [GLM-4.5](./autoregressive/GLM/GLM-4.5.md)
- [x] [GLM-4.5V](./autoregressive/GLM/GLM-4.5V.md)
- [x] [GLM-4.6](./autoregressive/GLM/GLM-4.6.md)
- [x] [GLM-4.6V](./autoregressive/GLM/GLM-4.6V.md)
- [x] [GLM-4.5](./autoregressive/GLM/GLM-4.5.md)
- [x] [GLM-4.7](./autoregressive/GLM/GLM-4.7.md)
- [x] [GLM-4.7-Flash](./autoregressive/GLM/GLM-4.7-Flash.md)

#### OpenAI

- [x] [gpt-oss](./autoregressive/OpenAI/GPT-OSS.md)

#### Moonshotai

- [x] [Kimi-K2.5](./autoregressive/Moonshotai/Kimi-K2.5.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>
- [x] [Kimi-K2](./autoregressive/Moonshotai/Kimi-K2.md)
- [x] [Kimi-Linear](./autoregressive/Moonshotai/Kimi-Linear.md)

#### MiniMax

- [x] [MiniMax-M2.5](./autoregressive/MiniMax/MiniMax-M2.5.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>
- [ ] [MiniMax-M2](./autoregressive/MiniMax/MiniMax-M2.md)

#### NVIDIA

- [x] [Nemotron3-Super](./autoregressive/NVIDIA/Nemotron3-Super.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>
- [x] [Nemotron-Nano-3-30B-A3B](./autoregressive/NVIDIA/Nemotron3-Nano.md)

#### Ernie

- [x] [Ernie4.5](./autoregressive/Ernie/Ernie4.5.md)
- [ ] [Ernie4.5-VL](./autoregressive/Ernie/Ernie4.5-VL.md)

#### InternVL

- [ ] [InternVL3.5](./autoregressive/InternVL/InternVL3_5.md)

#### InternLM

- [ ] [Intern-S1](./autoregressive/InternLM/Intern-S1.md)

#### Jina AI

- [ ] [Jina-reranker-m0](./autoregressive/Jina/Jina-reranker-m0.md)

#### Mistral

- [x] [Mistral Small 4](./autoregressive/Mistral/Mistral-Small-4.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>
- [ ] [Mistral-3](./autoregressive/Mistral/Mistral-3.md)
- [x] [Devstral 2](./autoregressive/Mistral/Devstral-2.md)

#### Xiaomi

- [x] [MiMo-V2-Flash](./autoregressive/Xiaomi/MiMo-V2-Flash.md)

#### FlashLabs

- [x] [Chroma 1.0](./autoregressive/FlashLabs/Chroma1.0.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>

#### StepFun

- [x] [Step3.5](./autoregressive/StepFun/Step3.5.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>
- [x] [Step3-VL-10B](./autoregressive/StepFun/Step3-VL-10B.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>

#### InclusionAI

- [x] [Ling-2.5-1T](./autoregressive/InclusionAI/Ling-2.5-1T.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>
- [x] [Ring-2.5-1T](./autoregressive/InclusionAI/Ring-2.5-1T.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>
- [x] [LLaDA 2.1](./autoregressive/LLaDA/LLaDA-2.1.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>

### Diffusion Models

#### FLUX

- [x] [FLUX](./diffusion/FLUX/FLUX.md)

#### Wan

- [ ] [Wan2.1](./diffusion/Wan/Wan2.1.md)
- [x] [Wan2.2](./diffusion/Wan/Wan2.2.md)

#### Qwen-Image

- [x] [Qwen-Image](./diffusion/Qwen-Image/Qwen-Image.md)
- [x] [Qwen-Image-Edit](./diffusion/Qwen-Image/Qwen-Image-Edit.md)

#### Z-Image

- [x] [Z-Image](./diffusion/Z-Image/Z-Image-Turbo.md)

#### MOVA

- [x] [MOVA](./diffusion/MOVA/MOVA.md)

### SGLang Omni

#### FishAudio

- [x] [S2 Pro (TTS)](./omni/S2-Pro/S2-Pro.md) <span style={{backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px'}}>NEW</span>

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

**Contribution templates — start here:**

- [Autoregressive Model Template](https://github.com/sgl-project/sgl-cookbook/issues/16) — Full template for LLM recipes (deployment, API usage, benchmarks)
- [Diffusion Model Template](https://github.com/sgl-project/sgl-cookbook/issues/32) — Template for image/video generation models

> **Maintainers:** We have a Claude Code skill that automates most of the contribution workflow — from scaffolding docs, config generators, YAML configs, to sidebar updates. Run `/add-model` in [Claude Code](https://claude.ai/claude-code) to use it.

**Ways to contribute:**

- Add a new recipe for a model not yet covered
- Add AMD MI300X/MI325X/MI355X GPU support to existing models
- Improve existing recipes with benchmarks, tips, or configurations
- Report issues or suggest enhancements

**Quick start:**

```shell
# Fork the repo and clone locally
git clone https://github.com/YOUR_USERNAME/sgl-cookbook.git
cd sgl-cookbook

# Install dependencies and start dev server
npm install && npm start

# Create a new branch
git checkout -b add-my-recipe

# Add your recipe following the templates above
# Submit a PR!
```

Each model recipe needs 3 files: a `.md` doc, a ConfigGenerator component, and a `sidebars.js` entry. Use [DeepSeek-V3.2](./autoregressive/DeepSeek/DeepSeek-V3_2.md) as a reference. All deployment commands must use `sglang serve` (not the deprecated `python -m sglang.launch_server`).

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
