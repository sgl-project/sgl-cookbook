# ConfigGenerator Component

A reusable, generic configuration generator component for creating interactive command builders in documentation.

## Features

- **Flexible Configuration**: Support for radio buttons, checkboxes, and text inputs
- **Real-time Command Generation**: Automatically updates command output based on selections
- **Custom Validation**: Add custom validation rules and error messages
- **Theme Support**: Works with light and dark modes using Docusaurus CSS variables
- **Responsive Design**: Mobile-friendly layout

## Usage

### 1. Create a Wrapper Component

Create a new component that imports `ConfigGenerator` and provides your custom configuration:

```jsx
import React from 'react';
import ConfigGenerator from '../ConfigGenerator';

const MyModelConfigGenerator = () => {
  const config = {
    // Optional: Model family identifier
    modelFamily: 'my-model-family',
    
    // Define your configuration options
    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'h100', label: 'H100', default: true },
          { id: 'h200', label: 'H200', default: false }
        ]
      },
      // ... more options
    },
    
    // Command generation function
    generateCommand: function(values) {
      const { hardware } = values;
      let cmd = 'python3 -m sglang.launch_server';
      
      if (hardware === 'h100') {
        cmd += ' --gpu-type h100';
      }
      
      return cmd;
    }
  };
  
  return <ConfigGenerator config={config} />;
};

export default MyModelConfigGenerator;
```

### 2. Use in Markdown/MDX Files

Import and use your wrapper component in any `.md` or `.mdx` file:

```mdx
---
title: My Model
---

import MyModelConfigGenerator from '@site/src/components/MyModelConfigGenerator';

# Model Deployment

Use the interactive configuration generator below:

<MyModelConfigGenerator />
```

## Configuration Object Structure

### Basic Structure

```javascript
const config = {
  modelFamily: 'optional-model-family',  // Optional
  options: {
    // Option definitions (see below)
  },
  generateCommand: function(values) {
    // Command generation logic
    return 'generated-command-string';
  }
};
```

### Option Types

#### 1. Radio Button (Single Selection)

Default behavior when `type` is not specified:

```javascript
optionName: {
  name: 'optionName',
  title: 'Display Title',
  items: [
    { id: 'choice1', label: 'Choice 1', default: true },
    { id: 'choice2', label: 'Choice 2', default: false },
    { id: 'choice3', label: 'Choice 3', subtitle: 'Additional info', default: false }
  ]
}
```

**Properties:**
- `name`: Internal identifier (string)
- `title`: Display title (string)
- `items`: Array of choices
  - `id`: Unique identifier (string)
  - `label`: Display label (string)
  - `subtitle`: Optional subtitle text (string)
  - `default`: Whether this is the default selection (boolean)

#### 2. Checkbox (Multiple Selection)

Set `type: 'checkbox'`:

```javascript
optionName: {
  name: 'optionName',
  title: 'Display Title',
  type: 'checkbox',
  items: [
    { id: 'option1', label: 'Option 1', default: true },
    { id: 'option2', label: 'Option 2', default: false, required: true },
    { id: 'option3', label: 'Option 3', subtitle: 'Additional info', default: false }
  ]
}
```

**Additional Properties:**
- `required`: If `true`, prevents the user from unchecking this option (boolean)

**Note:** In `generateCommand`, checkbox values are returned as an array:
```javascript
generateCommand: function(values) {
  const strategies = values.optionName; // e.g., ['option1', 'option2']
  if (strategies.includes('option1')) {
    // ...
  }
}
```

#### 3. Text Input

Set `type: 'text'`:

```javascript
optionName: {
  name: 'optionName',
  title: 'Display Title',
  type: 'text',
  default: 'default value',
  placeholder: 'Enter value...'
}
```

**Properties:**
- `default`: Default text value (string)
- `placeholder`: Placeholder text (string)

### Command Generation Function

The `generateCommand` function receives a `values` object containing all user selections:

```javascript
generateCommand: function(values) {
  const { hardware, quantization, strategy } = values;
  
  // For radio buttons: string value
  if (hardware === 'h100') {
    // ...
  }
  
  // For checkboxes: array of strings
  const strategyArray = Array.isArray(strategy) ? strategy : [];
  if (strategyArray.includes('tp')) {
    // ...
  }
  
  // For text inputs: string value
  const modelPath = values.modelName || '';
  
  // Build and return command string
  let cmd = 'python3 -m sglang.launch_server';
  cmd += ` --model ${modelPath}`;
  
  return cmd;
}
```

