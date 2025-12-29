import React, { useState, useMemo } from 'react';
import styles from '../../../../src/components/ConfigGenerator/styles.module.css';

const SpecbundleConfigGenerator = () => {
  const baseConfig = {
    options: {
      mode: {
        name: 'mode',
        title: 'Launch Mode',
        renderType: 'radio',
        items: [
          {
            id: 'with-server',
            label: 'With Server',
            subtitle: 'Launch SGLang server & Benchmark concurrently',
            default: true
          },
          {
            id: 'without-server',
            label: 'Without Server',
            subtitle: 'Connect to an existing server (--skip-launch-server)',
            default: false
          }
        ]
      },
      common: {
        name: 'common',
        title: 'Common Configuration',
        renderType: 'inputs',
        items: [
          {
            id: 'modelPath',
            label: 'Model Path',
            type: 'text',
            placeholder: 'e.g., meta-llama/Llama-3.1-8B-Instruct',
            default: 'meta-llama/Llama-3.1-8B-Instruct',
            description: 'Path to the target model.'
          },
          {
            id: 'port',
            label: 'Port',
            type: 'number',
            default: 30000,
            description: 'Port to launch/connect the SGLang server.'
          },
          {
            id: 'configList',
            label: 'Config List',
            type: 'text',
            default: '1,3,1,4',
            description: 'Format: <batch-size>,<num-steps>,<topk>,<num-draft-tokens>'
          },
          {
            id: 'benchmarkList',
            label: 'Benchmark List',
            type: 'textarea',
            default: 'mtbench:5 ceval:5:accountant',
            description: 'Format: <benchmark-name>:<num-prompts>:<subset>. Supported: aime, ceval, financeqa, gpqa, gsm8k, humaneval, livecodebench, math500, mmlu, mmstar, mtbench, simpleqa'
          }
        ]
      },
      server: {
        name: 'server',
        title: 'Server Configuration',
        renderType: 'inputs',
        requiredMode: 'with-server',
        items: [
          {
            id: 'draftModelPath',
            label: 'Draft Model Path',
            type: 'text',
            placeholder: 'Path to draft model',
            default: '',
            description: 'Path to the speculative draft model.'
          },
          {
            id: 'tpSize',
            label: 'TP Size',
            type: 'number',
            default: 1,
            description: 'Number of GPUs for Tensor Parallelism.'
          },
          {
            id: 'memFraction',
            label: 'Memory Fraction Static',
            type: 'number',
            step: '0.1',
            default: 0.9,
            description: 'The memory fraction for the static memory.'
          },
          {
            id: 'attentionBackend',
            label: 'Attention Backend',
            type: 'text',
            default: "",
            description: 'The attention backend used in sglang'
          },
          {
            id: 'trustRemoteCode',
            label: 'Trust Remote Code',
            type: 'checkbox',
            default: true,
            description: 'Whether to trust remote code.'
          }
        ]
      }
    },

    generateCommand: function(values) {
      const { mode, modelPath, port, configList, benchmarkList, draftModelPath, tpSize, memFraction, attentionBackend, trustRemoteCode } = values;

      let cmd = 'python bench_eagle3.py';

      if (modelPath) cmd += ` \\\n  --model-path ${modelPath}`;
      if (port) cmd += ` \\\n  --port ${port}`;
      if (configList) cmd += ` \\\n  --config-list ${configList}`;
      // benchmarkList 换行符替换为空格
      if (benchmarkList) cmd += ` \\\n  --benchmark-list ${benchmarkList.replace(/\n/g, ' ')}`;

      if (mode === 'without-server') {
        cmd += ' \\\n  --skip-launch-server';
      } else {
        if (draftModelPath) cmd += ` \\\n  --speculative-draft-model-path ${draftModelPath}`;
        if (tpSize) cmd += ` \\\n  --tp-size ${tpSize}`;
        if (memFraction) cmd += ` \\\n  --mem-fraction-static ${memFraction}`;
        if (attentionBackend) cmd += ` \\\n  --attention-backend ${attentionBackend}`;
        if (trustRemoteCode) cmd += ` \\\n  --trust-remote-code`;
      }

      return cmd;
    }
  };

  const getInitialState = () => {
    const initialState = {};
    Object.values(baseConfig.options).forEach(option => {
      if (option.renderType === 'radio') {
        const defaultItem = option.items.find(item => item.default);
        initialState[option.name] = defaultItem ? defaultItem.id : option.items[0].id;
      }
      else if (option.renderType === 'inputs') {
        option.items.forEach(item => {
          initialState[item.id] = item.default;
        });
      }
    });
    return initialState;
  };

  const [values, setValues] = useState(getInitialState);

  const displayOptions = useMemo(() => {
    const options = {};
    const currentMode = values.mode;

    Object.entries(baseConfig.options).forEach(([key, option]) => {
      if (option.requiredMode && option.requiredMode !== currentMode) {
        return;
      }
      options[key] = option;
    });

    return options;
  }, [values.mode]);

  const handleRadioChange = (optionName, itemId) => {
    setValues(prev => ({ ...prev, [optionName]: itemId }));
  };

  const handleInputChange = (itemId, value) => {
    setValues(prev => ({ ...prev, [itemId]: value }));
  };

  const handleCheckboxChange = (itemId, checked) => {
    setValues(prev => ({ ...prev, [itemId]: checked }));
  };

  const command = baseConfig.generateCommand(values);

  return (
    <div className={styles.configContainer}>
      <h2 style={{textAlign:'center', marginBottom: '30px'}}>Eagle3 Benchmark Command Generator</h2>
      {Object.entries(displayOptions).map(([key, option], index) => (
        <div key={key} className={styles.optionCard}>
          <div className={styles.optionTitle}>
            <span className={styles.optionNumber}>{index + 1}</span> {option.title}
          </div>

          {/* Render Radio Group */}
          {option.renderType === 'radio' && (
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
                    <div>
                      <div style={{fontWeight:500}}>{item.label}</div>
                      {item.subtitle && (
                        <small className={styles.subtitle}>{item.subtitle}</small>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Render Input Group */}
          {option.renderType === 'inputs' && (
            <div className={styles.inputGroup} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {option.items.map(item => (
                <div key={item.id} style={{display: 'flex', flexDirection: 'column'}}>
                  <label style={{fontWeight: '500', marginBottom: '6px', fontSize: '0.9rem'}}>
                    {item.label}
                  </label>

                  {item.type === 'textarea' ? (
                    <textarea
                      value={values[item.id]}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                      className={styles.textarea}
                    />
                  ) : item.type === 'checkbox' ? (
                    <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                      <input
                        type="checkbox"
                        checked={values[item.id]}
                        onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                        style={{marginRight: '8px', transform:'scale(1.2)'}}
                      />
                      <span>Enabled</span>
                    </label>
                  ) : (
                    <input
                      type={item.type}
                      value={values[item.id]}
                      placeholder={item.placeholder}
                      step={item.step}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                      className={styles.textInput}
                    />
                  )}

                  {item.description && (
                    <small style={{color: '#666', marginTop: '6px', fontSize: '0.8rem'}}>
                      {item.description}
                    </small>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className={styles.commandCard}>
        <div className={styles.commandTitle}>Generated Command</div>
        <pre className={styles.commandDisplay}>{command}</pre>
      </div>
    </div>
  );
};

export default SpecbundleConfigGenerator;
