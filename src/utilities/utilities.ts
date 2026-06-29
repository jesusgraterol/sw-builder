/* eslint-disable no-console */
import { join } from 'node:path';
import { Exception } from 'error-message-utils';
import { isArrayValid, isObjectValid, isStringValid, generateRandomString } from 'web-utils-kit';
import {
  isDirectory,
  readJSONFile,
  getPathElement,
  type IPathElement,
  readDirectory,
} from 'fs-utils-sync';

import type { IBaseConfig } from '../shared/types.js';
import { ERRORS } from '../shared/errors.js';
import { CACHE_NAME_CHARACTERS, CACHE_NAME_LENGTH, OUTPUT_NAME } from './constants.js';

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
    throw new Exception(
      'The extracted configuration is not a valid object.',
      ERRORS.INVALID_CONFIG_VALUE,
    );
  }
  if (!isStringValid(config.outDir, 1) || !isDirectory(config.outDir)) {
    throw new Exception(
      `The outDir '${config.outDir}' is not a directory or doesn't exist.`,
      ERRORS.INVALID_CONFIG_VALUE,
    );
  }
  if (!isStringValid(config.template, 1)) {
    throw new Exception(
      `The template '${config.template}' is not a valid template name.`,
      ERRORS.INVALID_CONFIG_VALUE,
    );
  }
  if (!isArrayValid(config.includeToPrecache, true)) {
    console.log(config.includeToPrecache);
    throw new Exception(
      `The includeToPrecache '${config.includeToPrecache}' list is invalid.`,
      ERRORS.INVALID_CONFIG_VALUE,
    );
  }
  if (!isArrayValid(config.excludeFilesFromPrecache, true)) {
    console.log(config.excludeFilesFromPrecache);
    throw new Exception(
      `The excludeFilesFromPrecache '${config.excludeFilesFromPrecache}' list is invalid.`,
      ERRORS.INVALID_CONFIG_VALUE,
    );
  }
  if (!isArrayValid(config.excludeMIMETypesFromCache, true)) {
    console.log(config.excludeMIMETypesFromCache);
    throw new Exception(
      `The excludeMIMETypesFromCache '${config.excludeMIMETypesFromCache}' list is invalid.`,
      ERRORS.INVALID_CONFIG_VALUE,
    );
  }
};

/**
 * Extracts the path element from a given path.
 * @param path
 * @returns The path element object
 * @throws
 * - NOT_A_PATH_ELEMENT: if the provided path doesn't exist or is not a valid path element
 */
const __getPathElement = (path: string): IPathElement => {
  const el = getPathElement(path);
  if (el === null || (!el.isDirectory && !el.isFile)) {
    throw new Exception(`The asset '${path}' is not a path element.`, ERRORS.NOT_A_PATH_ELEMENT);
  }
  return el;
};

/**
 * Fully reads a given directory path and returns the files that are cacheable.
 * @param outDir
 * @param path
 * @param excludeFilesFromPrecache
 * @returns A list of cacheable files in the directory
 * @throws
 * - NOT_A_DIRECTORY: if the directory is not considered a directory by the OS.
 * - NOT_A_PATH_ELEMENT: if the provided path doesn't exist or is not a valid path element
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
 * @returns The configuration object
 * @throws
 * - NOT_A_FILE: if the path is not recognized by the OS as a file or if it doesn't exist
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the content of the file is empty or invalid
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the file's JSON content cannot be parsed
 * - INVALID_CONFIG_VALUE: if any of the essential config values is invalid
 */
export const readConfigFile = (configPath: string): IBaseConfig => {
  const config: IBaseConfig = <IBaseConfig>readJSONFile(configPath);
  __validateConfigFile(config);
  return config;
};

/**
 * Generates a randomly generated name to be used for the CacheStorage
 * @returns The generated cache name
 */
export const generateCacheName = (): string =>
  generateRandomString(CACHE_NAME_LENGTH, CACHE_NAME_CHARACTERS);

/**
 * Puts the list of all the assets that must be cached based on the include and exclude lists.
 * If there are no items to precache, an empty list will be returned.
 * @param outDir
 * @param includeToPrecache
 * @param excludeFilesFromPrecache
 * @returns The list of assets that will be precached
 * @throws
 * - NOT_A_PATH_ELEMENT: if the provided path doesn't exist or is not a valid path element
 */
export const buildPrecacheAssetPaths = (
  outDir: string,
  includeToPrecache: string[],
  excludeFilesFromPrecache: string[],
): string[] => {
  // ensure there are elements to precache
  if (includeToPrecache.length === 0) {
    return [];
  }

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
        assets.push(
          ...__extractCacheableFilesFromDirectory(outDir, el.path, excludeFilesFromPrecache),
        );
      }
    }
  });

  // finally, return the completed list
  return assets;
};

/**
 * Builds the binary's output build based on the config's outDir.
 * @param outDir
 * @returns The output path for the build
 */
export const buildOutputPath = (outDir: string): string => join(outDir, OUTPUT_NAME);
