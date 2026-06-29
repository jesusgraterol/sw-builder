import { describe, afterEach, test, expect, vi } from 'vitest';
import { Exception } from 'error-message-utils';
import {
  type IPathElement,
  isDirectory,
  readJSONFile,
  getPathElement,
  readDirectory,
} from 'fs-utils-sync';

import type { IBaseConfig } from '../shared/types.js';
import { ERRORS } from '../shared/errors.js';
import { CACHE_NAME_CHARACTERS, CACHE_NAME_LENGTH, OUTPUT_NAME } from './constants.js';
import {
  generateCacheName,
  readConfigFile,
  buildOutputPath,
  buildPrecacheAssetPaths,
} from './index.js';

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
  getPathElement: vi.fn(),
  readDirectory: vi.fn(),
}));

/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

// configuration builder
const c = (config?: Partial<IBaseConfig>): IBaseConfig => ({
  outDir: config?.outDir ?? OUT_DIR,
  template: config?.template ?? 'base',
  includeToPrecache: config?.includeToPrecache ?? ['/', '/index.html', '/style.css', 'app.js'],
  excludeFilesFromPrecache: config?.excludeFilesFromPrecache ?? [],
  excludeMIMETypesFromCache: config?.excludeMIMETypesFromCache ?? [],
  ...config,
});

// path element builder
const pe = (el: Partial<IPathElement>): IPathElement => ({
  path: el?.path ?? '',
  baseName: el?.baseName ?? '',
  extName: el?.extName ?? '',
  isFile: el?.isFile ?? false,
  isDirectory: el?.isDirectory ?? false,
  isSymbolicLink: el?.isSymbolicLink ?? false,
  size: el?.size ?? 1000,
  creation: el?.creation ?? Date.now(),
});

// mocks the getPathElement func so it returns a custom list of path elements
const mockGetPathElement = (returnValues: (IPathElement | null)[], mockFn?: any) => {
  if (returnValues.length) {
    const mockVal = returnValues.shift();
    if (mockFn) {
      // @ts-ignore
      mockGetPathElement(returnValues, mockFn.mockReturnValueOnce(mockVal));
    } else {
      // @ts-ignore
      mockGetPathElement(returnValues, getPathElement.mockReturnValueOnce(mockVal));
    }
  }
};

/**
 * Captures the error thrown by a callback.
 * @param throwError The callback expected to throw.
 * @returns The captured error.
 */
const captureError = (throwError: () => unknown): unknown => {
  try {
    throwError();
  } catch (error) {
    return error;
  }

  throw new Error('Expected callback to throw.');
};

/**
 * Verifies an Exception without depending on encoded message strings.
 * @param throwError The callback expected to throw.
 * @param expectedMessage The exact expected error message.
 * @param expectedCode The exact expected error code.
 */
const expectException = (
  throwError: () => unknown,
  expectedMessage: string,
  expectedCode: string,
): void => {
  const error = captureError(throwError);

  expect(error).toBeInstanceOf(Exception);
  expect(error).toMatchObject({
    message: expectedMessage,
    code: expectedCode,
  });
};

/* ************************************************************************************************
 *                                             TESTS                                              *
 ************************************************************************************************ */

describe('readConfigFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('throws if the config object is invalid', () => {
    // @ts-ignore
    readJSONFile.mockReturnValue(undefined);
    expectException(
      () => readConfigFile('config.json'),
      'The extracted configuration is not a valid object.',
      ERRORS.INVALID_CONFIG_VALUE,
    );
  });

  test("throws if the outDir is invalid or the directory doesn't exist", () => {
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ outDir: undefined }));
    expectException(
      () => readConfigFile('config.json'),
      "The outDir 'undefined' is not a directory or doesn't exist.",
      ERRORS.INVALID_CONFIG_VALUE,
    );
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ outDir: '' }));
    expectException(
      () => readConfigFile('config.json'),
      "The outDir '' is not a directory or doesn't exist.",
      ERRORS.INVALID_CONFIG_VALUE,
    );
    // @ts-ignore
    isDirectory.mockReturnValue(false);
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ outDir: 'dist' }));
    expectException(
      () => readConfigFile('config.json'),
      "The outDir 'dist' is not a directory or doesn't exist.",
      ERRORS.INVALID_CONFIG_VALUE,
    );
  });

  test('throws if the template is invalid', () => {
    // @ts-ignore
    isDirectory.mockReturnValue(true);
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ template: undefined }));
    expectException(
      () => readConfigFile('config.json'),
      "The template 'undefined' is not a valid template name.",
      ERRORS.INVALID_CONFIG_VALUE,
    );
  });

  test('throws if the includeToPrecache is not an array', () => {
    // @ts-ignore
    isDirectory.mockReturnValue(true);
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ includeToPrecache: undefined }));
    expectException(
      () => readConfigFile('config.json'),
      "The includeToPrecache 'undefined' list is invalid.",
      ERRORS.INVALID_CONFIG_VALUE,
    );
  });

  test('throws if the excludeFilesFromPrecache is not an array', () => {
    // @ts-ignore
    isDirectory.mockReturnValue(true);
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ excludeFilesFromPrecache: undefined }));
    expectException(
      () => readConfigFile('config.json'),
      "The excludeFilesFromPrecache 'undefined' list is invalid.",
      ERRORS.INVALID_CONFIG_VALUE,
    );
  });

  test('throws if the excludeMIMETypesFromCache is not an array', () => {
    // @ts-ignore
    isDirectory.mockReturnValue(true);
    // @ts-ignore
    readJSONFile.mockReturnValue(c({ excludeMIMETypesFromCache: undefined }));
    expectException(
      () => readConfigFile('config.json'),
      "The excludeMIMETypesFromCache 'undefined' list is invalid.",
      ERRORS.INVALID_CONFIG_VALUE,
    );
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
    expect(
      new RegExp(`^[${CACHE_NAME_CHARACTERS}]{${CACHE_NAME_LENGTH}}$`).test(generateCacheName()),
    ).toBeTruthy();
  });

  test('generates a different name every time', () => {
    const arr: string[] = [generateCacheName(), generateCacheName(), generateCacheName()];
    const unique: Set<string> = new Set(arr);
    expect(unique.size).toBe(arr.length);
  });
});

