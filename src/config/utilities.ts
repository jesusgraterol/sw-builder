import { Exception } from 'error-message-utils';

import type { IEnvironment } from '../shared/types.js';
import { ERRORS } from '../shared/errors.js';
import { ENV_FILE_NAME_BY_ENVIRONMENT } from './constants.js';

/**
 * Checks whether a raw environment value is supported by the config loader.
 * @param environment The raw environment value to check.
 * @returns Whether the environment is supported.
 */
const isEnvironment = (environment: string | undefined): environment is IEnvironment =>
  typeof environment === 'string' && environment in ENV_FILE_NAME_BY_ENVIRONMENT;

/**
 * Returns the appropriate environment file name based on the provided environment.
 * @param environment The environment for which to get the file name.
 * @returns The environment file name.
 * @throws
 * - INVALID_ENVIRONMENT: if the provided environment is not recognized.
 */
export const getEnvFileName = (environment: string | undefined): string => {
  if (!isEnvironment(environment)) {
    throw new Exception(
      `The firebase-fcm sw template requires a valid environment to be provided. The provided environment is '${environment}'.`,
      ERRORS.INVALID_ENVIRONMENT,
    );
  }

  return ENV_FILE_NAME_BY_ENVIRONMENT[environment];
};
