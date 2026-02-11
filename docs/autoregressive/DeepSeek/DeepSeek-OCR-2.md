---
sidebar_position: 2
---

# DeepSeek-OCR-2

## 1. Model Introduction

[DeepSeek-OCR-2](https://github.com/deepseek-ai/DeepSeek-OCR-2) is DeepSeek's next-generation OCR (Optical Character Recognition) model, building on DeepSeek-OCR with improved accuracy and broader document understanding capabilities. The model is optimized for high-accuracy text extraction from images across a wide variety of document types and formats.

**Key Features:**

- **Advanced OCR**: High-accuracy text recognition from images and documents
- **Multi-Modality**: Supports various image formats and document types
- **FP8 Support**: Native FP8 quantization support for improved throughput on modern hardware

**Available Models:**

- **Base Model**: [deepseek-ai/DeepSeek-OCR-2](https://huggingface.co/deepseek-ai/DeepSeek-OCR-2) - Recommended for OCR tasks

**License:**
To use DeepSeek-OCR-2, you must agree to DeepSeek's Community License. See [LICENSE](https://huggingface.co/deepseek-ai/DeepSeek-OCR-2/blob/main/LICENSE) for details.

For more details, please refer to the [official DeepSeek-OCR-2 repository](https://github.com/deepseek-ai/DeepSeek-OCR-2).

## 2. SGLang Installation

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment

This section provides deployment configurations optimized for different hardware platforms and use cases.

### 3.1 Basic Configuration

**Interactive Command Generator**: Use the configuration selector below to automatically generate the appropriate deployment command for your hardware platform, quantization method, and deployment strategy.

import DeepSeekOCR2ConfigGenerator from '@site/src/components/autoregressive/DeepSeekOCR2ConfigGenerator';

<DeepSeekOCR2ConfigGenerator />

### 3.2 Configuration Tips

For more detailed configuration tips, please refer to [DeepSeek V3/V3.1/R1 Usage](https://docs.sglang.io/basic_usage/deepseek_v3.html).

## 4. Model Invocation

### 4.1 Basic Usage

For basic API usage and request examples, please refer to:

- [SGLang Basic Usage Guide](https://docs.sglang.ai/basic_usage/send_request.html)


## 5. Benchmark

### 5.1 Speed Benchmark

Coming soon.
