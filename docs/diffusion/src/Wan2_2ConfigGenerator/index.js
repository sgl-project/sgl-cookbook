import React, { useState, useMemo } from 'react';
import styles from '../../../../src/components/ConfigGenerator/styles.module.css';

const Wan2_2ConfigGenerator = () => {
  const baseConfig = {
    modelFamily: 'Wan2.2',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h100', label: 'H100', default: false },
          { id: 'h800', label: 'H800', default: false }
        ]
      },
      task: {
        name: 'task',
        title: 'Task Type',
        items: [
          { id: 'i2v', label: 'Image-to-Video (I2V)', default: false },
          { id: 't2v', label: 'Text-to-Video (T2V)', default: true },
          { id: 'ti2v', label: 'Text/Image-to-Video (TI2V)', default: false }
        ]
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Size',
        items: [
          {
            id: '14b',
            label: '14B',
            subtitle: 'Diffusers (A14B)',
            default: true,
            validTasks: ['i2v', 't2v']
          },
          {
            id: '5b',
            label: '5B',
            subtitle: 'Diffusers',
            default: false,
            validTasks: ['ti2v']
          }
        ]
      }
    },

    // Model ID mapping based on user provided list
    modelConfigs: {
      'i2v-14b': { repoId: 'Wan-AI/Wan2.2-I2V-A14B-Diffusers' },
      't2v-14b': { repoId: 'Wan-AI/Wan2.2-T2V-A14B-Diffusers' },
      'ti2v-5b': { repoId: 'Wan-AI/Wan2.2-TI2V-5B-Diffusers' }
    },

    generateCommand: function(values) {
      const { task, modelsize } = values;
      const configKey = `${task}-${modelsize}`;
      const config = this.modelConfigs[configKey];

      if (!config) {
        return `# Error: Invalid combination - ${task} does not support ${modelsize} model size.`;
      }

      // Standard Wan2.2 launch arguments
      return `sglang serve \\
  --model-path ${config.repoId} \\
  --pin-cpu-memory \\
  --offload_model True \\
  --ulysses-degree=2 \\
  --ring-degree=2`;
    }
  };

  const getInitialState = () => {
    const initialState = {};
    Object.entries(baseConfig.options).forEach(([key, option]) => {
      const defaultItem = option.items.find(item => item.default);
      initialState[key] = defaultItem ? defaultItem.id : option.items[0].id;
    });
    return initialState;
  };

  const [values, setValues] = useState(getInitialState);

  // Filter available options based on logic
  const displayOptions = useMemo(() => {
    const options = { ...baseConfig.options };
    const currentTask = values.task;

    // Filter model sizes based on the selected task
    // Only show sizes that include the current task in their 'validTasks' array
    options.modelsize = {
      ...baseConfig.options.modelsize,
      items: baseConfig.options.modelsize.items.filter(item =>
        item.validTasks.includes(currentTask)
      )
    };

    return options;
  }, [values.task]);

  const handleRadioChange = (optionName, itemId) => {
    setValues(prev => {
      const newValues = { ...prev, [optionName]: itemId };

      // Logic to auto-switch Model Size when Task changes
      // Because 5B is exclusive to TI2V, and 14B is exclusive to I2V/T2V
      if (optionName === 'task') {
        if (itemId === 'ti2v') {
          newValues.modelsize = '5b';
        } else {
          newValues.modelsize = '14b';
        }
      }

      return newValues;
    });
  };

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
              // Some logic could disable items, currently handled by filtering
              const isDisabled = false;

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

export default Wan2_2ConfigGenerator;
