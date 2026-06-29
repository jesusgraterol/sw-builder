// types
export type {
  IBaseConfig,
  IConfig,
  IConfigTemplate,
  IFirebaseConfig,
  IFirebaseOptions,
  IFirebaseFcmConfig,
  IResolvedConfig,
  IResolvedFirebaseFcmConfig,
} from './types.js';

// schemas
export {
  BaseConfigSchema,
  ConfigSchema,
  ConfigTemplateSchema,
  FirebaseOptionsSchema,
  FirebaseConfigSchema,
  FirebaseFcmConfigSchema,
  ResolvedConfigSchema,
  ResolvedFirebaseFcmConfigSchema,
} from './types.js';

// fns
export { readConfigFile } from './config.js';
