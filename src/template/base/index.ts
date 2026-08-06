import { stringifyArrayConstant } from '../utilities.js';
import { BASE_TEMPLATE } from './base.js';

/**
 * Inserts the application-owned cache namespace into the raw template.
 * @param rawTemplate The raw template in which the cache name prefix will be inserted.
 * @param cacheNamePrefix The application-owned cache namespace.
 * @returns The raw template with the cache name prefix inserted.
 */
const __insertCacheNamePrefix = (rawTemplate: string, cacheNamePrefix: string): string =>
  rawTemplate.replace(
    "const CACHE_NAME_PREFIX = '';",
    `const CACHE_NAME_PREFIX = '${cacheNamePrefix}';`,
  );

/**
 * Inserts the freshly generated cacheName into the raw template.
 * @param rawTemplate The raw template in which the cacheName will be inserted
 * @param cacheName The name of the cache that will be used in the Service Worker
 * @returns The raw template with the cacheName inserted
 */
const __insertCacheName = (rawTemplate: string, cacheName: string): string =>
  rawTemplate.replace("const CACHE_NAME = '';", `const CACHE_NAME = '${cacheName}';`);

/**
 * Inserts the pre-cache assets content into the raw template.
 * @param rawTemplate The raw template in which the pre-cache assets will be inserted
 * @param precacheAssets The list of assets that will be precached by the Service Worker
 * @returns The raw template with the pre-cache assets inserted
 */
const __insertPrecacheAssets = (rawTemplate: string, precacheAssets: string[]) =>
  precacheAssets.length > 0
    ? rawTemplate.replace(
        'const PRECACHE_ASSETS = [];',
        stringifyArrayConstant('PRECACHE_ASSETS', precacheAssets),
      )
    : rawTemplate;

/**
 * Inserts the exclude MIME Types content into the raw template.
 * @param rawTemplate The raw template in which the exclude MIME types will be inserted
 * @param types The list of MIME Types that will be excluded from the cache
 * @returns The raw template with the exclude MIME types inserted
 */
const __insertExcludeMIMETypes = (rawTemplate: string, types: string[]) =>
  types.length > 0
    ? rawTemplate.replace(
        'const EXCLUDE_MIME_TYPES = [];',
        stringifyArrayConstant('EXCLUDE_MIME_TYPES', types),
      )
    : rawTemplate;

/**
 * Builds the base template ready to be saved.
 * @param cacheNamePrefix The application-owned cache namespace.
 * @param cacheName The name of the cache that will be used in the Service Worker
 * @param precacheAssets The list of assets that will be precached by the Service Worker
 * @param excludeMIMETypes The list of MIME Types that will be excluded from the cache
 * @returns The raw template with the base template built
 */
export const buildBaseTemplate = (
  cacheNamePrefix: string,
  cacheName: string,
  precacheAssets: string[],
  excludeMIMETypes: string[],
): string => {
  // insert the cache namespace and version-specific name
  let template = __insertCacheNamePrefix(BASE_TEMPLATE, cacheNamePrefix);
  template = __insertCacheName(template, cacheName);

  // insert the pre-cache assets
  template = __insertPrecacheAssets(template, precacheAssets);

  // insert the MIME types that will be excluded
  template = __insertExcludeMIMETypes(template, excludeMIMETypes);

  // finally, return the template
  return template;
};
