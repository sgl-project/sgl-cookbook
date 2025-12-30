// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Benchmarks',
      items: [
        {type: 'doc', label: 'LLM Benchmark', id: 'benchmarks/lm_benchmark'},
        {type: 'doc', label: 'Diffusion Model Benchmark', id: 'benchmarks/diffusion_model_benchmark'},
      ],
    },
    {
      type: 'category',
      label: 'SpecBundle',
      items: [
        {type: 'doc', label: 'Supported Models', id: 'specbundle/supported_models'},
        {type: 'doc', label: 'Usage', id: 'specbundle/usage'},
      ],
    },
    {
      type: 'category',
      label: 'Diffusion Models',
      items: [
        {
          type: 'category',
          label: 'Wan',
          items: [
           'diffusion/models/Wan/Wan2.2'
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'LLMs(VLMs)',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Qwen',
          items: [
            'models/Qwen/Qwen3',
            'models/Qwen/Qwen3-Next',
            'models/Qwen/Qwen3-VL',
            'models/Qwen/Qwen3-Coder-480B-A35B',
            'models/Qwen/Qwen2.5-VL',
          ],
        },
        {
          type: 'category',
          label: 'DeepSeek',
          items: [
            'models/DeepSeek/DeepSeek-V3_2',
            'models/DeepSeek/DeepSeek-V3_1',
            'models/DeepSeek/DeepSeek-V3',
            'models/DeepSeek/DeepSeek-R1',
            'models/DeepSeek/DeepSeek-OCR',
          ],
        },
        {
          type: 'category',
          label: 'Llama',
          items: [
            'models/Llama/Llama4-Scout',
            'models/Llama/Llama3.3-70B',
            'models/Llama/Llama3.1',
          ],
        },
        {
          type: 'category',
          label: 'GLM',
          items: [
            'models/GLM/Glyph',
            'models/GLM/GLM-4.5V',
            'models/GLM/GLM-4.6',
            'models/GLM/GLM-4.6V',
            'models/GLM/GLM-4.5',
          ],
        },
        {
          type: 'category',
          label: 'OpenAI',
          items: [
            'models/OpenAI/GPT-OSS',
          ],
        },
        {
          type: 'category',
          label: 'Moonshotai',
          items: [
            'models/Moonshotai/Kimi-K2',
            'models/Moonshotai/Kimi-Linear',
          ],
        },
        {
          type: 'category',
          label: 'MiniMax',
          items: [
            'models/MiniMax/MiniMax-M2',
          ],
        },
        {
          type: 'category',
          label: 'NVIDIA',
          items: [
            'models/NVIDIA/Nemotron3-Nano',
          ],
        },
        {
          type: 'category',
          label: 'Ernie',
          items: [
            'models/Ernie/Ernie4.5',
            'models/Ernie/Ernie4.5-VL',
          ],
        },
        {
          type: 'category',
          label: 'InternVL',
          items: [
            'models/InternVL/InternVL3_5',
          ],
        },
        {
          type: 'category',
          label: 'InternLM',
          items: [
            'models/InternLM/Intern-S1',
          ],
        },
        {
          type: 'category',
          label: 'Jina AI',
          items: [
            'models/Jina/Jina-reranker-m0',
          ],
        },
        {
          type: 'category',
          label: 'Mistral',
          items: [
            'models/Mistral/Mistral-3',
            'models/Mistral/Devstral-2',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
