import type { IFirebaseOptions } from '../../config/index.js';
import { buildBaseTemplate } from '../base/index.js';
import { FIREBASE_FCM_TEMPLATE } from './firebase-fcm.js';

// Firebase FCM template placeholders replaced while building the final service worker
const FIREBASE_SDK_VERSION_PLACEHOLDER = "const FIREBASE_SDK_VERSION = '';";
const FIREBASE_APP_COMPAT_IMPORT_PLACEHOLDER = "importScripts('firebase-app-compat.js');";
const FIREBASE_MESSAGING_COMPAT_IMPORT_PLACEHOLDER =
  "importScripts('firebase-messaging-compat.js');";
const FIREBASE_INITIALIZE_APP_PLACEHOLDER = 'firebase.initializeApp({});';

/**
 * Builds the Firebase app compat SDK import for an unbundled service worker.
 * @param firebaseSdkVersion The Firebase SDK version to load.
 * @returns The Firebase app compat SDK import.
 */
const __buildFirebaseAppCompatImport = (firebaseSdkVersion: string): string => `importScripts(
  'https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-app-compat.js',
);`;

/**
 * Builds the Firebase messaging compat SDK import for an unbundled service worker.
 * @param firebaseSdkVersion The Firebase SDK version to load.
 * @returns The Firebase messaging compat SDK import.
 */
const __buildFirebaseMessagingCompatImport = (firebaseSdkVersion: string): string => `importScripts(
  'https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/firebase-messaging-compat.js',
);`;

/**
 * Inserts the Firebase SDK version into the raw Firebase FCM template.
 * @param rawTemplate The raw template in which the Firebase SDK version will be inserted.
 * @param firebaseSdkVersion The Firebase SDK version to load.
 * @returns The raw template with the Firebase SDK version inserted.
 */
const __insertFirebaseSdkVersion = (rawTemplate: string, firebaseSdkVersion: string): string =>
  rawTemplate.replace(
    FIREBASE_SDK_VERSION_PLACEHOLDER,
    `const FIREBASE_SDK_VERSION = '${firebaseSdkVersion}';`,
  );

/**
 * Inserts the resolved Firebase compat SDK import URLs into the raw Firebase FCM template.
 * @param rawTemplate The raw template in which the Firebase SDK imports will be inserted.
 * @param firebaseSdkVersion The Firebase SDK version to load.
 * @returns The raw template with the Firebase SDK imports inserted.
 */
const __insertFirebaseSdkImports = (rawTemplate: string, firebaseSdkVersion: string): string =>
  rawTemplate
    .replace(
      FIREBASE_APP_COMPAT_IMPORT_PLACEHOLDER,
      __buildFirebaseAppCompatImport(firebaseSdkVersion),
    )
    .replace(
      FIREBASE_MESSAGING_COMPAT_IMPORT_PLACEHOLDER,
      __buildFirebaseMessagingCompatImport(firebaseSdkVersion),
    );

/**
 * Inserts the Firebase app initialization options into the raw Firebase FCM template.
 * @param rawTemplate The raw template in which the Firebase options will be inserted.
 * @param firebaseOptions The Firebase options used to initialize the Firebase app.
 * @returns The raw template with the Firebase options inserted.
 */
const __insertFirebaseOptions = (rawTemplate: string, firebaseOptions: IFirebaseOptions): string =>
  rawTemplate.replace(
    FIREBASE_INITIALIZE_APP_PLACEHOLDER,
    `firebase.initializeApp(${JSON.stringify(firebaseOptions, null, 2)});`,
  );

/**
 * Builds the Firebase FCM template ready to be saved.
 * @param cacheName The name of the cache that will be used in the Service Worker.
 * @param precacheAssets The list of assets that will be precached by the Service Worker.
 * @param excludeMIMETypes The list of MIME Types that will be excluded from the cache.
 * @param firebaseOptions The Firebase options used to initialize the Firebase app.
 * @param firebaseSdkVersion The Firebase SDK version to load.
 * @returns The raw template with the base and Firebase FCM templates built.
 */
export const buildFirebaseFcmTemplate = (
  cacheName: string,
  precacheAssets: string[],
  excludeMIMETypes: string[],
  firebaseOptions: IFirebaseOptions,
  firebaseSdkVersion: string,
): string => {
  const baseTemplate = buildBaseTemplate(cacheName, precacheAssets, excludeMIMETypes);
  let firebaseFcmTemplate = __insertFirebaseSdkVersion(FIREBASE_FCM_TEMPLATE, firebaseSdkVersion);

  firebaseFcmTemplate = __insertFirebaseSdkImports(firebaseFcmTemplate, firebaseSdkVersion);
  firebaseFcmTemplate = __insertFirebaseOptions(firebaseFcmTemplate, firebaseOptions);

  return `${baseTemplate.trimEnd()}\n\n${firebaseFcmTemplate}`;
};
