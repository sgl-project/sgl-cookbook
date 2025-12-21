/**
 * TypeScript tests to validate YAML files against the TypeScript interfaces.
 *
 * This ensures the YAML data structure matches what the TypeScript types expect.
 *
 * Run with: npx ts-node types.test.ts
 * Or with test runner: npx jest types.test.ts (requires jest + ts-jest setup)
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

import {
  CompanyConfig,
  ModelFamily,
  Model,
  ModelAttributes,
  HardwareConfig,
  VersionConfig,
  NamedConfiguration,
  ConfigAttributes,
  EngineConfig,
} from "./types";

// Path to model YAML files (generated from src/)
const MODELS_DIR = path.join(__dirname, "..", "models", "generated");

/**
 * Load and parse a YAML file as CompanyConfig
 */
function loadYamlAsCompanyConfig(filePath: string): CompanyConfig {
  const content = fs.readFileSync(filePath, "utf-8");
  return yaml.load(content) as CompanyConfig;
}

/**
 * Get all YAML files in the models directory
 */
function getYamlFiles(): string[] {
  if (!fs.existsSync(MODELS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MODELS_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .map((f) => path.join(MODELS_DIR, f));
}

/**
 * Type guard to check if a value matches ConfigAttributes
 */
function isValidConfigAttributes(attrs: unknown): attrs is ConfigAttributes {
  if (typeof attrs !== "object" || attrs === null) return false;
  const a = attrs as Record<string, unknown>;

  // Check nodes
  if (a.nodes !== "single" && a.nodes !== "multi") return false;

  // Check optimization
  if (
    a.optimization !== "balanced" &&
    a.optimization !== "low-latency" &&
    a.optimization !== "high-throughput"
  )
    return false;

  // Check quantization (required)
  if (
    a.quantization !== "fp8" &&
    a.quantization !== "int4" &&
    a.quantization !== "bf16" &&
    a.quantization !== "fp4" &&
    a.quantization !== "mxfp4"
  )
    return false;

  return true;
}

/**
 * Type guard to check if a value matches EngineConfig
 */
function isValidEngineConfig(engine: unknown): engine is EngineConfig {
  if (typeof engine !== "object" || engine === null) return false;
  const e = engine as Record<string, unknown>;

  // tp is required and must be a positive integer
  if (typeof e.tp !== "number" || e.tp < 1) return false;

  // dp is optional but must be positive if set
  if (e.dp !== undefined && e.dp !== null) {
    if (typeof e.dp !== "number" || e.dp < 1) return false;
  }

  // ep is optional but must be positive if set
  if (e.ep !== undefined && e.ep !== null) {
    if (typeof e.ep !== "number" || e.ep < 1) return false;
  }

  return true;
}

/**
 * Validate a CompanyConfig structure
 */
function validateCompanyConfig(config: CompanyConfig, fileName: string): string[] {
  const errors: string[] = [];

  // Check company
  if (typeof config.company !== "string" || !config.company) {
    errors.push(`${fileName}: 'company' must be a non-empty string`);
  }

  // Check families
  if (!Array.isArray(config.families)) {
    errors.push(`${fileName}: 'families' must be an array`);
    return errors;
  }

  for (let fi = 0; fi < config.families.length; fi++) {
    const family = config.families[fi];
    const familyPrefix = `${fileName} families[${fi}]`;

    // Check family name
    if (typeof family.name !== "string" || !family.name) {
      errors.push(`${familyPrefix}: 'name' must be a non-empty string`);
    }

    // Check models
    if (!Array.isArray(family.models)) {
      errors.push(`${familyPrefix}: 'models' must be an array`);
      continue;
    }

    for (let mi = 0; mi < family.models.length; mi++) {
      const model = family.models[mi];
      const modelPrefix = `${familyPrefix}.models[${mi}]`;

      // Check model fields
      if (typeof model.name !== "string" || !model.name) {
        errors.push(`${modelPrefix}: 'name' must be a non-empty string`);
      }
      if (typeof model.model_path !== "string" || !model.model_path) {
        errors.push(`${modelPrefix}: 'model_path' must be a non-empty string`);
      }

      // Check attributes
      if (!model.attributes) {
        errors.push(`${modelPrefix}: 'attributes' must be an object`);
      } else {
        const tc = model.attributes.thinking_capability;
        if (tc !== "non_thinking" && tc !== "thinking" && tc !== "hybrid") {
          errors.push(`${modelPrefix}: 'attributes.thinking_capability' must be one of: non_thinking, thinking, hybrid`);
        }
      }

      // Check hardware
      if (typeof model.hardware !== "object" || model.hardware === null) {
        errors.push(`${modelPrefix}: 'hardware' must be an object`);
        continue;
      }

      for (const [hwName, hwConfig] of Object.entries(model.hardware)) {
        const hwPrefix = `${modelPrefix}.hardware.${hwName}`;

        if (typeof hwConfig.versions !== "object" || hwConfig.versions === null) {
          errors.push(`${hwPrefix}: 'versions' must be an object`);
          continue;
        }

        for (const [verName, verConfig] of Object.entries(hwConfig.versions)) {
          const verPrefix = `${hwPrefix}.versions.${verName}`;

          if (!Array.isArray(verConfig.configurations)) {
            errors.push(`${verPrefix}: 'configurations' must be an array`);
            continue;
          }

          for (let ci = 0; ci < verConfig.configurations.length; ci++) {
            const cfg = verConfig.configurations[ci];
            const cfgPrefix = `${verPrefix}.configurations[${ci}]`;

            // Check name
            if (typeof cfg.name !== "string" || !cfg.name) {
              errors.push(`${cfgPrefix}: 'name' must be a non-empty string`);
            }

            // Check attributes with enum validation
            if (!isValidConfigAttributes(cfg.attributes)) {
              errors.push(
                `${cfgPrefix}: 'attributes' must have valid nodes, optimization, and quantization`
              );
            }

            // Check engine/prefill/decode (all use EngineConfig)
            if (cfg.engine !== null && cfg.engine !== undefined) {
              if (!isValidEngineConfig(cfg.engine)) {
                errors.push(`${cfgPrefix}: 'engine' must be a valid EngineConfig with tp >= 1`);
              }
            }
            if (cfg.prefill !== null && cfg.prefill !== undefined) {
              if (!isValidEngineConfig(cfg.prefill)) {
                errors.push(`${cfgPrefix}: 'prefill' must be a valid EngineConfig with tp >= 1`);
              }
            }
            if (cfg.decode !== null && cfg.decode !== undefined) {
              if (!isValidEngineConfig(cfg.decode)) {
                errors.push(`${cfgPrefix}: 'decode' must be a valid EngineConfig with tp >= 1`);
              }
            }
          }
        }
      }
    }
  }

  return errors;
}

// ============ Main Test Execution ============

function runTests(): void {
  console.log("Validating YAML files against TypeScript types...\n");

  const yamlFiles = getYamlFiles();

  if (yamlFiles.length === 0) {
    console.log("No YAML files found in", MODELS_DIR);
    process.exit(1);
  }

  let totalErrors = 0;

  for (const filePath of yamlFiles) {
    const fileName = path.basename(filePath);
    console.log(`Validating ${fileName}...`);

    try {
      const config = loadYamlAsCompanyConfig(filePath);
      const errors = validateCompanyConfig(config, fileName);

      if (errors.length > 0) {
        console.log(`  FAILED with ${errors.length} error(s):`);
        errors.forEach((e) => console.log(`    - ${e}`));
        totalErrors += errors.length;
      } else {
        console.log(`  OK`);
      }
    } catch (e) {
      console.log(`  FAILED to parse: ${e}`);
      totalErrors++;
    }
  }

  console.log(`\n${yamlFiles.length} file(s) validated.`);

  if (totalErrors > 0) {
    console.log(`${totalErrors} error(s) found.`);
    process.exit(1);
  } else {
    console.log("All files are valid!");
    process.exit(0);
  }
}

// Run if executed directly
runTests();
