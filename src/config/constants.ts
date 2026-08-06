import type { IEnvironment } from '../shared/types.js';

// safe cache namespaces use lowercase alphanumeric tokens separated by single hyphens
export const CACHE_NAME_PREFIX_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// dotenv file names loaded for each supported build environment
export const ENV_FILE_NAME_BY_ENVIRONMENT = {
  development: '.env',
  staging: '.env.staging',
  production: '.env.production',
} as const satisfies Record<IEnvironment, string>;
