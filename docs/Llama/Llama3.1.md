# Llama3.1 Usage Guide

## 1. Model Introduction
The Meta Llama 3.1 large language models are a collection of pretrained and instruction tuned generative models, released in July 2024. These models are available in 8B, 70B and 405B sizes, with the 405B variant being the most capable fully-open source model at the time.

These models bring open intelligence to all, with several new features and improvements:

- **Stronger General Intelligence**: These models showcase significant improvements in coding, state-of-the-art tool use, and overall stronger reasoning capabilities.
- **Extended Context Length**: Llama 3.1 extends the context length to 128K tokens to improve performance over long context tasks such as summarization and code reasoning.
- **Tool Use**: Llama 3.1 is trained to interact with a search engine, python interpreter and mathematical engine, and also improves zero-shot tool use capabilities to interact with potentially unseen tools.
- **Multilinguality**: Llama 3.1 supports 7 languages in addition to English: French, German, Hindi, Italian, Portuguese, Spanish, and Thai.

For further details, please refer to the [Llama 3.1 blog](https://ai.meta.com/blog/meta-llama-3-1/) and the [Llama 3.1 model card](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md)

## 2. SGLang Installation
SGLang offers multiple installation methods. You can choose the most suitable installation method based on your hardware platform and requirements.

Please refer to the [official SGLang installation guide](https://docs.sglang.ai/get_started/install.html) for installation instructions.

## 3. Model Deployment
TODO: Hardware can be just H100 for now.

Model sizes: 8B, 70B, 405B

Type: Base, Instruct

Quantization: Check if provided

Tool Call parser: Does it work?

### 3.1 Basic Configuration

### 3.2 Configuration Tips

## 4. Model Invocation

### 4.1 Basic Usage

### 4.2 Advanced Usage
#### 4.2.1 Tool Calling
Llama3 supports tool calling capabilities. First, enable the tool call parser:

```shell
python -m sglang.launch_server \
  --model  \
  --tool-call-parser qwen3 \
  --tp 8 \
  --host 0.0.0.0 \
  --port 8000
```

Can use normal as well as pythonic (can just link to it instead of duplicating here)

## 5. Benchmark

### 5.1 Speed Benchmark


#### 5.1.1 Standard Scenario Benchmark

##### 5.1.1.1 Low Concurrency

##### 5.1.1.2 Medium Concurrency

##### 5.1.1.3 High Concurrency

#### 5.1.2 Summarization Scenario Benchmark
##### 5.1.2.1 Low Concurrency

##### 5.1.2.2 Medium Concurrency

##### 5.1.2.3 High Concurrency

### 5.2 Accuracy Benchmark

#### 5.2.1 GSM8K Benchmark


## 📝 Community Contribution Welcome

This guide is currently under development. We welcome community contributions!

If you have experience deploying **Llama3.3-70B** with SGLang, please help us complete this documentation.

