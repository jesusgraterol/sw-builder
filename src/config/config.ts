import { config as loadDotEnv } from 'dotenv';
import { Exception, extractMessage } from 'error-message-utils';
import { isStringValid } from 'web-utils-kit';
import { readJSONFile } from 'fs-utils-sync';

import { IEnvironment } from '../shared/types.js';
import { ERRORS } from '../shared/errors.js';
import {
  BaseConfigSchema,
  FirebaseConfigSchema,
  IBaseConfig,
  IFirebaseFcmConfig,
  IFirebaseOptions,
} from './types.js';
import { getEnvFileName } from './utilities.js';

/**
 * Reads the Firebase options from the environment variables.
 * @param environment The current environment.
 * @param firebaseConfigProcessEnvKey The key of the environment variable containing the Firebase configuration.
 * @returns The Firebase options.
 * @throws
 * - INVALID_FIREBASE_CONFIG_PROCESS_ENV_KEY: if the provided env var key is invalid or not set.
 * - INVALID_ENVIRONMENT: if the provided environment is not recognized.
 * - FAILED_TO_READ_FIREBASE_CONFIG: if the Firebase configuration could not be read from the environment variable.
 */
const __readFirebaseOptions = (
  environment: IEnvironment | undefined,
  firebaseConfigProcessEnvKey: string | undefined,
): IFirebaseOptions => {
  // validate the environment variable key
  if (
    !isStringValid(firebaseConfigProcessEnvKey) ||
    !isStringValid(process.env[firebaseConfigProcessEnvKey])
  ) {
    throw new Exception(
      `The Firebase configuration process environment key is invalid: ${firebaseConfigProcessEnvKey}`,
      ERRORS.INVALID_FIREBASE_CONFIG_PROCESS_ENV_KEY,
    );
  }

  // load the environment file and read the firebase config
  loadDotEnv({ path: getEnvFileName(environment), override: false, quiet: true });
  try {
    return FirebaseConfigSchema.parse(JSON.parse(process.env[firebaseConfigProcessEnvKey])).options;
  } catch (e) {
    throw new Exception(
      `Failed to read the Firebase configuration from the process environment variable '${firebaseConfigProcessEnvKey}': ${extractMessage(
        e,
      )}`,
      ERRORS.FAILED_TO_READ_FIREBASE_CONFIG,
    );
  }
};

/**
 * Reads the base configuration file and returns the configuration object.
 * @param configPath The path to the base configuration file.
 * @returns The base configuration object.
 * @throws
 * - FAILED_TO_READ_BASE_CONFIG: if the base configuration file could not be read or parsed.
 */
const __readBaseConfigFile = (configPath: string): IBaseConfig => {
  try {
    return BaseConfigSchema.parse(readJSONFile(configPath));
  } catch (e) {
    throw new Exception(
      `Failed to read the base configuration file '${configPath}': ${extractMessage(e)}`,
      ERRORS.FAILED_TO_READ_BASE_CONFIG,
    );
  }
};

/**
 * Reads the configuration file and returns the configuration object.
 * @param configPath The path to the configuration file.
 * @param environment The current environment.
 * @param firebaseConfigProcessEnvKey The key of the environment variable containing the Firebase configuration.
 * @returns The configuration object.
 * @throws
 * - FAILED_TO_READ_BASE_CONFIG: if the base configuration file could not be read or parsed.
 * - INVALID_FIREBASE_CONFIG_PROCESS_ENV_KEY: if the provided env var key is invalid or not set.
 * - INVALID_ENVIRONMENT: if the provided environment is not recognized.
 * - FAILED_TO_READ_FIREBASE_CONFIG: if the Firebase configuration could not be read from the environment variable.
 * - FAILED_TO_BUILD_CONFIG: if the configuration file could not be read or parsed.
 */
export const readConfigFile = (
  configPath: string,
  environment: IEnvironment | undefined,
  firebaseConfigProcessEnvKey: string | undefined,
): IBaseConfig | IFirebaseFcmConfig => {
  try {
    // read the base configuration file
    const config = __readBaseConfigFile(configPath);

    // if the template is 'firebase-fcm', read the Firebase configuration from the process environment variable
    if (config.template === 'firebase-fcm') {
      const firebaseOptions = __readFirebaseOptions(environment, firebaseConfigProcessEnvKey);
      return { ...config, firebaseOptions };
    }

    // otherwise, return the base configuration
    return config;
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
