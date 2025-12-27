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
├── README.md              # Main cookbook
├── examples/              # Usage scripts per model
│   ├── flux1_basic.py
│   ├── sdxl_turbo.py
│   ├── wan21_video.py
│   └── ...
├── benchmarks/             # Benchmark scripts
│   ├── bench_image.py
│   ├── bench_video.py
│   ├── compare_backends.py
│   └── run_all.sh
├── docs/                   # Diffusion model docs
│   ├── FLUX/               # FLUX series models docs
│   ├── Qwen_Image/         # Qwen-Image series models docs
│   ├── stable_diffusion/   # Stable Diffusion series models docs
│   └── Wan/                # Wan series models docs
├── src/                    # Diffusion model serving visualizations code
└── assets/
    └── output_examples/   # Curated generation examples
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
