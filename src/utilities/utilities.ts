/* eslint-disable no-console */
import { join } from 'node:path';
import { Exception } from 'error-message-utils';
import { generateRandomString } from 'web-utils-kit';
import { getPathElement, type IPathElement, readDirectory } from 'fs-utils-sync';

import { ERRORS } from '../shared/errors.js';
import { CACHE_NAME_CHARACTERS, CACHE_NAME_LENGTH, OUTPUT_NAME } from './constants.js';

/**
 * Generates a randomly generated name to be used for the CacheStorage
 * @returns The generated cache name
 */
export const generateCacheName = (): string =>
  generateRandomString(CACHE_NAME_LENGTH, CACHE_NAME_CHARACTERS);

/**
 * Extracts the path element from a given path.
 * @param path The path to extract the path element from.
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
 * @param outDir The output directory path.
 * @param path The directory path to read.
 * @param excludeFilesFromPrecache The list of files to exclude from precaching.
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

/**
 * Puts the list of all the assets that must be cached based on the include and exclude lists.
 * If there are no items to precache, an empty list will be returned.
 * @param outDir The output directory path.
 * @param includeToPrecache The list of assets to include in the precache.
 * @param excludeFilesFromPrecache The list of files to exclude from precaching.
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
 * @param outDir The output directory path.
 * @returns The output path for the build
 */
export const buildOutputPath = (outDir: string): string => join(outDir, OUTPUT_NAME);
