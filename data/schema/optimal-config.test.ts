/**
 * TypeScript tests to validate optimal config JSON files against the TypeScript interfaces.
 *
 * Run with: npx ts-node optimal-config.test.ts
 */

import * as fs from "fs";
import * as path from "path";

import {
  OptimalConfigFile,
  UIOptions,
  UIOption,
  OptimalConfig,
  ServerParameters,
} from "./optimal-config-types";

const VERSION = process.env.SGLANG_VERSION || "v0.5.6";
const CONFIGS_DIR = path.join(__dirname, "..", "optimal-configs", "generated", VERSION);

function loadJsonAsOptimalConfig(filePath: string): OptimalConfigFile {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as OptimalConfigFile;
}

function getJsonFiles(): string[] {
  if (!fs.existsSync(CONFIGS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(CONFIGS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(CONFIGS_DIR, f));
}

function isValidUIOption(opt: unknown): opt is UIOption {
  if (typeof opt !== "object" || opt === null) return false;
  const o = opt as Record<string, unknown>;

  if (o.id === undefined || o.id === null) return false;
  if (typeof o.label !== "string" || !o.label) return false;
  if (typeof o.default !== "boolean") return false;

  return true;
}

function isValidUIOptions(opts: unknown): opts is UIOptions {
  if (typeof opts !== "object" || opts === null) return false;
  const o = opts as Record<string, unknown>;

  const requiredKeys = ["hardware", "quantization", "scenario", "gpu_count"];
  for (const key of requiredKeys) {
    if (!Array.isArray(o[key])) return false;
    const arr = o[key] as unknown[];
    for (const item of arr) {
      if (!isValidUIOption(item)) return false;
    }
  }

  return true;
}

function isValidServerParameters(params: unknown): params is ServerParameters {
  if (typeof params !== "object" || params === null) return false;
  const p = params as Record<string, unknown>;

  if (typeof p.model_path !== "string" || !p.model_path) return false;
  if (typeof p.tensor_parallel_size !== "number" || p.tensor_parallel_size < 1) return false;

  return true;
}

function isValidOptimalConfig(cfg: unknown): cfg is OptimalConfig {
  if (typeof cfg !== "object" || cfg === null) return false;
  const c = cfg as Record<string, unknown>;

  if (typeof c.hardware !== "string" || !c.hardware) return false;
  if (typeof c.quantization !== "string" || !c.quantization) return false;
  if (typeof c.gpu_count !== "number" || c.gpu_count < 1) return false;
  if (c.scenario !== "low-latency" && c.scenario !== "high-throughput") return false;
  if (!isValidServerParameters(c.parameters)) return false;

  return true;
}

function validateOptimalConfigFile(config: OptimalConfigFile, fileName: string): string[] {
  const errors: string[] = [];

  if (typeof config.model !== "string" || !config.model) {
    errors.push(`${fileName}: 'model' must be a non-empty string`);
  }

  if (typeof config.version !== "string" || !config.version) {
    errors.push(`${fileName}: 'version' must be a non-empty string`);
  }

  if (!config.ui_options) {
    errors.push(`${fileName}: 'ui_options' is required`);
  } else if (!isValidUIOptions(config.ui_options)) {
    errors.push(`${fileName}: 'ui_options' must have valid hardware, quantization, scenario, and gpu_count arrays`);
  }

  if (!Array.isArray(config.configs)) {
    errors.push(`${fileName}: 'configs' must be an array`);
  } else {
    for (let i = 0; i < config.configs.length; i++) {
      const cfg = config.configs[i];
      const prefix = `${fileName} configs[${i}]`;

      if (!isValidOptimalConfig(cfg)) {
        errors.push(`${prefix}: invalid config structure`);
        continue;
      }

      const params = cfg.parameters;
      if (!params.model_path) {
        errors.push(`${prefix}: 'parameters.model_path' is required`);
      }
      if (typeof params.tensor_parallel_size !== "number" || params.tensor_parallel_size < 1) {
        errors.push(`${prefix}: 'parameters.tensor_parallel_size' must be >= 1`);
      }
    }
  }

  if (config.validation !== undefined && config.validation !== null) {
    if (!Array.isArray(config.validation)) {
      errors.push(`${fileName}: 'validation' must be an array if present`);
    } else {
      for (let i = 0; i < config.validation.length; i++) {
        const rule = config.validation[i];
        const prefix = `${fileName} validation[${i}]`;

        if (!rule.hardware) {
          errors.push(`${prefix}: 'hardware' is required`);
        }
        if (!rule.quantization) {
          errors.push(`${prefix}: 'quantization' is required`);
        }
        if (typeof rule.error !== "string" || !rule.error) {
          errors.push(`${prefix}: 'error' must be a non-empty string`);
        }
      }
    }
  }

  return errors;
}

function runTests(): void {
  console.log("Validating optimal config JSON files against TypeScript types...\n");

  const jsonFiles = getJsonFiles();

  if (jsonFiles.length === 0) {
    console.log("No JSON files found in", CONFIGS_DIR);
    process.exit(1);
  }

  let totalErrors = 0;

  for (const filePath of jsonFiles) {
    const fileName = path.basename(filePath);
    console.log(`Validating ${fileName}...`);

    try {
      const config = loadJsonAsOptimalConfig(filePath);
      const errors = validateOptimalConfigFile(config, fileName);

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

  console.log(`\n${jsonFiles.length} file(s) validated.`);

  if (totalErrors > 0) {
    console.log(`${totalErrors} error(s) found.`);
    process.exit(1);
  } else {
    console.log("All files are valid!");
    process.exit(0);
  }
}

runTests();
