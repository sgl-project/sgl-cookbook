import React, { useState } from 'react';
import styles from './styles.module.css';

/**
 * Generic Configuration Generator Component
 * 
 * @param {Object} config - Configuration object with the following structure:
 *   - modelFamily: string (optional)
 *   - options: object with option groups
 *   - generateCommand: function(values) => string
 */
const ConfigGenerator = ({ config, variant = 'minimal' }) => {
  if (!config || !config.options) {
    return <div>Error: Invalid configuration provided</div>;
  }

  // Initialize state with default values
  const getInitialState = () => {
    const initialState = {};
    Object.entries(config.options).forEach(([key, option]) => {
      if (option.type === 'checkbox') {
        initialState[key] = option.items
          .filter(item => item.default)
          .map(item => item.id);
      } else if (option.type === 'text') {
        initialState[key] = option.default || '';
      } else {
        const defaultItem = option.items.find(item => item.default);
        initialState[key] = defaultItem ? defaultItem.id : option.items[0].id;
      }
    });
    return initialState;
  };

  const [values, setValues] = useState(getInitialState());

  const handleRadioChange = (optionName, value) => {
    setValues(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleCheckboxChange = (optionName, itemId, isChecked) => {
    setValues(prev => {
      const currentValues = prev[optionName] || [];
      if (isChecked) {
        return {
          ...prev,
          [optionName]: [...currentValues, itemId]
        };
      } else {
        return {
          ...prev,
          [optionName]: currentValues.filter(id => id !== itemId)
        };
      }
    });
  };

  const handleTextChange = (optionName, value) => {
    setValues(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const command = config.generateCommand ? config.generateCommand(values) : '';

  const isMinimal = variant === 'minimal';

  return (
    <div className={isMinimal ? styles.configContainerMinimal : styles.configContainer}>
      <div className={styles.optionsTable}>
        {Object.entries(config.options).map(([key, option]) => (
          <div
            key={key}
            className={isMinimal ? styles.optionRowMinimal : styles.optionRow}
          >
            <div className={isMinimal ? styles.rowLabelMinimal : styles.rowLabel}>
              {option.title}
            </div>
            <div className={styles.rowContent}>
              {option.type === 'text' ? (
                <input
                  type="text"
                  value={values[option.name] || ''}
                  placeholder={option.placeholder || ''}
                  onChange={(e) => handleTextChange(option.name, e.target.value)}
                  className={styles.textInput}
                />
              ) : (
                <div className={styles.choiceGroup}>
                  {option.items.map(item => {
                    const isChecked = option.type === 'checkbox'
                      ? (values[option.name] || []).includes(item.id)
                      : values[option.name] === item.id;
                    const isDisabled = item.required;
                    const inputType = option.type === 'checkbox' ? 'checkbox' : 'radio';

                    return (
                      <label
                        key={item.id}
                        className={`${styles.choiceButton} ${isChecked ? styles.active : ''} ${isDisabled ? styles.disabled : ''}`}
                      >
                        <input
                          type={inputType}
                          name={option.name}
                          value={item.id}
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={(e) => {
                            if (inputType === 'radio') {
                              handleRadioChange(option.name, item.id);
                            } else {
                              handleCheckboxChange(option.name, item.id, e.target.checked);
                            }
                          }}
                          className={styles.hiddenInput}
                        />
                        <span className={styles.choiceLabel}>{item.label}</span>
                        {item.subtitle && (
                          <span className={styles.choiceSubtitle}>{item.subtitle}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={isMinimal ? styles.commandRowMinimal : styles.commandRow}>
        <div className={isMinimal ? styles.rowLabelMinimal : styles.rowLabel}>
          Run this Command
        </div>
        <div className={styles.commandContent}>
          {isMinimal && (
            <div className={styles.commandHint}>Selections above update this command</div>
          )}
          <pre className={styles.commandDisplay}>{command}</pre>
        </div>
      </div>
    </div>
  );
};

export default ConfigGenerator;

