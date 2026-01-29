import React, { useState, useMemo } from 'react';
import styles from '../../base/ConfigGenerator/styles.module.css';

const Wan2_2ConfigGenerator = () => {
  const baseConfig = {
    modelFamily: 'Wan2.2',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h200', label: 'H200', default: false },
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
            label: 'A14B',
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
      bestPractice: {
        name: 'bestPractice',
        title: 'Sequence Parallelism',
        items: [
          { id: 'off', label: 'Standard', default: true },
          { id: 'on', label: 'Best Practice (4 GPUs)', default: false }
        ]
      }
    },

    modelConfigs: {
      'i2v-14b': {
        repoId: 'Wan-AI/Wan2.2-I2V-A14B-Diffusers',
        supportedLoras: [
          { id: 'distill', path: 'lightx2v/Wan2.2-Distill-Loras' }
        ]
      },
      't2v-14b': {
        repoId: 'Wan-AI/Wan2.2-T2V-A14B-Diffusers',
        supportedLoras: [
          { id: 'arcane', path: 'Cseti/wan2.2-14B-Arcane_Jinx-lora-v1' }
        ]
      },
      'ti2v-5b': {
        repoId: 'Wan-AI/Wan2.2-TI2V-5B-Diffusers',
        supportedLoras: []
      }
    },

    generateCommand: function(values) {
      const { task, modelsize, selectedLoraPath, bestPractice } = values;
      const configKey = `${task}-${modelsize}`;
      const config = this.modelConfigs[configKey];

      if (!config) return `# Error: Invalid configuration`;

      let command = `sglang serve \\
  --model-path ${config.repoId} \\
  --dit-layerwise-offload true`;
      // Add Best Practice parameters if enabled
      if (bestPractice === 'on') {
        command += ` \\
  --num-gpus 4 \\
  --ulysses-degree 4`;
      }

      // Only add --lora-path if a LoRA is selected and it's not 'none'
      if (selectedLoraPath && selectedLoraPath !== 'none') {
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
    initialState.selectedLoraPath = 'none';
    return initialState;
  };

  const [values, setValues] = useState(getInitialState);

  const availableLoras = useMemo(() => {
    const configKey = `${values.task}-${values.modelsize}`;
    return baseConfig.modelConfigs[configKey]?.supportedLoras || [];
  }, [values.task, values.modelsize]);

  const handleRadioChange = (optionName, itemId) => {
    setValues(prev => {
      const newValues = { ...prev, [optionName]: itemId };
      if (optionName === 'task') {
        newValues.modelsize = (itemId === 'ti2v') ? '5b' : '14b';
      }

      // Sync Check: If the model changes, reset LoRA to none if the old one isn't supported
      const configKey = `${newValues.task}-${newValues.modelsize}`;
      const nextSupported = baseConfig.modelConfigs[configKey]?.supportedLoras || [];
      const isValid = nextSupported.some(l => l.path === prev.selectedLoraPath);
      if (!isValid) {
        newValues.selectedLoraPath = 'none';
      }
      return newValues;
    });
  };

  /**
   * Toggle Logic:
   * If the clicked LoRA is already selected, set it to 'none' (deselect).
   * Otherwise, select the new LoRA path.
   */
  const handleLoraToggle = (path) => {
    setValues(prev => ({
      ...prev,
      selectedLoraPath: prev.selectedLoraPath === path ? 'none' : path
    }));
  };

  const command = baseConfig.generateCommand(values);

  return (
    <div className={styles.configContainer}>
      {/* Blocks 1-3: Hardware, Task, Model Size */}
      {Object.entries(baseConfig.options).map(([key, option], index) => {
        const itemsToDisplay = key === 'modelsize'
          ? option.items.filter(item => item.validTasks.includes(values.task))
          : option.items;

        return (
          <div key={key} className={styles.optionCard}>
            <div className={styles.optionTitle}>
              {option.title}
            </div>
            <div className={styles.optionItems}>
              {itemsToDisplay.map(item => {
                const isChecked = values[key] === item.id;
                return (
                  <label
                    key={item.id}
                    className={`${styles.optionLabel} ${isChecked ? styles.checked : ''}`}
                  >
                    <input
                      type="radio"
                      name={option.name}
                      checked={isChecked}
                      onChange={() => handleRadioChange(key, item.id)}
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

      {/* Block 4: Select LoRA Model with Toggle behavior */}
      <div className={styles.optionCard}>
        <div className={styles.optionTitle}>
          Select LoRA Model (Only some of the supported LoRAs are listed here)
        </div>
        <div className={styles.optionItems}>
          {availableLoras.length === 0 && (
            <div style={{ color: '#999', fontSize: '0.9rem', padding: '10px' }}>
              No LoRA models available for this model.
            </div>
          )}

          {availableLoras.map(lora => {
            const isSelected = values.selectedLoraPath === lora.path;
            return (
              <label
                key={lora.id}
                className={`${styles.optionLabel} ${isSelected ? styles.checked : ''}`}
                /*
                   Using onClick on the label to handle the toggle.
                   Preventing default helps avoid double-firing with the radio input.
                */
                onClick={(e) => {
                  e.preventDefault();
                  handleLoraToggle(lora.path);
                }}
              >
                <input
                  type="radio"
                  name="loraModelSelection"
                  checked={isSelected}
                  readOnly // We use the label's onClick instead
                  className={styles.hiddenInput}
                />
                {lora.label}
                <small className={styles.subtitle}>{lora.path}</small>
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.commandCard}>
        <div className={styles.commandTitle}>Generated Command</div>
        <pre className={styles.commandDisplay}>{command}</pre>
      </div>
    </div>
  );
};

export default Wan2_2ConfigGenerator;
