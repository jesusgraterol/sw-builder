import { encodeError } from 'error-message-utils';
import { ERRORS, ITemplateName } from '../shared/index.js';
import { BASE_TEMPLATE } from './templates/index.js';

/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

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
 * Stringifies a constant variable that contains an array.
 * @param constantName
 * @param elements
 * @returns string
 */
const stringifyArrayConstant = (constantName: string, elements: string[]): string => {
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
 * @param rawTemplate
 * @param precacheAssets
 * @returns string
 */
const __insertPrecacheAssets = (rawTemplate: string, precacheAssets: string[]) => (
  rawTemplate.replace(
    'const PRECACHE_ASSETS = [];',
    stringifyArrayConstant('PRECACHE_ASSETS', precacheAssets),
  )
);

/**
 * Inserts the exclude MIME Types content into the raw template.
 * @param rawTemplate
 * @param types
 * @returns string
 */
const __insertExcludeMIMETypes = (rawTemplate: string, types: string[]) => (
  rawTemplate.replace(
    'const EXCLUDE_MIME_TYPES = [];',
    stringifyArrayConstant('EXCLUDE_MIME_TYPES', types),
  )
);





/* ************************************************************************************************
 *                                         IMPLEMENTATION                                         *
 ************************************************************************************************ */

/**
 * Builds the base template ready to be saved.
 * @param cacheName
 * @param precacheAssets
 * @param excludeMIMETypes
 * @returns string
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
 * @param template
 * @param cacheName
 * @param precacheAssets
 * @returns string
 * @throws
 * - INVALID_TEMPLATE_NAME: if the provided template name is not supported
 * - NOT_A_FILE: if the path is not recognized by the OS as a file or if it doesn't exist
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the content of the file is empty or invalid
 */
const buildTemplate = (
  template: ITemplateName,
  cacheName: string,
  precacheAssets: string[],
  excludeMIMETypes: string[],
): string => {
  switch (template) {
    case 'base': {
      return __buildBaseTemplate(cacheName, precacheAssets, excludeMIMETypes);
    }
    default: {
      throw new Error(encodeError(`The template name '${template}' is not supported.`, ERRORS.INVALID_TEMPLATE_NAME));
    }
  }
};





/* ************************************************************************************************
 *                                         MODULE EXPORTS                                         *
 ************************************************************************************************ */
export {
  // helpers
  stringifyArrayConstant,

  // implementation
  buildTemplate,
};
