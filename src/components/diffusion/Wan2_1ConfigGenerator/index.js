import React, { useState, useMemo } from 'react';
import styles from '../../base/ConfigGenerator/styles.module.css';

const Wan2_1ConfigGenerator = () => {
  const baseConfig = {
    modelFamily: 'Wan2.1',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'mi300x', label: 'MI300X', default: true },
          { id: 'mi325x', label: 'MI325X', default: false },
          { id: 'mi355x', label: 'MI355X', default: false },
        ],
      },
      task: {
        name: 'task',
        title: 'Task Type',
        items: [
          { id: 't2v', label: 'Text-to-Video (T2V)', default: true },
          { id: 'i2v', label: 'Image-to-Video (I2V)', default: false },
        ],
      },
      modelsize: {
        name: 'modelsize',
        title: 'Model Variant',
        items: [
          {
            id: '14b',
            label: '14B',
            subtitle: 'High-quality, 480P/720P',
            default: true,
            validTasks: ['t2v', 'i2v'],
          },
          {
            id: '1_3b',
            label: '1.3B',
            subtitle: 'Lightweight, 480P',
            default: false,
            validTasks: ['t2v'],
          },
        ],
      },
      bestPractice: {
        name: 'bestPractice',
        title: 'Sequence Parallelism',
        items: [
          { id: 'off', label: 'Standard', default: true },
          { id: 'on', label: 'Best Practice (4 GPUs)', default: false },
        ],
      },
    },

    modelConfigs: {
      't2v-14b': {
        repoId: 'Wan-AI/Wan2.1-T2V-14B',
        supportedLoras: [
          { id: 'general', label: 'General Wan2.1 LoRA', path: 'NIVEDAN/wan2.1-lora' },
        ],
      },
      't2v-1_3b': {
        repoId: 'Wan-AI/Wan2.1-T2V-1.3B',
        supportedLoras: [],
      },
      'i2v-14b': {
        repoId: 'Wan-AI/Wan2.1-I2V-14B-720P',
        supportedLoras: [
          { id: 'fight', label: 'Fight Style LoRA', path: 'valiantcat/Wan2.1-Fight-LoRA' },
        ],
      },
    },

    generateCommand: function (values) {
      const { task, modelsize, selectedLoraPath, bestPractice } = values;
      const configKey = `${task}-${modelsize}`;
      const config = this.modelConfigs[configKey];

      if (!config) return `# Error: Invalid configuration`;

      let command = `sglang serve \\
  --model-path ${config.repoId} \\
  --dit-layerwise-offload true`;

      if (bestPractice === 'on') {
        command += ` \\
  --num-gpus 4 \\
  --ulysses-degree 2 \\
  --enable-cfg-parallel
  `;
      }

      if (selectedLoraPath && selectedLoraPath !== 'none') {
        command += ` \\
  --lora-path ${selectedLoraPath}`;
      }

      return command;
    },
  };

  const getInitialState = () => {
    const initialState = {};
    Object.entries(baseConfig.options).forEach(([key, option]) => {
      const defaultItem = option.items.find((item) => item.default);
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
    setValues((prev) => {
      const newValues = { ...prev, [optionName]: itemId };

      // Keep 1.3B only for T2V
      if (optionName === 'task' && itemId === 'i2v' && newValues.modelsize === '1_3b') {
        newValues.modelsize = '14b';
      }

      const configKey = `${newValues.task}-${newValues.modelsize}`;
      const nextSupported = baseConfig.modelConfigs[configKey]?.supportedLoras || [];
      const isValid = nextSupported.some((l) => l.path === prev.selectedLoraPath);
      if (!isValid) {
        newValues.selectedLoraPath = 'none';
      }
      return newValues;
    });
  };

  const handleLoraToggle = (path) => {
    setValues((prev) => ({
      ...prev,
      selectedLoraPath: prev.selectedLoraPath === path ? 'none' : path,
    }));
  };

  const command = baseConfig.generateCommand(values);

  return (
    <div className={styles.configContainer}>
      {Object.entries(baseConfig.options).map(([key, option]) => {
        const itemsToDisplay =
          key === 'modelsize'
            ? option.items.filter((item) => item.validTasks.includes(values.task))
            : option.items;

        return (
          <div key={key} className={styles.optionCard}>
            <div className={styles.optionTitle}>{option.title}</div>
            <div className={styles.optionItems}>
              {itemsToDisplay.map((item) => {
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
                    {item.subtitle && (
                      <small className={styles.subtitle}>{item.subtitle}</small>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

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

          {availableLoras.map((lora) => {
            const isSelected = values.selectedLoraPath === lora.path;
            return (
              <label
                key={lora.id}
                className={`${styles.optionLabel} ${isSelected ? styles.checked : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLoraToggle(lora.path);
                }}
              >
                <input
                  type="radio"
                  name="loraModelSelection"
                  checked={isSelected}
                  readOnly
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

export default Wan2_1ConfigGenerator;