describe('buildPrecacheAssetPaths', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('throws if an asset does not exist', () => {
    mockGetPathElement([pe({ baseName: '/index.html', isFile: true }), null]);
    expectException(
      () => buildPrecacheAssetPaths(OUT_DIR, ['/index.html', '/app.js'], []),
      "The asset 'test-dist/app.js' is not a path element.",
      ERRORS.NOT_A_PATH_ELEMENT,
    );
  });

  test('throws if an asset is a symbolic link', () => {
    mockGetPathElement([
      pe({ baseName: '/index.html', isFile: true }),
      pe({ baseName: '/app.js', isSymbolicLink: true }),
    ]);
    expectException(
      () => buildPrecacheAssetPaths(OUT_DIR, ['/index.html', '/app.js'], []),
      "The asset 'test-dist/app.js' is not a path element.",
      ERRORS.NOT_A_PATH_ELEMENT,
    );
  });

  test('returns an empty list if the precaching is not enabled', () => {
    expect(buildPrecacheAssetPaths(OUT_DIR, [], [])).toStrictEqual([]);
  });

  test('can build a basic list of assets without exclusions', () => {
    mockGetPathElement([
      pe({ baseName: '/index.html', isFile: true }),
      pe({ baseName: '/styles.css', isFile: true }),
      pe({ baseName: '/app.js', isFile: true }),
      pe({ baseName: '/img', isDirectory: true }),
    ]);
    // @ts-ignore
    readDirectory.mockReturnValueOnce([
      `${OUT_DIR}/img/some-img.png`,
      `${OUT_DIR}/img/some-other-img.jpg`,
    ]);
    mockGetPathElement([
      pe({ baseName: 'some-img.png', isFile: true }),
      pe({ baseName: 'some-other-img.jpg', isFile: true }),
    ]);
    expect(
      buildPrecacheAssetPaths(OUT_DIR, ['/index.html', '/styles.css', '/app.js', '/img'], []),
    ).toStrictEqual([
      '/',
      '/index.html',
      '/styles.css',
      '/app.js',
      '/img/some-img.png',
      '/img/some-other-img.jpg',
    ]);
  });

  test('can build a basic list of assets with exclusions', () => {
    mockGetPathElement([
      pe({ baseName: '/index.html', isFile: true }),
      pe({ baseName: '/styles.css', isFile: true }),
      pe({ baseName: '/app.js', isFile: true }),
      pe({ baseName: '/img', isDirectory: true }),
    ]);
    // @ts-ignore
    readDirectory.mockReturnValueOnce([
      `${OUT_DIR}/img/some-img.png`,
      `${OUT_DIR}/img/some-other-img.jpg`,
    ]);
    mockGetPathElement([
      pe({ baseName: 'some-img.png', isFile: true }),
      pe({ baseName: 'some-other-img.jpg', isFile: true }),
    ]);
    expect(
      buildPrecacheAssetPaths(
        OUT_DIR,
        ['/index.html', '/styles.css', '/app.js', '/img'],
        ['some-other-img.jpg'],
      ),
    ).toStrictEqual(['/', '/index.html', '/styles.css', '/app.js', '/img/some-img.png']);
  });
});

describe('buildOutputPath', () => {
  test('can build the output path based on the outDir', () => {
    expect(buildOutputPath('dist')).toBe(`dist/${OUTPUT_NAME}`);
    expect(buildOutputPath('./dist')).toBe(`dist/${OUTPUT_NAME}`);
    expect(buildOutputPath('distribution')).toBe(`distribution/${OUTPUT_NAME}`);
  });
});
