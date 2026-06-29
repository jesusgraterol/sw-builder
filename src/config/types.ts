import { z } from 'zod';

import { TemplateNameSchema } from '../shared/types.js';

// shared configuration fields used by every service worker template
const BaseConfigShape = {
  // the dir path in which the build's output is placed
  outDir: z.string().min(1),

  // the list of asset paths that will be traversed and included in the cache
  includeToPrecache: z.array(z.string()),

  // the list of file names that will be ignored
  excludeFilesFromPrecache: z.array(z.string()),

  // the list of MIME Types that won't be cached when the app sends HTTP GET requests
  excludeMIMETypesFromCache: z.array(z.string()),
};

// the template discriminator read before the exact template config schema is selected
export const ConfigTemplateSchema = z.object({
  template: TemplateNameSchema,
});

export type IConfigTemplate = z.infer<typeof ConfigTemplateSchema>;

// the configuration required to build the base service worker template
export const BaseConfigSchema = z.strictObject({
  ...BaseConfigShape,

  // the name of the template that will be generated
  template: z.literal('base'),
});

export type IBaseConfig = z.infer<typeof BaseConfigSchema>;

// the configuration required to build the service worker for a Firebase project
export const FirebaseOptionsSchema = z.strictObject({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  storageBucket: z.string().min(1),
  messagingSenderId: z.string().min(1),
  appId: z.string().min(1),
});

export type IFirebaseOptions = z.infer<typeof FirebaseOptionsSchema>;

// the Firebase environment value shape used to initialize the Firebase app
export const FirebaseConfigSchema = z.object({
  options: FirebaseOptionsSchema,
});

export type IFirebaseConfig = z.infer<typeof FirebaseConfigSchema>;

// the configuration file shape required to build the Firebase FCM service worker template
export const FirebaseFcmConfigSchema = z.strictObject({
  ...BaseConfigShape,
  template: z.literal('firebase-fcm'),
  firebaseConfigProcessEnvKey: z.string().min(1),
  firebaseSdkVersion: z.string().min(1),
});

export type IFirebaseFcmConfig = z.infer<typeof FirebaseFcmConfigSchema>;

// the supported configuration file shapes accepted by sw-builder
export const ConfigSchema = z.discriminatedUnion('template', [
  BaseConfigSchema,
  FirebaseFcmConfigSchema,
]);

export type IConfig = z.infer<typeof ConfigSchema>;

// the Firebase FCM configuration after the Firebase options have been read from the environment
export const ResolvedFirebaseFcmConfigSchema = FirebaseFcmConfigSchema.extend({
  firebaseOptions: FirebaseOptionsSchema,
});

export type IResolvedFirebaseFcmConfig = z.infer<typeof ResolvedFirebaseFcmConfigSchema>;

// the configuration shapes returned after template-specific values have been resolved
export const ResolvedConfigSchema = z.discriminatedUnion('template', [
  BaseConfigSchema,
  ResolvedFirebaseFcmConfigSchema,
]);

export type IResolvedConfig = z.infer<typeof ResolvedConfigSchema>;
