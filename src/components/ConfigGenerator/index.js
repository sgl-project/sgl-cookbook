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
const ConfigGenerator = ({ config }) => {
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

  return (
    <div className={styles.configContainer}>
      {Object.entries(config.options).map(([key, option], index) => (
        <div key={key} className={styles.optionCard}>
          <div className={styles.optionTitle}>
            <span className={styles.optionNumber}>{index + 1}</span>
            {option.title}
          </div>
          <div className={styles.optionItems}>
            {option.type === 'text' ? (
              // Text input
              <input
                type="text"
                value={values[option.name] || ''}
                placeholder={option.placeholder || ''}
                onChange={(e) => handleTextChange(option.name, e.target.value)}
                className={styles.textInput}
              />
            ) : option.type === 'checkbox' ? (
              // Checkbox items
              option.items.map(item => {
                const isChecked = (values[option.name] || []).includes(item.id);
                const isDisabled = item.required;
                return (
                  <label
                    key={item.id}
                    className={`${styles.optionLabel} ${isChecked ? styles.checked : ''} ${isDisabled ? styles.disabled : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={(e) => handleCheckboxChange(option.name, item.id, e.target.checked)}
                      className={styles.hiddenInput}
                    />
                    {item.label}
                    {item.subtitle && (
                      <small className={styles.subtitle}>{item.subtitle}</small>
                    )}
                  </label>
                );
              })
            ) : (
              // Radio items
              option.items.map(item => {
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
            )}
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

export default ConfigGenerator;
