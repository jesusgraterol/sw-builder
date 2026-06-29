import { config as loadDotEnv } from 'dotenv';
import { Exception, extractMessage } from 'error-message-utils';
import { isStringValid } from 'web-utils-kit';

import type { IEnvironment } from '../shared/types.js';
import { ERRORS } from '../shared/errors.js';
import { FirebaseConfigSchema, type IFirebaseOptions } from './types.js';
import { getEnvFileName } from './utilities.js';

/**
 * Parses a Firebase configuration JSON string from a process environment value.
 * @param firebaseConfigProcessEnvKey The process environment key being parsed.
 * @param firebaseConfig The raw Firebase configuration JSON string.
 * @returns The parsed Firebase options.
 * @throws
 * - FAILED_TO_READ_FIREBASE_CONFIG: if the Firebase configuration could not be parsed.
 */
const parseFirebaseConfig = (
  firebaseConfigProcessEnvKey: string,
  firebaseConfig: string,
): IFirebaseOptions => {
  try {
    return FirebaseConfigSchema.parse(JSON.parse(firebaseConfig)).options;
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
 * Reads the Firebase options from the environment variables.
 * @param environment The current environment.
 * @param firebaseConfigProcessEnvKey The key of the environment variable containing the Firebase configuration.
 * @returns The Firebase options.
 * @throws
 * - INVALID_FIREBASE_CONFIG: if the provided env var key is invalid or not set.
 * - INVALID_ENVIRONMENT: if the provided environment is not recognized.
 * - FAILED_TO_READ_FIREBASE_CONFIG: if the Firebase configuration could not be read from the environment variable.
 */
export const readFirebaseOptions = (
  environment: IEnvironment | undefined,
  firebaseConfigProcessEnvKey: string | undefined,
): IFirebaseOptions => {
  if (
    typeof firebaseConfigProcessEnvKey !== 'string' ||
    !isStringValid(firebaseConfigProcessEnvKey)
  ) {
    throw new Exception(
      `The Firebase configuration process environment key is invalid: ${firebaseConfigProcessEnvKey}`,
      ERRORS.INVALID_FIREBASE_CONFIG,
    );
  }

  loadDotEnv({ path: getEnvFileName(environment), override: false, quiet: true });

  const firebaseConfig = process.env[firebaseConfigProcessEnvKey];
  if (!isStringValid(firebaseConfig)) {
    throw new Exception(
      `The Firebase configuration process environment key is invalid: ${firebaseConfigProcessEnvKey}`,
      ERRORS.INVALID_FIREBASE_CONFIG,
    );
  }

  return parseFirebaseConfig(firebaseConfigProcessEnvKey, firebaseConfig);
};
