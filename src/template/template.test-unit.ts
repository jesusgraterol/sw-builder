import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { readTextFile } from 'fs-utils-sync';
import { buildTemplate } from './template.js';
import { ERRORS } from '../shared/errors.js';

/* ************************************************************************************************
 *                                             MOCKS                                              *
 ************************************************************************************************ */

// fs-utils-sync package
vi.mock('fs-utils-sync', () => ({
  readTextFile: vi.fn(),
}));





/* ************************************************************************************************
 *                                           CONSTANTS                                            *
 ************************************************************************************************ */





/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

// base template builder
const buildBaseMock = (cacheName?: string, precacheAssets?: string): string => `/* ************************************************************************************************
*                                           CONSTANTS                                            *
************************************************************************************************ */

// the current version of the cache
${typeof cacheName === 'string' ? cacheName : 'const CACHE_NAME = \'\';'}

// assets that will be cached once the service worker is installed
${typeof precacheAssets === 'string' ? precacheAssets : 'const PRECACHE_ASSETS = [];'}`;





/* ************************************************************************************************
 *                                             TESTS                                              *
 ************************************************************************************************ */

describe('Template', () => {
  beforeAll(() => { });

  afterAll(() => { });

  beforeEach(() => { });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildBaseTemplate', () => {
    test('throws if an invalid template name is provided', () => {
      // @ts-ignore
      expect(() => buildTemplate('non-existent')).toThrowError(ERRORS.INVALID_TEMPLATE_NAME);
    });

    test('can build a base template', () => {
      // @ts-ignore
      readTextFile.mockReturnValue(buildBaseMock());
      expect(buildTemplate(
        'base',
        'testcache',
        ['/', '/assets/', '/assets/bundle.js', '/index.html'],
      )).toBe(buildBaseMock(
        'const CACHE_NAME = \'testcache\';',
`const PRECACHE_ASSETS = [
  '/',
  '/assets/',
  '/assets/bundle.js',
  '/index.html',
];`,
      ));
    });
  });
});
