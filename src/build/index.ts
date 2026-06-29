import { writeTextFile } from 'fs-utils-sync';

import { IModuleArgs } from '../shared/types.js';
import { buildOutputPath, buildPrecacheAssetPaths, generateCacheName } from '../utilities/index.js';
import { readConfigFile } from '../config/config.js';
import { buildTemplate } from '../template/index.js';

/**
 * Executes the sw-builder script and builds the Service Worker based on the configuration.
 * @param args
 * @throws
 * - FAILED_TO_READ_BASE_CONFIG: if the base configuration file could not be read or parsed.
 * - INVALID_FIREBASE_CONFIG: if the provided Firebase SDK version is invalid.
 * - INVALID_FIREBASE_CONFIG: if the provided env var key is invalid or not set.
 * - INVALID_ENVIRONMENT: if the provided environment is not recognized.
 * - FAILED_TO_READ_FIREBASE_CONFIG: if the Firebase configuration could not be read from the environment variable.
 * - FAILED_TO_BUILD_CONFIG: if the configuration file could not be read or parsed.
 * - NOT_A_PATH_ELEMENT: if the provided path doesn't exist or is not a valid path element
 * - ...
 * - ...
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if data is not a valid string.
 */
export const run = ({
  config = 'sw-builder.config.json',
  environment,
  firebaseConfigProcessEnvKey,
  firebaseSdkVersion,
}: IModuleArgs): void => {
  // load the configuration file
  const configuration = readConfigFile(
    config,
    environment,
    firebaseConfigProcessEnvKey,
    firebaseSdkVersion,
  );

  // build the Service Worker's Template
  const template = buildTemplate(
    configuration.template,
    generateCacheName(),
    buildPrecacheAssetPaths(
      configuration.outDir,
      configuration.includeToPrecache,
      configuration.excludeFilesFromPrecache,
    ),
    configuration.excludeMIMETypesFromCache,
    'firebaseOptions' in configuration ? configuration.firebaseOptions : undefined,
  );

  // finally, save the file in the specified path
  writeTextFile(buildOutputPath(configuration.outDir), template);
};
