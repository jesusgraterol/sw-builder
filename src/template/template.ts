import { readTextFile } from 'fs-utils-sync';
import { ITemplateName } from '../shared/index.js';

/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

/**
 * Reads the raw content for a given template name.
 * @param name
 * @returns string
 * @throws
 * - NOT_A_FILE: if the path is not recognized by the OS as a file or if it doesn't exist
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the content of the file is empty or invalid
 */
const __getRawTemplate = (name: ITemplateName): string => readTextFile(`raw/sw.${name}.js`);

/**
 * Inserts the freshly generated cacheName into the raw template.
 * @param rawTemplate
 * @param cacheName
 * @returns string
 */
const __insertCacheName = (rawTemplate: string, cacheName: string): string => (
  rawTemplate.replace('const CACHE_NAME = \'\';', `const CACHE_NAME = '${cacheName}';`)
);

/**
 * Stringifies a given list of asset paths that will be pre-cached.
 * @param precacheAssets
 * @returns string
 */
const __stringifyPrecacheAssets = (precacheAssets: string[]): string => {
  let assets: string = 'const PRECACHE_ASSETS = [\n';
  assets += precacheAssets.reduce(
    (prev, current, index) => `${prev}  '${current}'${index < precacheAssets.length - 1 ? ',\n' : ','}`,
    '',
  );
  assets += '\n];';
  return assets;
};

/**
 * Inserts the pre-cache assets content into the raw template.
 * @param rawTemplate
 * @param precacheAssets
 * @returns string
 */
const __insertPrecacheAssets = (rawTemplate: string, precacheAssets: string[]) => (
  rawTemplate.replace('const PRECACHE_ASSETS = [];', __stringifyPrecacheAssets(precacheAssets))
);





/* ************************************************************************************************
 *                                         IMPLEMENTATION                                         *
 ************************************************************************************************ */


/**
 * Builds the base template ready to be saved.
 * @param cacheName
 * @param precacheAssets
 * @returns string
 * @throws
 * - NOT_A_FILE: if the path is not recognized by the OS as a file or if it doesn't exist
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the content of the file is empty or invalid
 */
const buildBaseTemplate = (
  cacheName: string,
  precacheAssets: string[],
): string => __insertPrecacheAssets(
  __insertCacheName(__getRawTemplate('base'), cacheName),
  precacheAssets,
);





/* ************************************************************************************************
 *                                         MODULE EXPORTS                                         *
 ************************************************************************************************ */
export {
  buildBaseTemplate,
};
