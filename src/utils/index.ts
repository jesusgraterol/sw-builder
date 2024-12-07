/* eslint-disable no-console */
import { join } from 'node:path';
import { encodeError } from 'error-message-utils';
import {
  isArrayValid,
  isObjectValid,
  isStringValid,
  generateRandomString,
} from 'web-utils-kit';
import {
  isDirectory,
  readJSONFile,
  getPathElement,
  IPathElement,
  readDirectory,
} from 'fs-utils-sync';
import { IBaseConfig } from '../shared/types.js';
import { ERRORS } from '../shared/errors.js';

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
  if (!isObjectValid(config)) {
    console.log(config);
    throw new Error(encodeError('The extracted configuration is not a valid object.', ERRORS.INVALID_CONFIG_VALUE));
  }
  if (!isStringValid(config.outDir, 1) || !isDirectory(config.outDir)) {
    throw new Error(encodeError(`The outDir '${config.outDir}' is not a directory or doesn't exist.`, ERRORS.INVALID_CONFIG_VALUE));
  }
  if (!isStringValid(config.template, 1)) {
    throw new Error(encodeError(`The template '${config.template}' is not a valid template name.`, ERRORS.INVALID_CONFIG_VALUE));
  }
  if (!isArrayValid(config.includeToPrecache)) {
    console.log(config.includeToPrecache);
    throw new Error(encodeError(`The includeToPrecache '${config.includeToPrecache}' list is invalid or empty.`, ERRORS.INVALID_CONFIG_VALUE));
  }
  if (!isArrayValid(config.excludeFilesFromPrecache, true)) {
    console.log(config.excludeFilesFromPrecache);
    throw new Error(encodeError(`The excludeFilesFromPrecache '${config.excludeFilesFromPrecache}' list is invalid.`, ERRORS.INVALID_CONFIG_VALUE));
  }
  if (!isArrayValid(config.excludeMIMETypesFromCache, true)) {
    console.log(config.excludeMIMETypesFromCache);
    throw new Error(encodeError(`The excludeMIMETypesFromCache '${config.excludeMIMETypesFromCache}' list is invalid.`, ERRORS.INVALID_CONFIG_VALUE));
  }
};

/**
 * Extracts the path element from a given path.
 * @param path
 * @returns IPathElement
 * @throws
 * - NOT_A_PATH_ELEMENT: if the provided path doesn't exist or is not a valid path element
 */
const __getPathElement = (path: string): IPathElement => {
  const el = getPathElement(path);
  if (el === null || (!el.isDirectory && !el.isFile)) {
    throw new Error(encodeError(`The asset '${path}' is not a path element.`, ERRORS.NOT_A_PATH_ELEMENT));
  }
  return el;
};

/**
 * Fully reads a given directory path and returns the files that are cacheable.
 * @param outDir
 * @param path
 * @param excludeFilesFromPrecache
 * @returns string[]
 */
const __extractCacheableFilesFromDirectory = (
  outDir: string,
  path: string,
  excludeFilesFromPrecache: string[],
): string[] => {
  // read all the directory contents
  let content: string[] = readDirectory(path, true);

  // filter those paths that are not cacheable
  content = content.filter((p: string) => {
    const el = __getPathElement(p);
    return el.isFile && !excludeFilesFromPrecache.includes(el.baseName);
  });

  // finally, remove the outDir from the path
  return content.map((filePath: string) => filePath.replace(outDir, ''));
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
const generateCacheName = (): string => generateRandomString(
  CACHE_NAME_LENGTH,
  CACHE_NAME_CHARACTERS,
);

/**
 * Puts the list of all the assets that must be cached based on the include and exclude lists.
 * @param outDir
 * @param includeToPrecache
 * @param excludeFilesFromPrecache
 * @returns string[]
 * @throws
 * - NOT_A_PATH_ELEMENT: if the provided path doesn't exist or is not a valid path element
 */
const buildPrecacheAssetPaths = (
  outDir: string,
  includeToPrecache: string[],
  excludeFilesFromPrecache: string[],
): string[] => {
  // init the list of assets
  const assets: string[] = ['/'];

  // iterate over each asset that will be precached. Ensure to avoid the root path and files that
  // should be excluded
  includeToPrecache.forEach((path: string) => {
    if (path !== '/') {
      const el = __getPathElement(join(outDir, path));
      if (el.isFile && !excludeFilesFromPrecache.includes(el.baseName)) {
        assets.push(path);
      } else {
        assets.push(...__extractCacheableFilesFromDirectory(
          outDir,
          el.path,
          excludeFilesFromPrecache,
        ));
      }
    }
  });

  // finally, return the completed list
  return assets;
};

/**
 * Builds the binary's output build based on the config's outDir.
 * @param outDir
 * @returns string
 */
const buildOutputPath = (outDir: string): string => join(outDir, OUTPUT_NAME);





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
  buildPrecacheAssetPaths,
  buildOutputPath,
};
