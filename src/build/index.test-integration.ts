import { describe, afterAll, test, expect } from 'vitest';
import {
  deleteDirectory,
  deleteFile,
  isFile,
  readTextFile,
  writeJSONFile,
  writeTextFile,
} from 'fs-utils-sync';

import type { IBaseConfig } from '../config/index.js';
import type { IModuleArgs } from '../shared/types.js';
import { stringifyArrayConstant } from '../template/utilities.js';
import { buildOutputPath } from '../utilities/index.js';

import { run } from './index.js';

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
  cacheNamePrefix: config?.cacheNamePrefix ?? 'test-app',
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
        includeToPrecache: ['/assets'],
      }),
    );

    // create the cacheable files
    writeTextFile(`${DIST_PATH}/index.html`, 'Test Index File');
    writeTextFile(`${DIST_PATH}/assets/index-B3okp6nu.js`, 'Test JS File');
    writeTextFile(`${DIST_PATH}/assets/index-DYWPQKGv.css`, 'Test CSS File');

    // build the service worker
    run(<IModuleArgs>{ config: CONFIG_PATH });

    // ensure the service worker was created
    const outputPath = buildOutputPath(DIST_PATH);
    expect(isFile(outputPath)).toBeTruthy();

    const serviceWorker = readTextFile(outputPath);
    expect(serviceWorker).toContain("const CACHE_NAME_PREFIX = 'test-app';");
    expect(serviceWorker).toMatch(/const CACHE_NAME = 'test-app--[a-z0-9]{10}';/);
    expect(serviceWorker).toContain(
      stringifyArrayConstant('PRECACHE_ASSETS', [
        '/assets/index-B3okp6nu.js',
        '/assets/index-DYWPQKGv.css',
      ]),
    );
    expect(serviceWorker).not.toContain("  '/',");
    expect(serviceWorker).not.toContain("  '/index.html',");
  });
});
