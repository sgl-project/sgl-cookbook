import React from 'react';
import ConfigGenerator from '../../base/ConfigGenerator';
import { findConfig, generateCommandFromConfig, validateSelection, shouldShowElement, lookupData, getAvailableGpuCounts } from './configLoader';

const DeepSeekR1AdvancedConfigGenerator = () => {
  // Build UI options dynamically from lookup.yaml
  if (!lookupData || !lookupData.ui_options) {
    console.error('DeepSeekR1AdvancedConfigGenerator: Failed to load configuration data. lookupData:', lookupData);
    return <div>Error: Configuration data not loaded. Please refresh the page.</div>;
  }

  const uiOptions = lookupData.ui_options;

  const config = {
    modelFamily: 'deepseek-ai',

    options: {
      // Hardware options (only B200 and H200)
      hardware: {
        name: 'hardware',
        title: 'Hardware Platform',
        items: uiOptions.hardware
          .filter(opt => opt.id === 'b200' || opt.id === 'h200')
          .map(opt => ({
            id: opt.id,
            label: opt.label,
            default: opt.id === 'b200'
          }))
      },

      // Quantization options (show all, disable unavailable)
      quantization: {
        name: 'quantization',
        title: 'Quantization',
        items: [],
        getDynamicItems: (values) => {
          return uiOptions.quantization.map(opt => {
            // H200 only supports FP8, disable FP4
            if (values.hardware === 'h200' && opt.id === 'fp4') {
              return {
                id: opt.id,
                label: opt.label,
                default: false,
                disabled: true,
                disabledReason: 'FP4 not supported on H200'
              };
            }
            return {
              id: opt.id,
              label: opt.label,
              default: values.hardware === 'h200' ? opt.id === 'fp8' : opt.default
            };
          });
        }
      },

      // GPU Count options (show all, disable unavailable)
      gpuCount: {
        name: 'gpuCount',
        title: 'GPU Count',
        items: [],
        getDynamicItems: (values) => {
          const availableGpuCounts = getAvailableGpuCounts(values.hardware, values.quantization);
          // Derive all possible GPU counts from ui_options
          const allGpuCounts = uiOptions.gpu_count.map(opt => typeof opt.id === 'number' ? opt.id : parseInt(opt.id, 10));

          return allGpuCounts.map((count, idx) => {
            const isAvailable = availableGpuCounts.includes(count);
            const hw = values.hardware ? values.hardware.toUpperCase() : 'selected hardware';
            const quant = values.quantization ? values.quantization.toUpperCase() : 'selected quantization';
            return {
              id: String(count),
              label: `${count} GPUs`,
              default: isAvailable && count === Math.max(...availableGpuCounts),
              disabled: !isAvailable,
              disabledReason: !isAvailable ? `${count} GPUs not available for ${hw} ${quant}` : ''
            };
          });
        }
      },

      // Scenario options (always visible since we only have B200/H200)
      scenario: {
        name: 'scenario',
        title: 'Scenario',
        items: uiOptions.scenario.map(opt => ({
          id: opt.id,
          label: opt.label,
          subtitle: opt.subtitle,
          default: opt.default
        }))
      }
    },

    generateCommand: function (values) {
      const { hardware, quantization, gpuCount = '8', scenario } = values;

      // Check validation rules
      const validationError = validateSelection(hardware, quantization);
      if (validationError) {
        return `# Error: ${validationError}`;
      }

      // Find config based on selections
      const configParams = findConfig(hardware, quantization, gpuCount, scenario);

      if (!configParams) {
        return `# Error: No configuration found for:\n# Hardware: ${hardware}\n# Quantization: ${quantization}\n# GPU Count: ${gpuCount}\n# Scenario: ${scenario}\n# This combination is not yet supported.`;
      }

      // Generate command without extra parser flags
      return generateCommandFromConfig(configParams, {});
    }
  };

  return <ConfigGenerator config={config} />;
};

export default DeepSeekR1AdvancedConfigGenerator;
