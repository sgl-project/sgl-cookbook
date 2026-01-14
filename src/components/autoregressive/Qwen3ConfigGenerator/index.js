import React, { useState, useMemo } from 'react';
import styles from '../../base/ConfigGenerator/styles.module.css';

/**
 * Qwen3 Configuration Generator
 * Supports multiple Qwen3 model sizes (235B, 30B, 32B, 14B, 8B, 4B, 1.7B, 0.6B)
 * Custom implementation to handle model-specific logic without modifying ConfigGenerator
 */
const Qwen3ConfigGenerator = () => {
  const baseConfig = {
    modelFamily: 'Qwen',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h100', label: 'H100', default: false },
          { id: 'h200', label: 'H200', default: false },
          { id: 'mi300x', label: 'MI300X', default: false },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          { id: '235b', label: '235B', subtitle: 'MOE', default: true },
          { id: '30b', label: '30B', subtitle: 'MOE', default: false },
          { id: '32b', label: '32B', subtitle: 'Dense', default: false },
          { id: '14b', label: '14B', subtitle: 'Dense', default: false },
          { id: '8b', label: '8B', subtitle: 'Dense', default: false },
          { id: '4b', label: '4B', subtitle: 'Dense', default: false },
          { id: '1.7b', label: '1.7B', subtitle: 'Dense', default: false },
          { id: '0.6b', label: '0.6B', subtitle: 'Dense', default: false }
        ]
      },
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [
          { id: 'bf16', label: 'BF16', default: true },
          { id: 'fp8', label: 'FP8', default: false }
        ]
      },
      category: {
        name: 'category',
        title: 'Categories',
        items: [
          { id: 'base', label: 'Base', default: true },
          { id: 'instruct', label: 'Instruct', default: false },
          { id: 'thinking', label: 'Thinking', default: false }
        ]
      },
      reasoningParser: {
        name: 'reasoningParser',
        title: 'Reasoning Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        // Only visible when category is not 'instruct'
        visibleWhen: (values) => values.category !== 'instruct',
        // Only add command when category is not 'instruct' and enabled
        commandRule: (value, values) => {
          if (value === 'enabled' && values.category !== 'instruct') {
            return '--reasoning-parser qwen3';
          }
          return null;
        }
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen25' : null
      }
    },

    modelConfigs: {
      '235b': {
        baseName: '235B-A22B',
        hasThinkingVariants: true,
        h100: { tp: 8, ep: 0, bf16: true, fp8: true },
        h200: { tp: 8, ep: 0, bf16: true, fp8: true },
        b200: { tp: 8, ep: 0, bf16: true, fp8: true },
        mi300x: { tp: 4, ep: 0, bf16: true, fp8: true },
        mi325x: { tp: 4, ep: 0, bf16: true, fp8: true },
        mi355x: { tp: 4, ep: 0, bf16: true, fp8: true }
      },
      '30b': {
        baseName: '30B-A3B',
        hasThinkingVariants: true,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi300x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi325x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi355x: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '32b': {
        baseName: '32B',
        hasThinkingVariants: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi300x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi325x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi355x: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '14b': {
        baseName: '14B',
        hasThinkingVariants: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi300x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi325x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi355x: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '8b': {
        baseName: '8B',
        hasThinkingVariants: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi300x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi325x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi355x: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '4b': {
        baseName: '4B',
        hasThinkingVariants: true,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi300x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi325x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi355x: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '1.7b': {
        baseName: '1.7B',
        hasThinkingVariants: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi300x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi325x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi355x: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '0.6b': {
        baseName: '0.6B',
        hasThinkingVariants: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi300x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi325x: { tp: 1, ep: 0, bf16: true, fp8: true },
        mi355x: { tp: 1, ep: 0, bf16: true, fp8: true }
      }
    },

    specialCommands: {
      'h100-235b-bf16-instruct': '# Error: Model is too large, cannot fit into 8*H100\n# Please use H200 (141GB) or select FP8 quantization',
      'h100-235b-bf16-thinking': '# Error: Model is too large, cannot fit into 8*H100\n# Please use H200 (141GB) or select FP8 quantization'
    },

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize, quantization, category } = values;
      const commandKey = `${hardware}-${modelSize}-${quantization}-${category}`;

      if (this.specialCommands[commandKey]) {
        return this.specialCommands[commandKey];
      }

      const config = this.modelConfigs[modelSize];
      if (!config) {
        return `# Error: Unknown model size: ${modelSize}`;
      }

      const hwConfig = config[hardware];
      if (!hwConfig) {
        return `# Error: Unknown hardware platform: ${hardware}`;
      }

      const quantSuffix = quantization === 'fp8' ? '-FP8' : '';

      // Build model name based on model category
      let modelName;
      if (config.hasThinkingVariants) {
        // Models with Instruct/Thinking variants (235B, 30B, 4B)
        // 4B is Dense but treated as having variants here
        if (category === 'base') {
           // Explicitly handle base selection for variant-capable models if needed,
           // though the next block handles 'base only' models.
           // If 'base' is selected on a variant model, we usually want just the base name
           // or we need to ensure the thinking logic handles it.
           // Based on the code structure:
           // If category is 'base', we probably want just Qwen/Qwen3-XB[-FP8]
           // BUT the existing logic adds suffixes based on hasThinkingVariants.
           // Let's refine logic: if user selected 'base', don't add suffixes.
           modelName = `Qwen/Qwen3-${config.baseName}${quantSuffix}`;
        } else {
           const thinkingSuffix = category === 'thinking' ? '-Thinking' : '-Instruct';
           const dateSuffix = config.hasThinkingVariants ? '-2507' : '';
           modelName = `Qwen/Qwen3-${config.baseName}${thinkingSuffix}${dateSuffix}${quantSuffix}`;
        }
      } else {
        // Models without variants (32B, 14B, 8B, 1.7B, 0.6B) - base model only
        modelName = `Qwen/Qwen3-${config.baseName}${quantSuffix}`;
      }

      let cmd = 'python -m sglang.launch_server \\\n';
      cmd += `  --model ${modelName}`;

      if (hwConfig.tp > 1) {
        cmd += ` \\\n  --tp ${hwConfig.tp}`;
      }

      let ep = hwConfig.ep;
      if (quantization === 'fp8' && hwConfig.tp === 8) {
        ep = 2;
      }

      if (ep > 0) {
        cmd += ` \\\n  --ep ${ep}`;
      }

      // Apply commandRule from all options
      Object.entries(this.options).forEach(([key, option]) => {
        if (option.commandRule && values[key]) {
          // Pass the full values object so commandRule can access other option values
          const additionalCmd = option.commandRule(values[key], values);
          if (additionalCmd) {
            cmd += ` \\\n  ${additionalCmd}`;
          }
        }
      });

      return cmd;
    }
  };

  // Initialize state with default values
  const getInitialState = () => {
    const initialState = {};
    Object.entries(baseConfig.options).forEach(([key, option]) => {
      const defaultItem = option.items.find(item => item.default);
      initialState[key] = defaultItem ? defaultItem.id : option.items[0].id;
    });
    return initialState;
  };

  const [values, setValues] = useState(getInitialState());

  // Get current model config
  const currentModelConfig = baseConfig.modelConfigs[values.modelsize];

  // Dynamically adjust options based on model selection and filter by visibleWhen
  const displayOptions = useMemo(() => {
    const options = { ...baseConfig.options };

    // If model doesn't have thinking variants, modify category options
    if (currentModelConfig && !currentModelConfig.hasThinkingVariants) {
      options.category = {
        ...baseConfig.options.category,
        items: baseConfig.options.category.items.map(item => ({
          ...item,
          // Disable any option that is not 'base'
          disabled: item.id !== 'base'
        }))
      };
    }

    // Filter options based on visibleWhen condition
    const filteredOptions = {};
    Object.entries(options).forEach(([key, option]) => {
      // Check if option has visibleWhen condition
      if (option.visibleWhen) {
        // Only include if visibleWhen returns true
        if (option.visibleWhen(values)) {
          filteredOptions[key] = option;
        }
      } else {
        // No visibleWhen condition, always include
        filteredOptions[key] = option;
      }
    });

    return filteredOptions;
  }, [values, currentModelConfig]);

  // Handle radio change with auto-switching for non-variant models
  const handleRadioChange = (optionName, itemId) => {
    setValues(prev => {
      const newValues = { ...prev, [optionName]: itemId };

      // Auto-switch to 'base' category for models without thinking variants
      if (optionName === 'modelsize') {
        const modelConfig = baseConfig.modelConfigs[itemId];
        if (modelConfig && !modelConfig.hasThinkingVariants) {
          // If current category is not base, switch to base
          if (newValues.category !== 'base') {
            newValues.category = 'base';
          }
        }
      }

      // Reset reasoningParser when switching to 'instruct' category
      if (optionName === 'category' && itemId === 'instruct') {
        newValues.reasoningParser = 'disabled';
      }

      return newValues;
    });
  };

  // Generate command
  const command = baseConfig.generateCommand(values);

  return (
    <div className={styles.configContainer}>
      {Object.entries(displayOptions).map(([key, option]) => (
        <div key={key} className={styles.optionCard}>
          <div className={styles.optionTitle}>
            {option.title}
          </div>
          <div className={styles.optionItems}>
            {option.items.map(item => {
              const isChecked = values[option.name] === item.id;
              const isDisabled = item.disabled;
              return (
                <label
                  key={item.id}
                  className={`${styles.optionLabel} ${isChecked ? styles.checked : ''} ${isDisabled ? styles.disabled : ''}`}
                >
                  <input
                    type="radio"
                    name={option.name}
                    value={item.id}
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => handleRadioChange(option.name, item.id)}
                    className={styles.hiddenInput}
                  />
                  {item.label}
                  {item.subtitle && (
                    <small className={styles.subtitle}>{item.subtitle}</small>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className={styles.commandCard}>
        <div className={styles.commandTitle}>Generated Command</div>
        <pre className={styles.commandDisplay}>{command}</pre>
      </div>
    </div>
  );
};

export default Qwen3ConfigGenerator;
