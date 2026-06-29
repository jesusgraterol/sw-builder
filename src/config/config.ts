import { Exception, extractMessage } from 'error-message-utils';
import { readJSONFile } from 'fs-utils-sync';

import type { IEnvironment } from '../shared/types.js';
import { ERRORS } from '../shared/errors.js';
import { readFirebaseOptions } from './firebase.js';
import { ConfigSchema, type IConfig, type IResolvedConfig } from './types.js';

/**
 * Reads the raw configuration file contents.
 * @param configPath The path to the configuration file.
 * @returns The raw configuration file contents.
 * @throws
 * - FAILED_TO_READ_BASE_CONFIG: if the configuration file could not be read.
 */
const readRawConfigFile = (configPath: string): unknown => {
  try {
    return readJSONFile(configPath);
  } catch (e) {
    throw new Exception(
      `Failed to read the base configuration file '${configPath}': ${extractMessage(e)}`,
      ERRORS.FAILED_TO_READ_BASE_CONFIG,
    );
  }
};

/**
 * Parses the raw configuration file contents.
 * @param configPath The path to the configuration file.
 * @param rawConfig The raw configuration file contents.
 * @returns The parsed configuration file contents.
 * @throws
 * - FAILED_TO_READ_BASE_CONFIG: if the configuration file could not be parsed.
 */
const parseConfigFile = (configPath: string, rawConfig: unknown): IConfig => {
  try {
    return ConfigSchema.parse(rawConfig);
  } catch (e) {
    throw new Exception(
      `Failed to read the base configuration file '${configPath}': ${extractMessage(e)}`,
      ERRORS.FAILED_TO_READ_BASE_CONFIG,
    );
  }
};

/**
 * Resolves template-specific configuration values.
 * @param config The parsed configuration file contents.
 * @param environment The current environment.
 * @returns The configuration after template-specific values have been resolved.
 * @throws
 * - INVALID_FIREBASE_CONFIG: if the configured env var key is invalid or not set.
 * - INVALID_ENVIRONMENT: if the provided environment is not recognized.
 * - FAILED_TO_READ_FIREBASE_CONFIG: if the Firebase configuration could not be read from the environment variable.
 */
const resolveConfig = (config: IConfig, environment: IEnvironment | undefined): IResolvedConfig => {
  if (config.template === 'base') {
    return config;
  }

  const firebaseOptions = readFirebaseOptions(environment, config.firebaseConfigProcessEnvKey);

  return { ...config, firebaseOptions };
};

/**
 * Reads the configuration file and returns the configuration object.
 * @param configPath The path to the configuration file.
 * @param environment The current environment.
 * @returns The configuration object.
 * @throws
 * - FAILED_TO_READ_BASE_CONFIG: if the base configuration file could not be read or parsed.
 * - INVALID_FIREBASE_CONFIG: if the configured env var key is invalid or not set.
 * - INVALID_ENVIRONMENT: if the provided environment is not recognized.
 * - FAILED_TO_READ_FIREBASE_CONFIG: if the Firebase configuration could not be read from the environment variable.
 * - FAILED_TO_BUILD_CONFIG: if the configuration file could not be read or parsed.
 */
export const readConfigFile = (
  configPath: string,
  environment: IEnvironment | undefined,
): IResolvedConfig => {
  try {
    const rawConfig = readRawConfigFile(configPath);
    const config = parseConfigFile(configPath, rawConfig);

    return resolveConfig(config, environment);
  } catch (e) {
    if (e instanceof Exception) {
      throw e;
    }
    throw new Exception(
      `Failed to read/build the configuration for the sw-builder: ${extractMessage(e)}`,
      ERRORS.FAILED_TO_BUILD_CONFIG,
    );
  }
};
