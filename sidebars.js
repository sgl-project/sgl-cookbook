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
      label: 'Autoregressive Models',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Qwen',
          items: [
            {
              type: 'doc',
              id: 'autoregressive/Qwen/Qwen3.5',
              label: 'Qwen3.5 [NEW]',
            },
            'autoregressive/Qwen/Qwen3',
            'autoregressive/Qwen/Qwen3-Next',
            'autoregressive/Qwen/Qwen3-VL',
            'autoregressive/Qwen/Qwen3-Coder',
            'autoregressive/Qwen/Qwen3-Coder-Next',
            'autoregressive/Qwen/Qwen2.5-VL',
          ],
        },
        {
          type: 'category',
          label: 'DeepSeek',
          items: [
            'autoregressive/DeepSeek/DeepSeek-V3_2',
            'autoregressive/DeepSeek/DeepSeek-V3_1',
            'autoregressive/DeepSeek/DeepSeek-V3',
            'autoregressive/DeepSeek/DeepSeek-R1',
            'autoregressive/DeepSeek/DeepSeek-OCR',
            'autoregressive/DeepSeek/DeepSeek-OCR-2',
          ],
        },
        {
          type: 'category',
          label: 'Llama',
          items: [
            'autoregressive/Llama/Llama4-Scout',
            'autoregressive/Llama/Llama3.3-70B',
            'autoregressive/Llama/Llama3.1',
          ],
        },
        {
          type: 'category',
          label: 'GLM',
          items: [
            {
              type: 'doc',
              id: 'autoregressive/GLM/GLM-5',
              label: 'GLM-5 [NEW]',
            },
            {
              type: 'doc',
              id: 'autoregressive/GLM/GLM-OCR',
              label: 'GLM-OCR',
            },
            'autoregressive/GLM/Glyph',
            'autoregressive/GLM/GLM-4.5V',
            'autoregressive/GLM/GLM-4.6',
            'autoregressive/GLM/GLM-4.6V',
            'autoregressive/GLM/GLM-4.5',
            'autoregressive/GLM/GLM-4.7',
            {
              type: 'doc',
              id: 'autoregressive/GLM/GLM-4.7-Flash',
              label: 'GLM-4.7-Flash',
            },
          ],
        },
        {
          type: 'category',
          label: 'OpenAI',
          items: [
            'autoregressive/OpenAI/GPT-OSS',
          ],
        },
        {
          type: 'category',
          label: 'Moonshotai',
          items: [
            {
              type: 'doc',
              id: 'autoregressive/Moonshotai/Kimi-K2.5',
              label: 'Kimi-K2.5 [NEW]',
            },
            'autoregressive/Moonshotai/Kimi-K2',
            'autoregressive/Moonshotai/Kimi-Linear',
          ],
        },
        {
          type: 'category',
          label: 'MiniMax',
          items: [
            {
              type: 'doc',
              id: 'autoregressive/MiniMax/MiniMax-M2.5',
              label: 'MiniMax-M2.5 [NEW]',
            },
            'autoregressive/MiniMax/MiniMax-M2',
          ],
        },
        {
          type: 'category',
          label: 'NVIDIA',
          items: [
            'autoregressive/NVIDIA/Nemotron3-Nano',
          ],
        },
        {
          type: 'category',
          label: 'Ernie',
          items: [
            'autoregressive/Ernie/Ernie4.5',
            'autoregressive/Ernie/Ernie4.5-VL',
          ],
        },
        {
          type: 'category',
          label: 'InternVL',
          items: [
            'autoregressive/InternVL/InternVL3_5',
          ],
        },
        {
          type: 'category',
          label: 'InternLM',
          items: [
            'autoregressive/InternLM/Intern-S1',
          ],
        },
        {
          type: 'category',
          label: 'Jina AI',
          items: [
            'autoregressive/Jina/Jina-reranker-m0',
          ],
        },
        {
          type: 'category',
          label: 'Mistral',
          items: [
            'autoregressive/Mistral/Mistral-3',
            'autoregressive/Mistral/Devstral-2',
          ],
        },
        {
          type: 'category',
          label: 'Xiaomi',
          items: [
            'autoregressive/Xiaomi/MiMo-V2-Flash',
          ],
        },
        {
          type: 'category',
          label: 'FlashLabs',
          items: [
            {
              type: 'doc',
              id: 'autoregressive/FlashLabs/Chroma1.0',
              label: 'Chroma 1.0 [NEW]',
            },
          ],
        },
        {
          type: 'category',
          label: 'StepFun',
          items: [
            {
              type: 'doc',
              id: 'autoregressive/StepFun/Step3.5',
              label: 'Step3.5 [NEW]',
            },
            {
              type: 'doc',
              id: 'autoregressive/StepFun/Step3-VL-10B',
              label: 'Step3-VL-10B [NEW]',
            },
          ],
        },
        {
          type: 'category',
          label: 'InclusionAI',
          items: [
            {
              type: 'doc',
              id: 'autoregressive/InclusionAI/Ling-2.5-1T',
              label: 'Ling-2.5-1T [NEW]',
            },
            {
              type: 'doc',
              id: 'autoregressive/InclusionAI/Ring-2.5-1T',
              label: 'Ring-2.5-1T [NEW]',
            },
            {
              type: 'doc',
              id: 'autoregressive/LLaDA/LLaDA-2.1',
              label: 'LLaDA 2.1 [NEW]',
            },
          ],
        }
      ],
    },
    {
      type: 'category',
      label: 'Diffusion Models',
      items: [
        'diffusion/README',
        {
          type: 'category',
          label: 'FLUX',
          items: [
            'diffusion/FLUX/FLUX',
          ],
        },
        {
          type: 'category',
          label: 'Wan',
          items: [
            'diffusion/Wan/Wan2.1',
            'diffusion/Wan/Wan2.2',
          ],
        },
        {
          type: 'category',
          label: 'Qwen-Image',
          items: [
            'diffusion/Qwen-Image/Qwen-Image',
            'diffusion/Qwen-Image/Qwen-Image-Edit',
          ],
        },
        {
          type: 'category',
          label: 'Z-Image',
          items: [
            'diffusion/Z-Image/Z-Image-Turbo',
          ],
        },
        {
          type: 'category',
          label: 'MOVA',
          items: [
            'diffusion/MOVA/MOVA',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Others',
      items: [
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
          label: 'Benchmarks',
          items: [
            {type: 'doc', label: 'LLM Benchmark', id: 'base/benchmarks/lm_benchmark'},
            {type: 'doc', label: 'Diffusion Model Benchmark', id: 'base/benchmarks/diffusion_model_benchmark'},
          ],
        },
      ],
    },
  ],
};

export default sidebars;
