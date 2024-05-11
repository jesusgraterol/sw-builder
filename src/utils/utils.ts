import { encodeError } from 'error-message-utils';
import { isDirectory, readJSONFile } from 'fs-utils-sync';
import { ERRORS, IBaseConfig } from '../shared/index.js';

/* ************************************************************************************************
 *                                           CONSTANTS                                            *
 ************************************************************************************************ */

// the characters that can be used to generate cache names
const CACHE_NAME_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789';

// the number of characters that will comprise the cache names
const CACHE_NAME_LENGTH: number = 10;

// the name of the file that is built and placed in the outDir
const OUTPUT_NAME: string = 'sw.js';


/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

/**
 * Performs the essential validations on the configuration file. Note it doesn't get into template
 * specific validations.
 * @param config
 * @throws
 * - INVALID_CONFIG_VALUE: if any of the essential config values is invalid
 */
const __validateConfigFile = (config: IBaseConfig): void => {
  if (!config || typeof config !== 'object') {
    console.log(config);
    throw new Error(encodeError('The extracted configuration is not a valid object.', ERRORS.INVALID_CONFIG_VALUE));
  }
  if (typeof config.outDir !== 'string' || !config.outDir.length || !isDirectory(config.outDir)) {
    throw new Error(encodeError(`The outDir '${config.outDir}' is not a directory or doesn't exist.`, ERRORS.INVALID_CONFIG_VALUE));
  }
  if (typeof config.template !== 'string' || !config.template.length) {
    throw new Error(encodeError(`The template '${config.template}' is not a valid template name.`, ERRORS.INVALID_CONFIG_VALUE));
  }
  if (!Array.isArray(config.includeToPrecache) || !config.includeToPrecache.length) {
    console.log(config.includeToPrecache);
    throw new Error(encodeError(`The includeToPrecache '${config.includeToPrecache}' list is invalid or empty.`, ERRORS.INVALID_CONFIG_VALUE));
  }
  if (!Array.isArray(config.excludeFromPrecache)) {
    console.log(config.excludeFromPrecache);
    throw new Error(encodeError(`The excludeFromPrecache '${config.includeToPrecache}' list is invalid.`, ERRORS.INVALID_CONFIG_VALUE));
  }
};





/* ************************************************************************************************
 *                                         IMPLEMENTATION                                         *
 ************************************************************************************************ */

/**
 * Reads, validates and returns the configuration file.
 * @param configPath
 * @returns IBaseConfig
 * @throws
 * - NOT_A_FILE: if the path is not recognized by the OS as a file or if it doesn't exist
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the content of the file is empty or invalid
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the file's JSON content cannot be parsed
 * - INVALID_CONFIG_VALUE: if any of the essential config values is invalid
 */
const readConfigFile = (configPath: string): IBaseConfig => {
  const config: IBaseConfig = <IBaseConfig>readJSONFile(configPath);
  __validateConfigFile(config);
  return config;
};

/**
 * Generates a randomly generated name to be used for the CacheStorage
 * @returns string
 */
const generateCacheName = (): string => {
  let nm: string = '';
  let counter: number = 0;
  while (counter < CACHE_NAME_LENGTH) {
    nm += CACHE_NAME_CHARACTERS.charAt(Math.floor(Math.random() * CACHE_NAME_CHARACTERS.length));
    counter += 1;
  }
  return nm;
};





/* ************************************************************************************************
 *                                         MODULE EXPORTS                                         *
 ************************************************************************************************ */
export {
  // constants
  CACHE_NAME_CHARACTERS,
  CACHE_NAME_LENGTH,
  OUTPUT_NAME,

  // implementation
  readConfigFile,
  generateCacheName,
};
