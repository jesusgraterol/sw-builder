import { Exception } from 'error-message-utils';

import type { ITemplateName } from '../shared/types.js';
import { ERRORS } from '../shared/errors.js';
import { IFirebaseOptions } from '../config/index.js';
import { BASE_TEMPLATE } from './templates/base-template.js';

/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

/**
 * Inserts the freshly generated cacheName into the raw template.
 * @param rawTemplate The raw template in which the cacheName will be inserted
 * @param cacheName The name of the cache that will be used in the Service Worker
 * @returns The raw template with the cacheName inserted
 */
const __insertCacheName = (rawTemplate: string, cacheName: string): string =>
  rawTemplate.replace("const CACHE_NAME = '';", `const CACHE_NAME = '${cacheName}';`);

/**
 * Stringifies a constant variable that contains an array.
 * @param constantName The name of the constant variable
 * @param elements The elements of the array
 * @returns The stringified constant variable
 */
export const stringifyArrayConstant = (constantName: string, elements: string[]): string => {
  let variable: string = `const ${constantName} = [\n`;
  variable += elements.reduce(
    (prev, current, index) => `${prev}  '${current}'${index < elements.length - 1 ? ',\n' : ','}`,
    '',
  );
  variable += '\n];';
  return variable;
};

/**
 * Inserts the pre-cache assets content into the raw template.
 * @param rawTemplate The raw template in which the pre-cache assets will be inserted
 * @param precacheAssets The list of assets that will be precached by the Service Worker
 * @returns The raw template with the pre-cache assets inserted
 */
const __insertPrecacheAssets = (rawTemplate: string, precacheAssets: string[]) =>
  rawTemplate.replace(
    'const PRECACHE_ASSETS = [];',
    stringifyArrayConstant('PRECACHE_ASSETS', precacheAssets),
  );

/**
 * Inserts the exclude MIME Types content into the raw template.
 * @param rawTemplate The raw template in which the exclude MIME types will be inserted
 * @param types The list of MIME Types that will be excluded from the cache
 * @returns The raw template with the exclude MIME types inserted
 */
const __insertExcludeMIMETypes = (rawTemplate: string, types: string[]) =>
  rawTemplate.replace(
    'const EXCLUDE_MIME_TYPES = [];',
    stringifyArrayConstant('EXCLUDE_MIME_TYPES', types),
  );

/* ************************************************************************************************
 *                                         IMPLEMENTATION                                         *
 ************************************************************************************************ */

/**
 * Builds the base template ready to be saved.
 * @param cacheName The name of the cache that will be used in the Service Worker
 * @param precacheAssets The list of assets that will be precached by the Service Worker
 * @param excludeMIMETypes The list of MIME Types that will be excluded from the cache
 * @returns The raw template with the base template built
 */
const __buildBaseTemplate = (
  cacheName: string,
  precacheAssets: string[],
  excludeMIMETypes: string[],
): string => {
  // insert the cache name
  let template = __insertCacheName(BASE_TEMPLATE, cacheName);

  // insert the pre-cache assets
  template = __insertPrecacheAssets(template, precacheAssets);

  // insert the MIME types that will be excluded
  template = __insertExcludeMIMETypes(template, excludeMIMETypes);

  // finally, return the template
  return template;
};

/**
 * Builds a Service Worker Template by name.
 * @param template The name of the template to be built
 * @param cacheName The name of the cache that will be used in the Service Worker
 * @param precacheAssets The list of assets that will be precached by the Service Worker
 * @param excludeMIMETypes The list of MIME Types that will be excluded from the cache
 * @param firebaseOptions The Firebase options that will be used to initialize the Firebase App in
 * the Service Worker
 * @returns The raw template with the specified template built
 * @throws
 * - INVALID_TEMPLATE_NAME: if the provided template name is not supported
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the content of the file is empty or invalid
 */
export const buildTemplate = (
  template: ITemplateName,
  cacheName: string,
  precacheAssets: string[],
  excludeMIMETypes: string[],
  firebaseOptions: IFirebaseOptions | undefined,
): string => {
  switch (template) {
    case 'base': {
      return __buildBaseTemplate(cacheName, precacheAssets, excludeMIMETypes);
    }
    default: {
      throw new Exception(
        `The template name '${template}' is not supported.`,
        ERRORS.INVALID_TEMPLATE_NAME,
      );
    }
  }
};
