// DeepSeek R1 Configuration Generators
// This module exports both basic and advanced (optimal) config generators

export { default as DeepSeekR1BasicConfigGenerator } from './basic';
export { default as DeepSeekR1AdvancedConfigGenerator } from './advanced';

// Default export is the basic generator for backwards compatibility
export { default } from './basic';
