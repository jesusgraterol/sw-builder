import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { buildTemplate } from './template.js';
import { ERRORS } from '../shared/errors.js';

/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

// precache assets string builder
const buildPrecacheAssetsString = (assets: string[]): string => {
  let precache: string = 'const PRECACHE_ASSETS = [\n';
  assets.forEach((a) => {
    precache += `  '${a}',\n`;
  });
  precache += '];';
  return precache;
};

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
      const template = buildTemplate(
        'base',
        'testcache',
        ['/', '/assets/', '/assets/bundle.js', '/index.html'],
      );
      expect(template).toContain('const CACHE_NAME = \'testcache\';');
      expect(template).toContain(buildPrecacheAssetsString([
        '/',
        '/assets/',
        '/assets/bundle.js',
        '/index.html',
      ]));
    });
  });
});
