import { describe, afterAll, test, expect } from 'vitest';
import { deleteDirectory, deleteFile, isFile, writeJSONFile, writeTextFile } from 'fs-utils-sync';

import type { IBaseConfig } from '../config/index.js';
import type { IModuleArgs } from '../shared/types.js';
import { run } from './index.js';
import { buildOutputPath } from '../utilities/index.js';

/* ************************************************************************************************
 *                                           CONSTANTS                                            *
 ************************************************************************************************ */

// the dist's test path
const DIST_PATH: string = 'test-dist';

// the config's test path
const CONFIG_PATH: string = 'sw-builder.config.json';

/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

/**
 * Builds a base configuration fixture.
 * @param config The configuration fields to override.
 * @returns The complete base configuration fixture.
 */
const buildBaseConfig = (config?: Partial<IBaseConfig>): IBaseConfig => ({
  outDir: config?.outDir ?? DIST_PATH,
  template: 'base',
  includeToPrecache: config?.includeToPrecache ?? [],
  excludeFilesFromPrecache: config?.excludeFilesFromPrecache ?? [],
  excludeMIMETypesFromCache: config?.excludeMIMETypesFromCache ?? [],
});

/* ************************************************************************************************
 *                                             TESTS                                              *
 ************************************************************************************************ */

describe('Build', () => {
  afterAll(() => {
    deleteFile(CONFIG_PATH);
    deleteDirectory(DIST_PATH);
  });

  test('can build the Service Worker Base Template', () => {
    // create the config file
    writeJSONFile(
      'sw-builder.config.json',
      buildBaseConfig({
        includeToPrecache: ['/index.html', '/assets'],
      }),
    );

    // create the cacheable files
    writeTextFile(`${DIST_PATH}/index.html`, 'Test Index File');
    writeTextFile(`${DIST_PATH}/assets/index-B3okp6nu.js`, 'Test JS File');
    writeTextFile(`${DIST_PATH}/assets/index-DYWPQKGv.css`, 'Test CSS File');

    // build the service worker
    run(<IModuleArgs>{ config: CONFIG_PATH });

    // ensure the service worker was created
    expect(isFile(buildOutputPath(DIST_PATH))).toBeTruthy();
  });
});
