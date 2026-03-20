import React, { useState, useMemo } from 'react';
import styles from '../../base/ConfigGenerator/styles.module.css';

const MODELSIZE_DEFS = [
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
];

const modelConfigs = {
  't2v-14b': {
    repoId: 'Wan-AI/Wan2.1-T2V-14B-Diffusers',
    supportedLoras: [
      { id: 'general', label: 'General Wan2.1 LoRA', path: 'NIVEDAN/wan2.1-lora' },
    ],
  },
  't2v-1_3b': {
    repoId: 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers',
    supportedLoras: [],
  },
  'i2v-14b': {
    repoId: 'Wan-AI/Wan2.1-I2V-14B-720P-Diffusers',
    supportedLoras: [
      { id: 'fight', label: 'Fight Style LoRA', path: 'valiantcat/Wan2.1-Fight-LoRA' },
    ],
  },
};

function modelSizeItemsForTask(task) {
  return MODELSIZE_DEFS.filter((item) => item.validTasks.includes(task)).map(
    ({ validTasks, ...rest }) => rest
  );
}

const Wan2_1ConfigGenerator = () => {
  const baseConfig = {
    modelFamily: 'Wan2.1',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [{ id: 'mi300x', label: 'MI300X/MI325X/MI355X', default: true }],
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
        items: MODELSIZE_DEFS.map(({ validTasks, ...rest }) => rest),
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

    modelConfigs,

    generateCommand: function (values) {
      const { task, modelsize, selectedLoraPath, bestPractice } = values;
      const configKey = `${task}-${modelsize}`;
      const mc = this.modelConfigs[configKey];

      if (!mc) return `# Error: Invalid configuration`;

      let command = `sglang serve \\
  --model-path ${mc.repoId} \\
  --dit-layerwise-offload true`;

      if (bestPractice === 'on') {
        command += ` \\
  --num-gpus 4 \\
  --ulysses-degree 2 \\
  --enable-cfg-parallel`;
      }

      if (selectedLoraPath) {
        command += ` \\
  --lora-path ${selectedLoraPath}`;
      }

      return command;
    },
  };

  const getInitialState = () => {
    const task = 't2v';
    const sizes = modelSizeItemsForTask(task);
    const modelsize = sizes.find((s) => s.default)?.id || sizes[0].id;
    const configKey = `${task}-${modelsize}`;
    const supported = modelConfigs[configKey]?.supportedLoras || [];
    return {
      hardware: 'mi300x',
      task,
      modelsize,
      bestPractice: 'off',
      selectedLoraPath: supported[0]?.path ?? '',
    };
  };

  const [values, setValues] = useState(getInitialState);

  const handleRadioChange = (optionName, itemId) => {
    setValues((prev) => {
      let next = { ...prev, [optionName]: itemId };

      if (optionName === 'task') {
        const sizes = modelSizeItemsForTask(itemId);
        if (!sizes.some((s) => s.id === next.modelsize)) {
          next.modelsize = sizes.find((s) => s.default)?.id || sizes[0].id;
        }
      }

      if (optionName === 'task' || optionName === 'modelsize') {
        const key = `${next.task}-${next.modelsize}`;
        const supported = modelConfigs[key]?.supportedLoras || [];
        if (supported.length === 0) {
          next.selectedLoraPath = '';
        } else if (
          next.selectedLoraPath &&
          !supported.some((l) => l.path === next.selectedLoraPath)
        ) {
          next.selectedLoraPath = supported[0].path;
        }
      }

      return next;
    });
  };

  const handleLoraToggle = (path) => {
    setValues((prev) => ({
      ...prev,
      selectedLoraPath: prev.selectedLoraPath === path ? '' : path,
    }));
  };

  const command = baseConfig.generateCommand(values);

  const modelSizeItems = modelSizeItemsForTask(values.task);
  const loraConfigKey = `${values.task}-${values.modelsize}`;
  const availableLoras = modelConfigs[loraConfigKey]?.supportedLoras || [];

  return (
    <div className={styles.configContainer}>
      {Object.entries(baseConfig.options).map(([key, option]) => (
        <div key={key} className={styles.optionCard}>
          <div className={styles.optionTitle}>{option.title}</div>
          <div className={styles.optionItems}>
            {key === 'modelsize'
              ? modelSizeItems.map((item) => {
                  const isChecked = values[option.name] === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`${styles.optionLabel} ${isChecked ? styles.checked : ''}`}
                    >
                      <input
                        type="radio"
                        name={option.name}
                        value={item.id}
                        checked={isChecked}
                        onChange={() => handleRadioChange(option.name, item.id)}
                        className={styles.hiddenInput}
                      />
                      {item.label}
                      {item.subtitle && (
                        <small className={styles.subtitle}>{item.subtitle}</small>
                      )}
                    </label>
                  );
                })
              : option.items.map((item) => {
                  const isChecked = values[option.name] === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`${styles.optionLabel} ${isChecked ? styles.checked : ''}`}
                    >
                      <input
                        type="radio"
                        name={option.name}
                        value={item.id}
                        checked={isChecked}
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

      {availableLoras.length > 0 && (
        <div className={styles.optionCard}>
          <div className={styles.optionTitle}>
            Select LoRA Model (Only some of the supported LoRAs are listed here)
          </div>
          <div className={styles.optionItems}>
            {availableLoras.map((lora) => {
              const isChecked = values.selectedLoraPath === lora.path;
              return (
                <label
                  key={lora.id}
                  className={`${styles.optionLabel} ${isChecked ? styles.checked : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLoraToggle(lora.path);
                  }}
                >
                  <input
                    type="radio"
                    name="selectedLoraPath"
                    value={lora.path}
                    checked={isChecked}
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
      )}

      <div className={styles.commandCard}>
        <div className={styles.commandTitle}>Generated Command</div>
        <pre className={styles.commandDisplay}>{command}</pre>
      </div>
    </div>
  );
};

export default Wan2_1ConfigGenerator;
