import { Exception } from 'error-message-utils';

/**
 * Returns the appropriate environment file name based on the provided environment.
 * @param environment The environment for which to get the file name.
 * @returns The environment file name.
 * @throws
 * - INVALID_ENVIRONMENT: if the provided environment is not recognized.
 */
export const getEnvFileName = (environment: string | undefined): string => {
  switch (environment) {
    case 'production':
      return '.env.production';
    case 'staging':
      return '.env.staging';
    case 'development':
      return '.env';
    default:
      throw new Exception(
        `The firebase-fcm sw template requires a valid environment to be provided. The provided environment is '${environment}'.`,
        'INVALID_ENVIRONMENT',
      );
  }
};
