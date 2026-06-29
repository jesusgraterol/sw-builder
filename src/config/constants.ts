import type { IEnvironment } from '../shared/types.js';

// dotenv file names loaded for each supported build environment
export const ENV_FILE_NAME_BY_ENVIRONMENT = {
  development: '.env',
  staging: '.env.staging',
  production: '.env.production',
} as const satisfies Record<IEnvironment, string>;
