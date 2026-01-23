# SGLang Diffusion Cookbook

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/sgl-project/sgl-cookbook/pulls)

Create a comprehensive cookbook for diffusion models in SGLang, demonstrating SGLang's performance advantages for image and video generation workloads.

## 🎯 What You'll Find Here

This cookbook aggregates battle-tested SGLang recipes covering:

- **Models**: Mainstream Image and Video generation  Models
- **Use Cases**: Inference serving, deployment strategies
- **Hardware**: GPU and CPU configurations, optimization for different accelerators
- **Best Practices**: Configuration templates, performance tuning, troubleshooting guides

Each recipe provides step-by-step instructions to help you quickly implement SGLang solutions for your specific requirements.

## 🚀 Quick Start

1. Browse the recipe index above to find your model
2. Follow the step-by-step instructions in each guide
3. Adapt configurations to your specific hardware and requirements
4. Join our community to share feedback and improvements

The sglang diffusion cookbook directory structure are shown below:

```
sgl-cookbook/docs/diffusion/
├── README.md              # Main cookbook (this file)
├── Qwen-Image/            # Qwen-Image series models docs
│   ├── Qwen-Image.md
│   └── Qwen-Image-Edit.md
├── Wan/                   # Wan series models docs
│   ├── Wan2.1.md
│   └── Wan2.2.md
├── Z-Image/               # Z-Image series models docs
│   └── Z-Image-Turbo.md
└── ...
```

## 🤝 Contributing

We believe the best documentation comes from practitioners. Whether you've optimized SGLang for a specific model, solved a tricky deployment challenge, or discovered performance improvements, we encourage you to contribute your recipes!

**💪How to Contribute**

- Comment below if interested (mention which role)
- Join discussion on implementation details
- Fork repo and work on assigned section
- Submit PR following SGLang cookbook standards
- Iterate based on review feedback

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

## Tips for Best Practices

- If you have sufficient VRAM, consider disabling cpu offload options to get better result. You can check the console output to determine which components can safely remain resident:
```text
Peak GPU memory: 52.51 GB, Remaining GPU memory at peak: 27.14 GB. Components that can stay resident: [text_encoder]
```
- `--dit-layerwise-offload` is enabled for video models by default, but it doesn't always improve performance. Feel free to adjust this option as needed.

## 📖 Resources

- [SGLang GitHub](https://github.com/sgl-project/sglang)
- [SGLang Documentation](https://sgl-project.github.io)
- [SGLANG Diffusion Documentation](https://github.com/sgl-project/sglang/blob/main/python/sglang/multimodal_gen/README.md)
- [SLACK Channel](https://sgl-fru7574.slack.com/archives/C07GLLLESNR)
- [Community Slack/Discord](https://discord.gg/MpEEuAeb)

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](https://github.com/sgl-project/sgl-cookbook/blob/main/LICENSE) file for details.

---

**Let's build this resource together!** 🚀 Star the repo and contribute your recipes to help the SGLang community grow.
