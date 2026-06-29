import { z } from 'zod';
import { TemplateNameSchema } from '../shared/types.js';

// the configuration required to build the service worker
export const BaseConfigSchema = z.strictObject({
  // the dir path in which the build's output is placed
  outDir: z.string().min(1),

  // the name of the template that will be generated
  template: TemplateNameSchema,

  // the list of asset paths that will be traversed and included in the cache
  includeToPrecache: z.array(z.string()),

  // the list of file names that will be ignored
  excludeFilesFromPrecache: z.array(z.string()),

  // the list of MIME Types that won't be cached when the app sends HTTP GET requests
  excludeMIMETypesFromCache: z.array(z.string()),
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

export const FirebaseConfigSchema = z.object({
  options: FirebaseOptionsSchema,
});

// the configuration required to build the service worker for a Firebase project
export const FirebaseFcmConfigSchema = BaseConfigSchema.extend({
  template: z.literal('firebase-fcm'),
  firebaseOptions: FirebaseOptionsSchema,
});

export type IFirebaseFcmConfig = z.infer<typeof FirebaseFcmConfigSchema>;
