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
      },
      // Block 4: LoRA Master Switch
      loraEnabled: {
        name: 'loraEnabled',
        title: 'LoRA Support',
        items: [
          { id: 'off', label: 'Disabled', default: true },
          { id: 'on', label: 'Enable LoRA', default: false }
        ]
      }
    },

    modelConfigs: {
      'i2v-14b': {
        repoId: 'Wan-AI/Wan2.2-I2V-A14B-Diffusers',
        supportedLoras: [
          { id: 'distill', path: 'lightx2v/Wan2.2-Distill-Loras' },
          // You can add more LoRAs here for I2V in the future
        ]
      },
      't2v-14b': {
        repoId: 'Wan-AI/Wan2.2-T2V-A14B-Diffusers',
        supportedLoras: [
          { id: 'arcane', path: 'Cseti/wan2.2-14B-Arcane_Jinx-lora-v1' }
          // Example of multiple LoRAs:
          // { id: 'other', label: 'Other Style', path: 'Example/Other-LoRA' }
        ]
      },
      'ti2v-5b': {
        repoId: 'Wan-AI/Wan2.2-TI2V-5B-Diffusers',
        supportedLoras: []
      }
    },

    generateCommand: function(values) {
      const { task, modelsize, loraEnabled, selectedLoraPath } = values;
      const configKey = `${task}-${modelsize}`;
      const config = this.modelConfigs[configKey];

      if (!config) return `# Error: Invalid configuration`;

      let command = `sglang serve \\
  --model-path ${config.repoId} \\
  --dit-layerwise-offload true \\
  --ulysses-degree=2 \\
  --ring-degree=2`;

      // Only append lora-path if switch is ON and a path exists
      if (loraEnabled === 'on' && selectedLoraPath) {
        command += ` \\
  --lora-path ${selectedLoraPath}`;
      }

      return command;
    }
  };

  const getInitialState = () => {
    const initialState = {};
    Object.entries(baseConfig.options).forEach(([key, option]) => {
      const defaultItem = option.items.find(item => item.default);
      initialState[key] = defaultItem ? defaultItem.id : option.items[0].id;
    });
    initialState.selectedLoraPath = '';
    return initialState;
  };

  const [values, setValues] = useState(getInitialState);

  // Memoize available LoRAs for the current selection
  const availableLoras = useMemo(() => {
    const configKey = `${values.task}-${values.modelsize}`;
    return baseConfig.modelConfigs[configKey]?.supportedLoras || [];
  }, [values.task, values.modelsize]);

  const handleRadioChange = (optionName, itemId) => {
    setValues(prev => {
      // 1. Update the specific field
      const newValues = { ...prev, [optionName]: itemId };

      // 2. Logic: Auto-switch Model Size when Task changes
      if (optionName === 'task') {
        newValues.modelsize = (itemId === 'ti2v') ? '5b' : '14b';
      }

      // 3. Sync LoRA Logic: Check supported LoRAs for the resulting model
      const configKey = `${newValues.task}-${newValues.modelsize}`;
      const currentModelLoras = baseConfig.modelConfigs[configKey]?.supportedLoras || [];

      if (currentModelLoras.length === 0) {
        // Force turn off LoRA if the model doesn't support any
        newValues.loraEnabled = 'off';
        newValues.selectedLoraPath = '';
      } else {
        // If LoRA is enabled, ensure a valid LoRA path is selected
        if (newValues.loraEnabled === 'on') {
          const isStillValid = currentModelLoras.some(l => l.path === newValues.selectedLoraPath);
          // If the previous selection is not valid for the new model (or just enabled), pick the first one
          if (!isStillValid) {
            newValues.selectedLoraPath = currentModelLoras[0].path;
          }
        }
      }

      return newValues;
    });
  };

  const handleLoraSelect = (path) => {
    setValues(prev => ({ ...prev, selectedLoraPath: path }));
  };

  const command = baseConfig.generateCommand(values);

  return (
    <div className={styles.configContainer}>
      {/* Block 1-4: Standard Options */}
      {Object.entries(baseConfig.options).map(([key, option], index) => {
        // Filter model size items based on task
        const itemsToDisplay = key === 'modelsize'
          ? option.items.filter(item => item.validTasks.includes(values.task))
          : option.items;

        return (
          <div key={key} className={styles.optionCard}>
            <div className={styles.optionTitle}>
              <span className={styles.optionNumber}>{index + 1}</span>
              {option.title}
            </div>
            <div className={styles.optionItems}>
              {itemsToDisplay.map(item => {
                const isChecked = values[key] === item.id;
                // Disable "Enable LoRA" if no LoRA model exists in our map for the current selection
                const isDisabled = (key === 'loraEnabled' && item.id === 'on' && availableLoras.length === 0);

                return (
                  <label
                    key={item.id}
                    className={`${styles.optionLabel} ${isChecked ? styles.checked : ''} ${isDisabled ? styles.disabled : ''}`}
                  >
                    <input
                      type="radio"
                      name={option.name}
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => !isDisabled && handleRadioChange(key, item.id)}
                      className={styles.hiddenInput}
                    />
                    {item.label}
                    {item.subtitle && <small className={styles.subtitle}>{item.subtitle}</small>}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Block 5: Conditional LoRA Model Selector (Multiple LoRAs Support) */}
      {values.loraEnabled === 'on' && availableLoras.length > 0 && (
        <div className={styles.optionCard}>
          <div className={styles.optionTitle}>
            <span className={styles.optionNumber}>5</span>
            Select LoRA Model(The part of all the supported lora models)
          </div>
          <div className={styles.optionItems}>
            {availableLoras.map(lora => {
              const isChecked = values.selectedLoraPath === lora.path;
              return (
                <label
                  key={lora.id}
                  className={`${styles.optionLabel} ${isChecked ? styles.checked : ''}`}
                >
                  <input
                    type="radio"
                    name="loraModelSelection"
                    checked={isChecked}
                    onChange={() => handleLoraSelect(lora.path)}
                    className={styles.hiddenInput}
                  />
                  {lora.label}
                  <small className={styles.subtitle}>{lora.path}</small>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.commandCard}>
        <div className={styles.commandTitle}>Generated Command</div>
        <pre className={styles.commandDisplay}>{command}</pre>
      </div>
    </div>
  );
};

export default Wan2_2ConfigGenerator;
