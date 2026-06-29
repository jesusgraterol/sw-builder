import { IFirebaseOptions } from '../../config/index.js';
import { stringifyArrayConstant } from '../utilities.js';
import { BASE_TEMPLATE } from './base.js';

/**
 * Builds the Firebase FCM template ready to be saved.
 * @param cacheName The name of the cache that will be used in the Service Worker
 * @param precacheAssets The list of assets that will be precached by the Service Worker
 * @param excludeMIMETypes The list of MIME Types that will be excluded from the cache
 * @returns The raw template with the Firebase FCM template built
 */
export const buildFirebaseFcmTemplate = (
  firebaseOptions: IFirebaseOptions | undefined,
  firebaseSdkVersion: string | undefined,
): string => {
  return '';
};
