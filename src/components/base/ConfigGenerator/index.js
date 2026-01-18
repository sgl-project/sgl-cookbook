import React, { useState, useMemo } from 'react';
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
      // Only initialize visible or default-visible options
      // But to be safe, we init all — visibility only affects rendering
      if (option.type === 'checkbox') {
        initialState[key] = option.items
          .filter(item => item.default)
          .map(item => item.id);
      } else if (option.type === 'text') {
        initialState[key] = option.default || '';
      } else if (option.type === 'slider') {
        initialState[key] = option.default || option.min || 0;
      } else {
        // For radio buttons, check if getDynamicItems exists
        let items = option.items;
        if (option.getDynamicItems) {
          // For dynamic items, we need to pass the current state (which is being built)
          // Use a default set of values for initial render
          const defaultValues = {};
          Object.entries(config.options).forEach(([k, opt]) => {
            if (opt.items && opt.items.length > 0) {
              const defaultItem = opt.items.find(item => item.default);
              defaultValues[k] = defaultItem ? defaultItem.id : opt.items[0].id;
            }
          });
          items = option.getDynamicItems(defaultValues);
        }
        const defaultItem = items && items.find(item => item.default);
        initialState[key] = defaultItem ? defaultItem.id : (items && items[0] ? items[0].id : '');
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

  const handleSliderChange = (optionName, value) => {
    setValues(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const command = config.generateCommand ? config.generateCommand(values) : '';

  return (
    <div className={styles.configContainer}>
      {Object.entries(config.options).map(([key, option]) => {
        // Skip rendering if condition returns false
        if (option.condition && !option.condition(values)) {
          return null;
        }
        return (
        <div key={key} className={styles.optionCard}>
          <div className={styles.optionTitle}>
            {option.title}
          </div>
          <div className={styles.optionItems}>
            {option.type === 'slider' ? (
              // Slider input
              <div className={styles.sliderContainer}>
                <input
                  type="range"
                  min={0}
                  max={option.values ? option.values.length - 1 : option.max}
                  value={option.values ? option.values.indexOf(values[option.name] || option.default) : values[option.name] || option.default}
                  onChange={(e) => {
                    const index = parseInt(e.target.value);
                    const value = option.values ? option.values[index] : index;
                    handleSliderChange(option.name, value);
                  }}
                  className={styles.slider}
                  list={`${option.name}-markers`}
                />
                <div className={styles.sliderLabels}>
                  {option.values && option.values.map((val, idx) => (
                    <div key={val} className={styles.sliderLabel}>
                      <span className={styles.sliderValue}>
                        {option.labels && option.labels[val] ? option.labels[val] : val}
                      </span>
                      {option.annotations && option.annotations[val] && (
                        <span className={styles.sliderAnnotation}>
                          {option.annotations[val].split('\n').map((line, i) => (
                            <span key={i}>{line}</span>
                          ))}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : option.type === 'text' ? (
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
              // Radio items (with optional dynamic item generation)
              (() => {
                const items = option.getDynamicItems ? option.getDynamicItems(values) : option.items;
                return items.map(item => {
                  const isChecked = values[option.name] === item.id;
                  const isDisabled = item.disabled || false;
                  return (
                    <label
                      key={item.id}
                      className={`${styles.optionLabel} ${isChecked ? styles.checked : ''} ${isDisabled ? styles.disabled : ''}`}
                      title={item.disabledReason || ''}
                    >
                      <input
                        type="radio"
                        name={option.name}
                        value={item.id}
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => !isDisabled && handleRadioChange(option.name, item.id)}
                        className={styles.hiddenInput}
                      />
                      {item.label}
                      {item.subtitle && (
                        <small className={styles.subtitle}>{item.subtitle}</small>
                      )}
                    </label>
                  );
                });
              })()
            )}
          </div>
        </div>
        );
      })}

      <div className={styles.commandCard}>
        <div className={styles.commandTitle}>Run this Command:</div>
        <pre className={styles.commandDisplay}>{command}</pre>
      </div>
    </div>
  );
};

export default ConfigGenerator;