**Tips:**
- Use multi-line strings with `\\n` for readable output
- Add validation checks and return error messages when needed
- Use template literals for cleaner string building

## Examples

### Example 1: Simple Configuration

```javascript
const config = {
  options: {
    model: {
      name: 'model',
      title: 'Model Selection',
      items: [
        { id: 'small', label: 'Small (7B)', default: true },
        { id: 'medium', label: 'Medium (13B)', default: false },
        { id: 'large', label: 'Large (70B)', default: false }
      ]
    }
  },
  generateCommand: function(values) {
    const modelSizes = { small: '7B', medium: '13B', large: '70B' };
    return `python3 -m sglang.launch_server --model my-model-${modelSizes[values.model]}`;
  }
};
```

### Example 2: With Validation

```javascript
const config = {
  options: {
    hardware: {
      name: 'hardware',
      title: 'Hardware',
      items: [
        { id: 'cpu', label: 'CPU', default: true },
        { id: 'gpu', label: 'GPU', default: false }
      ]
    },
    precision: {
      name: 'precision',
      title: 'Precision',
      items: [
        { id: 'fp32', label: 'FP32', default: true },
        { id: 'fp16', label: 'FP16', default: false }
      ]
    }
  },
  generateCommand: function(values) {
    // Validation
    if (values.hardware === 'cpu' && values.precision === 'fp16') {
      return '# Error: FP16 is not supported on CPU\n# Please select FP32 or use GPU';
    }
    
    let cmd = 'python3 -m sglang.launch_server';
    cmd += ` --device ${values.hardware}`;
    cmd += ` --precision ${values.precision}`;
    return cmd;
  }
};
```

### Example 3: Complex Configuration with Checkboxes

```javascript
const config = {
  options: {
    model: {
      name: 'model',
      title: 'Model',
      items: [
        { id: 'model-a', label: 'Model A', default: true },
        { id: 'model-b', label: 'Model B', default: false }
      ]
    },
    features: {
      name: 'features',
      title: 'Features',
      type: 'checkbox',
      items: [
        { id: 'cache', label: 'Enable Cache', default: true, required: true },
        { id: 'logging', label: 'Enable Logging', default: false },
        { id: 'profiling', label: 'Enable Profiling', default: false }
      ]
    },
    batchSize: {
      name: 'batchSize',
      title: 'Batch Size',
      type: 'text',
      default: '32',
      placeholder: 'Enter batch size'
    }
  },
  generateCommand: function(values) {
    const { model, features, batchSize } = values;
    const featureArray = Array.isArray(features) ? features : [];
    
    let cmd = `python3 -m sglang.launch_server --model ${model}`;
    cmd += ` --batch-size ${batchSize}`;
    
    if (featureArray.includes('cache')) {
      cmd += ' --enable-cache';
    }
    if (featureArray.includes('logging')) {
      cmd += ' --enable-logging';
    }
    if (featureArray.includes('profiling')) {
      cmd += ' --enable-profiling';
    }
    
    return cmd;
  }
};
```

## Styling

The component uses CSS modules with Docusaurus CSS variables for theme compatibility. The styles automatically adapt to light and dark modes.

To customize the appearance, you can:

1. Modify `/src/components/ConfigGenerator/styles.module.css`
2. Override CSS variables in your custom CSS
3. Use inline styles in your wrapper component (not recommended)

## Real-World Example

See `/src/components/DeepSeekR1ConfigGenerator/index.js` for a complete, production-ready example with:
- Multiple option types (radio, checkbox)
- Complex validation logic
- Conditional command generation
- Hardware-specific optimizations

## Best Practices

1. **Clear Labels**: Use descriptive labels and subtitles
2. **Sensible Defaults**: Set appropriate default values
3. **Validation**: Add validation for incompatible options
4. **Error Messages**: Provide clear error messages with solutions
5. **Documentation**: Add comments explaining complex logic
6. **Testing**: Test all combinations to ensure correct output

## Support

For issues or questions, please open an issue in the repository.

