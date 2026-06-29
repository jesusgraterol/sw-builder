import { Exception } from 'error-message-utils';

import type { ITemplateName } from '../shared/types.js';
import { ERRORS } from '../shared/errors.js';
import { IFirebaseOptions } from '../config/index.js';
import { buildBaseTemplate } from './base/index.js';
import { buildFirebaseFcmTemplate } from './firebase-fcm/index.js';

/**
 * Builds a Service Worker Template by name.
 * @param template The name of the template to be built
 * @param cacheName The name of the cache that will be used in the Service Worker
 * @param precacheAssets The list of assets that will be precached by the Service Worker
 * @param excludeMIMETypes The list of MIME Types that will be excluded from the cache
 * @param firebaseOptions The Firebase options that will be used to initialize the Firebase App in
 * the Service Worker
 * @param firebaseSdkVersion The Firebase SDK version to load
 * @returns The raw template with the specified template built
 * @throws
 * - INVALID_TEMPLATE_NAME: if the provided template name is not supported
 */
export const buildTemplate = (
  template: ITemplateName,
  cacheName: string,
  precacheAssets: string[],
  excludeMIMETypes: string[],
  firebaseOptions: IFirebaseOptions | undefined,
  firebaseSdkVersion: string | undefined,
): string => {
  switch (template) {
    case 'base': {
      return buildBaseTemplate(cacheName, precacheAssets, excludeMIMETypes);
    }
    case 'firebase-fcm': {
      return buildFirebaseFcmTemplate(
        cacheName,
        precacheAssets,
        excludeMIMETypes,
        firebaseOptions as IFirebaseOptions,
        firebaseSdkVersion as string,
      );
    }
    default: {
      throw new Exception(
        `The template name '${template}' is not supported.`,
        ERRORS.INVALID_TEMPLATE_NAME,
      );
    }
  }
};
