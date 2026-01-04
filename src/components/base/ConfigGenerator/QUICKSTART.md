# Quick Start Guide: Creating a New Config Generator

This guide shows you how to quickly create a new configuration generator for any model.

## Step 1: Create Your Component File

Create a new file: `src/components/YourModelConfigGenerator/index.js`

```jsx
import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

const YourModelConfigGenerator = () => {
  const config = {
    options: {
      // Add your options here
    },
    generateCommand: function(values) {
      // Add your command generation logic here
      return 'your-command';
    }
  };

  return <ConfigGenerator config={config} />;
};

export default YourModelConfigGenerator;
```

## Step 2: Define Your Options

Add configuration options based on your needs:

### Radio Button Options (Single Choice)

```javascript
hardware: {
  name: 'hardware',           // Internal identifier
  title: 'Hardware Platform', // Display title
  items: [
    { id: 'gpu_a', label: 'GPU A', default: true },  // Default selected
    { id: 'gpu_b', label: 'GPU B', default: false }
  ]
}
```

### Checkbox Options (Multiple Choice)

```javascript
features: {
  name: 'features',
  title: 'Features',
  type: 'checkbox',  // Important: specify type
  items: [
    { id: 'feature1', label: 'Feature 1', default: true },
    { id: 'feature2', label: 'Feature 2', default: false },
    { id: 'feature3', label: 'Feature 3', default: false, required: true }  // Can't be unchecked
  ]
}
```

### Text Input Options

```javascript
modelPath: {
  name: 'modelPath',
  title: 'Model Path',
  type: 'text',  // Important: specify type
  default: 'path/to/model',
  placeholder: 'Enter model path...'
}
```

## Step 3: Implement Command Generation

Write the logic to generate commands based on user selections:

```javascript
generateCommand: function(values) {
  // Extract values
  const { hardware, features, modelPath } = values;

  // Start building command
  let cmd = 'python3 -m sglang.launch_server';
  cmd += ` --model ${modelPath}`;

  // Handle radio button (single value)
  if (hardware === 'gpu_a') {
    cmd += ' --device-type gpu_a';
  } else if (hardware === 'gpu_b') {
    cmd += ' --device-type gpu_b';
  }

  // Handle checkboxes (array of values)
  const featureArray = Array.isArray(features) ? features : [];
  if (featureArray.includes('feature1')) {
    cmd += ' --enable-feature1';
  }
  if (featureArray.includes('feature2')) {
    cmd += ' --enable-feature2';
  }

  return cmd;
}
```

## Step 4: Use in Markdown

In your `.md` or `.mdx` file:

```mdx
---
title: Your Model Documentation
---

import YourModelConfigGenerator from '@site/src/components/YourModelConfigGenerator';

# Your Model

## Deployment Configuration

<YourModelConfigGenerator />
```

## Complete Example

Here's a complete, working example:

```jsx
import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

const ExampleConfigGenerator = () => {
  const config = {
    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h100', label: 'H100', default: true },
          { id: 'a100', label: 'A100', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'fp16', label: 'FP16', default: true },
          { id: 'int8', label: 'INT8', default: false },
          { id: 'int4', label: 'INT4', default: false }
        ]
      },
      parallelism: {
        name: 'parallelism',
        title: 'Parallelism Strategy',
        type: 'checkbox',
        items: [
          { id: 'tp', label: 'Tensor Parallel', subtitle: 'TP', default: true, required: true },
          { id: 'dp', label: 'Data Parallel', subtitle: 'DP', default: false },
          { id: 'pp', label: 'Pipeline Parallel', subtitle: 'PP', default: false }
        ]
      },
      modelPath: {
        name: 'modelPath',
        title: 'Model Path',
        type: 'text',
        default: 'org/model-name',
        placeholder: 'Enter model path from Hugging Face...'
      }
    },

    generateCommand: function(values) {
      const { hardware, quantization, parallelism, modelPath } = values;
      const parallelismArray = Array.isArray(parallelism) ? parallelism : [];

      // Validation example
      if (hardware === 'a100' && quantization === 'int4') {
        return '# Error: A100 does not support INT4 quantization\n' +
               '# Please choose FP16 or INT8, or use H100 hardware';
      }

      // Build command
      let cmd = 'python3 -m sglang.launch_server \\\n';
      cmd += `  --model-path ${modelPath}`;

      // Add quantization
      if (quantization !== 'fp16') {
        cmd += ` \\\n  --quantization ${quantization}`;
      }

      // Add parallelism strategies
      if (parallelismArray.includes('tp')) {
        cmd += ' \\\n  --tp 8';
      }
      if (parallelismArray.includes('dp')) {
        cmd += ' \\\n  --dp 4';
      }
      if (parallelismArray.includes('pp')) {
        cmd += ' \\\n  --pp 2';
      }

      // Hardware-specific options
      if (hardware === 'h100') {
        cmd += ' \\\n  --enable-h100-optimizations';
      }

      return cmd;
    }
  };

  return <ConfigGenerator config={config} />;
};

export default ExampleConfigGenerator;
```

## Tips

1. **Keep it simple**: Start with basic radio buttons, add complexity as needed
2. **Test thoroughly**: Try all combinations to ensure correct commands
3. **Add validation**: Check for incompatible option combinations
4. **Use subtitles**: Add helpful context with the `subtitle` property
5. **Multi-line commands**: Use `\\\n` for readable multi-line output
6. **Error messages**: Return clear error messages with solutions

## Next Steps

- See [README.md](./README.md) for detailed API documentation
- Check [DeepSeekR1ConfigGenerator](../DeepSeekR1ConfigGenerator/index.js) for a real-world example
- Customize styles in `styles.module.css` if needed

## Common Patterns

### Conditional Options Based on Previous Selection

```javascript
generateCommand: function(values) {
  const { hardware, quantization } = values;

  // Only add EP for specific hardware
  if (hardware === 'b200' && values.parallelism.includes('ep')) {
    cmd += ' --ep 8';
  }
}
```

### Model Path Mapping

```javascript
const modelMap = {
  'small': 'org/model-7b',
  'medium': 'org/model-13b',
  'large': 'org/model-70b'
};
const modelPath = modelMap[values.modelSize];
```

### Complex Validation

```javascript
generateCommand: function(values) {
  // Multiple validation checks
  const errors = [];

  if (values.hardware === 'a100' && values.quantization === 'int4') {
    errors.push('A100 does not support INT4');
  }

  if (values.batchSize > 128 && !values.features.includes('optimization')) {
    errors.push('Large batch sizes require optimization enabled');
  }

  if (errors.length > 0) {
    return '# Errors:\n' + errors.map(e => `# - ${e}`).join('\n');
  }

  // ... normal command generation
}
```
