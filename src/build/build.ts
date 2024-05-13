import { writeTextFile } from 'fs-utils-sync';
import { IModuleArgs } from '../shared/index.js';
import {
  buildOutputPath,
  buildPrecacheAssetPaths,
  generateCacheName,
  readConfigFile,
} from '../utils/index.js';
import { buildTemplate } from '../template/index.js';

/* ************************************************************************************************
 *                                         IMPLEMENTATION                                         *
 ************************************************************************************************ */

/**
 * Executes the sw-builder script and builds the Service Worker based on the configuration.
 * @param args
 * @throws
 * - NOT_A_FILE: if the path is not recognized by the OS as a file or if it doesn't exist
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the content of the file is empty or invalid or the JSON
 * content cannot be parsed
 * - INVALID_CONFIG_VALUE: if any of the essential config values is invalid
 * - INVALID_TEMPLATE_NAME: if the provided template name is not supported
 * - NOT_A_PATH_ELEMENT: if the provided path doesn't exist or is not a valid path element
 */
const run = ({ config = 'sw-builder.config.json' }: IModuleArgs): void => {
  // load the configuration file
  const configuration = readConfigFile(config);

  // build the Service Worker's Template
  const template = buildTemplate(
    configuration.template,
    generateCacheName(),
    buildPrecacheAssetPaths(
      configuration.outDir,
      configuration.includeToPrecache,
      configuration.excludeFilesFromPrecache,
    ),
  );

  // finally, save the file in the specified path
  writeTextFile(buildOutputPath(configuration.outDir), template);
};





/* ************************************************************************************************
 *                                         MODULE EXPORTS                                         *
 ************************************************************************************************ */
export {
  run,
};
