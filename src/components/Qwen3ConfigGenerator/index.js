import React, { useState, useMemo } from 'react';
import styles from '../ConfigGenerator/styles.module.css';

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
          { id: 'h200', label: 'H200', default: false }
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
      thinking: {
        name: 'thinking',
        title: 'Thinking Capabilities',
        items: [
          { id: 'instruct', label: 'Instruct', default: true },
          { id: 'thinking', label: 'Thinking', default: false }
        ],
        commandRule: (value) => value === 'thinking' ? '--reasoning-parser qwen3' : null
      },
      toolcall: {
        name: 'toolcall',
        title: 'Tool Call Parser',
        items: [
          { id: 'disabled', label: 'Disabled', default: true },
          { id: 'enabled', label: 'Enabled', default: false }
        ],
        commandRule: (value) => value === 'enabled' ? '--tool-call-parser qwen' : null
      }
    },

    modelConfigs: {
      '235b': {
        baseName: '235B-A22B',
        isMOE: true,
        hasThinkingVariants: true,
        h100: { tp: 8, ep: 0, bf16: true, fp8: true },
        h200: { tp: 8, ep: 0, bf16: true, fp8: true },
        b200: { tp: 8, ep: 0, bf16: true, fp8: true }
      },
      '30b': {
        baseName: '30B-A3B',
        isMOE: true,
        hasThinkingVariants: true,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '32b': {
        baseName: '32B',
        isMOE: false,
        hasThinkingVariants: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '14b': {
        baseName: '14B',
        isMOE: false,
        hasThinkingVariants: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '8b': {
        baseName: '8B',
        isMOE: false,
        hasThinkingVariants: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '4b': {
        baseName: '4B',
        isMOE: true,
        hasThinkingVariants: true,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '1.7b': {
        baseName: '1.7B',
        isMOE: false,
        hasThinkingVariants: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      },
      '0.6b': {
        baseName: '0.6B',
        isMOE: false,
        hasThinkingVariants: false,
        h100: { tp: 1, ep: 0, bf16: true, fp8: true },
        h200: { tp: 1, ep: 0, bf16: true, fp8: true },
        b200: { tp: 1, ep: 0, bf16: true, fp8: true }
      }
    },

    specialCommands: {
      'h100-235b-bf16-instruct': '# Error: Model is too large, cannot fit into 8*H100\n# Please use H200 (141GB) or select FP8 quantization',
      'h100-235b-bf16-thinking': '# Error: Model is too large, cannot fit into 8*H100\n# Please use H200 (141GB) or select FP8 quantization'
    },

    generateCommand: function (values) {
      const { hardware, modelsize: modelSize, quantization, thinking } = values;
      const commandKey = `${hardware}-${modelSize}-${quantization}-${thinking}`;

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
      
      // Build model name based on model capabilities
      let modelName;
      if (config.hasThinkingVariants) {
        // Models with Instruct/Thinking variants (235B, 30B, 4B MOE)
        const thinkingSuffix = thinking === 'thinking' ? '-Thinking' : '-Instruct';
        const dateSuffix = config.isMOE ? '-2507' : '';
        modelName = `Qwen/Qwen3-${config.baseName}${thinkingSuffix}${dateSuffix}${quantSuffix}`;
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
          const additionalCmd = option.commandRule(values[key]);
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
  
  // Dynamically adjust options based on model selection
  const displayOptions = useMemo(() => {
    const options = { ...baseConfig.options };
    
    // If model doesn't have thinking variants, modify thinking options
    if (currentModelConfig && !currentModelConfig.hasThinkingVariants) {
      options.thinking = {
        ...baseConfig.options.thinking,
        items: baseConfig.options.thinking.items.map(item => ({
          ...item,
          disabled: item.id === 'instruct'
        }))
      };
    }
    
    return options;
  }, [values.modelsize, currentModelConfig]);

  // Handle radio change with auto-switching for non-variant models
  const handleRadioChange = (optionName, itemId) => {
    setValues(prev => {
      const newValues = { ...prev, [optionName]: itemId };
      
      // Auto-switch to thinking mode for models without variants
      if (optionName === 'modelsize') {
        const modelConfig = baseConfig.modelConfigs[itemId];
        if (modelConfig && !modelConfig.hasThinkingVariants) {
          newValues.thinking = 'thinking';
        }
      }
      
      return newValues;
    });
  };

  // Generate command
  const command = baseConfig.generateCommand(values);

  return (
    <div className={styles.configContainer}>
      {Object.entries(displayOptions).map(([key, option], index) => (
        <div key={key} className={styles.optionCard}>
          <div className={styles.optionTitle}>
            <span className={styles.optionNumber}>{index + 1}</span>
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

