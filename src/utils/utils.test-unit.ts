import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { isDirectory, isFile, readJSONFile } from 'fs-utils-sync';
import { IBaseConfig } from '../shared/types.js';
import { ERRORS } from '../shared/errors.js';
import {
  OUTPUT_NAME,
  CACHE_NAME_CHARACTERS,
  CACHE_NAME_LENGTH,
  generateCacheName,
  readConfigFile,
  buildOutputPath,
  buildPrecacheAssetPaths,
} from './utils.js';

/* ************************************************************************************************
 *                                           CONSTANTS                                            *
 ************************************************************************************************ */

// mock value for outDir
const OUT_DIR: string = 'test-dist';





/* ************************************************************************************************
 *                                             MOCKS                                              *
 ************************************************************************************************ */

// fs-utils-sync package
vi.mock('fs-utils-sync', () => ({
  readJSONFile: vi.fn(),
  isDirectory: vi.fn(),
  isFile: vi.fn(),
}));





/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

// configuration builder
const c = (config?: Partial<IBaseConfig>): IBaseConfig => ({
  outDir: config?.outDir ?? 'dist',
  template: config?.template ?? 'base',
  includeToPrecache: config?.includeToPrecache ?? ['/', '/index.html', '/style.css', 'app.js'],
  excludeFilesFromPrecache: config?.excludeFilesFromPrecache ?? [],
  ...config,
});



/* ************************************************************************************************
 *                                             TESTS                                              *
 ************************************************************************************************ */

describe('readConfigFile', () => {
  beforeAll(() => { });

  afterAll(() => { });

  beforeEach(() => { });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('throws if the config object is invalid', () => {
    // @ts-ignore
    readJSONFile.mockReturnValue(undefined);
    expect(() => readConfigFile('config.json')).toThrowError(ERRORS.INVALID_CONFIG_VALUE);
  });

  test('throws if the outDir is invalid or the directory doesn\'t exist', () => {
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ outDir: undefined }));
    expect(() => readConfigFile('config.json')).toThrowError(ERRORS.INVALID_CONFIG_VALUE);
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ outDir: '' }));
    expect(() => readConfigFile('config.json')).toThrowError(ERRORS.INVALID_CONFIG_VALUE);
    // @ts-ignore
    isDirectory.mockReturnValue(false);
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ outDir: 'dist' }));
    expect(() => readConfigFile('config.json')).toThrowError(ERRORS.INVALID_CONFIG_VALUE);
  });

  test('throws if the includeToPrecache is not an array or is empty', () => {
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ includeToPrecache: undefined }));
    expect(() => readConfigFile('config.json')).toThrowError(ERRORS.INVALID_CONFIG_VALUE);
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ includeToPrecache: [] }));
    expect(() => readConfigFile('config.json')).toThrowError(ERRORS.INVALID_CONFIG_VALUE);
  });

  test('throws if the excludeFromPrecache is not an array', () => {
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ excludeFromPrecache: undefined }));
    expect(() => readConfigFile('config.json')).toThrowError(ERRORS.INVALID_CONFIG_VALUE);
  });

  test('can pass all the validations with a proper file', () => {
    // @ts-ignore
    readJSONFile.mockReturnValue(c());
    // @ts-ignore
    isDirectory.mockReturnValue(true);
    expect(() => readConfigFile('config.json')).not.toThrowError();
    expect(readConfigFile('config.json')).toStrictEqual(c());
  });
});





describe('generateCacheName', () => {
  test('can generate a valid cache name', () => {
    expect(new RegExp(`^[${CACHE_NAME_CHARACTERS}]{${CACHE_NAME_LENGTH}}$`).test(generateCacheName())).toBeTruthy();
  });

  test('generates a different name every time', () => {
    const arr: string[] = [generateCacheName(), generateCacheName(), generateCacheName()];
    const unique: Set<string> = new Set(arr);
    expect(unique.size).toBe(arr.length);
  });
});





describe('buildPrecacheAssetPaths', () => {
  beforeAll(() => { });

  afterAll(() => { });

  beforeEach(() => { });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('includes the root path / even if it is not provided', () => {
    expect(buildPrecacheAssetPaths(OUT_DIR, [], [])).toStrictEqual(['/']);
  });

  test.skip('can build a basic list of assets without exclusions', () => {
    isFile.mockReturnValueOnce(true);
    expect(buildPrecacheAssetPaths(OUT_DIR, [
      '/index.html',
      '/styles.css',
      '/app.js',
      '/img',
    ], [])).toStrictEqual([
      '/',
      '/index.html',
      '/styles.css',
      '/app.js',
    ]);
  });
});





describe('buildOutputPath', () => {
  test('can build the output path based on the outDir', () => {
    expect(buildOutputPath('dist')).toBe(`dist/${OUTPUT_NAME}`);
    expect(buildOutputPath('./dist')).toBe(`dist/${OUTPUT_NAME}`);
    expect(buildOutputPath('distribution')).toBe(`distribution/${OUTPUT_NAME}`);
  });
});
