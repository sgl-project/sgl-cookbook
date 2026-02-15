import React, { useState } from 'react';
import styles from '../../base/ConfigGenerator/styles.module.css';

const MOVAConfigGenerator = () => {
  const baseConfig = {
    modelFamily: 'MOVA',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h200', label: 'H200', default: false },
          { id: 'h100', label: 'H100', default: false },
          { id: 'a100', label: 'A100', default: false }
        ]
      },
      resolution: {
        name: 'resolution',
        title: 'Resolution',
        items: [
          { id: '360p', label: '360p', subtitle: 'Fast inference, lower VRAM', default: true },
          { id: '720p', label: '720p', subtitle: 'Higher resolution', default: false }
        ]
      }
    },

    generateCommand: function(values) {
      const { resolution } = values;
      const modelPath = resolution === '720p'
        ? 'OpenMOSS-Team/MOVA-720p'
        : 'OpenMOSS-Team/MOVA-360p';

      return `export SG_OUTPUT_DIR=/root/output_mova
mkdir -p "$SG_OUTPUT_DIR"

sglang serve \\
  --model-path ${modelPath} \\
  --host 0.0.0.0 \\
  --port 30002 \\
  --adjust-frames false \\
  --num-gpus 8 \\
  --ring-degree 2 \\
  --ulysses-degree 4 \\
  --tp 1 \\
  --enable-torch-compile \\
  --save-output \\
  --output-dir "$SG_OUTPUT_DIR"`;
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

  const handleRadioChange = (optionName, itemId) => {
    setValues(prev => ({ ...prev, [optionName]: itemId }));
  };

  const command = baseConfig.generateCommand(values);

  return (
    <div className={styles.configContainer}>
      {Object.entries(baseConfig.options).map(([key, option]) => (
        <div key={key} className={styles.optionCard}>
          <div className={styles.optionTitle}>
            {option.title}
          </div>
          <div className={styles.optionItems}>
            {option.items.map(item => {
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

      <div className={styles.commandCard}>
        <div className={styles.commandTitle}>Generated Command</div>
        <pre className={styles.commandDisplay}>{command}</pre>
      </div>
    </div>
  );
};

export default MOVAConfigGenerator;
