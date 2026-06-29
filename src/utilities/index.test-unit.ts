// @vitest-environment node
import { describe, afterEach, test, expect, vi } from 'vitest';
import { Exception } from 'error-message-utils';
import { type IPathElement, getPathElement, readDirectory } from 'fs-utils-sync';

import { ERRORS } from '../shared/errors.js';
import { CACHE_NAME_CHARACTERS, CACHE_NAME_LENGTH, OUTPUT_NAME } from './constants.js';
import { generateCacheName, buildOutputPath, buildPrecacheAssetPaths } from './index.js';

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
  getPathElement: vi.fn(),
  readDirectory: vi.fn(),
}));

/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

/**
 * Builds a mock path element for cache asset traversal tests.
 * @param el The path element fields to override.
 * @returns The complete mocked path element.
 */
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

/**
 * Queues mocked path element responses in the same order the utility reads them.
 * @param returnValues The path element responses to return.
 */
const mockGetPathElement = (returnValues: (IPathElement | null)[]): void => {
  returnValues.forEach((pathElement: IPathElement | null) => {
    vi.mocked(getPathElement).mockReturnValueOnce(pathElement);
  });
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
    vi.mocked(readDirectory).mockReturnValueOnce([
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
    vi.mocked(readDirectory).mockReturnValueOnce([
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
