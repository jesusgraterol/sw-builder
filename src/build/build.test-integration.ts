import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect, vi } from 'vitest';
import {
  deleteDirectory,
  deleteFile,
  isFile,
  readFile,
  readTextFile,
  writeJSONFile,
  writeTextFile,
} from 'fs-utils-sync';
import { IBaseConfig, IModuleArgs } from '../shared/types.js';
import { run } from './build.js';
import { buildOutputPath } from '../utils/utils.js';

/* ************************************************************************************************
 *                                             MOCKS                                              *
 ************************************************************************************************ */

// fs-utils-sync mocks
vi.mock('fs-utils-sync', async (importOriginal) => {
  const actual: object = await importOriginal();
  return {
    ...actual,
    readTextFile: vi.fn(),
  };
});





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

// the configuration builder
const c = (config?: Partial<IBaseConfig>) => ({
  outDir: config?.outDir ?? DIST_PATH,
  template: config?.template ?? 'base',
  includeToPrecache: config?.includeToPrecache ?? [],
  excludeFilesFromPrecache: config?.excludeFilesFromPrecache ?? [],
});





/* ************************************************************************************************
 *                                             TESTS                                              *
 ************************************************************************************************ */

describe('Build', () => {
  beforeAll(() => { });

  afterAll(() => {
    deleteFile(CONFIG_PATH);
    deleteDirectory(DIST_PATH);
  });

  beforeEach(() => { });

  afterEach(() => { });

  test('can build the Service Worker Base Template', () => {
    // mock the base template to avoid path issues
    // @ts-ignore
    readTextFile.mockReturnValueOnce(readFile('src/template/raw/sw.base.js', { encoding: 'utf8' }));

    // create the config file
    writeJSONFile('sw-builder.config.json', c({
      includeToPrecache: [
        '/index.html',
        '/assets',
      ],
    }));

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
