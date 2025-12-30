import React, { useState, useMemo } from 'react';
import styles from '../../../../src/components/ConfigGenerator/styles.module.css';

const FluxConfigGenerator = () => {
  const baseConfig = {
    modelFamily: 'FLUX',

    options: {
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: [
          { id: 'b200', label: 'B200', default: true },
          { id: 'h200', label: 'H200', default: false },
          { id: 'h100', label: 'H100', default: false }
        ]
      },
      version: {
        name: 'version',
        title: 'Model Version',
        items: [
          { id: 'flux1-dev', label: 'FLUX.1-dev', subtitle: '12B', default: true },
          { id: 'flux2-dev', label: 'FLUX.2-dev', subtitle: '32B', default: false }
        ]
      }
    },

    modelConfigs: {
      'flux1-dev': { repoId: 'black-forest-labs/FLUX.1-dev' },
      'flux2-dev': { repoId: 'black-forest-labs/FLUX.2-dev' }
    },

    generateCommand: function(values) {
      const { version } = values;
      const config = this.modelConfigs[version];

      return `sglang serve \\
  --model-path ${config.repoId} \\
  --pin-cpu-memory \\
  --offload_model True \\
  --ulysses-degree=1 \\
  --ring-degree=1`;
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
      {Object.entries(baseConfig.options).map(([key, option], index) => (
        <div key={key} className={styles.optionCard}>
          <div className={styles.optionTitle}>
            <span className={styles.optionNumber}>{index + 1}</span>
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

export default FluxConfigGenerator;
