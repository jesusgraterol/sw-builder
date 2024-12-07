import { describe, afterEach, test, expect, vi } from 'vitest';
import { ERRORS } from '../shared/errors.js';
import { buildTemplate, stringifyArrayConstant } from './index.js';

/* ************************************************************************************************
 *                                             TESTS                                              *
 ************************************************************************************************ */

describe('Template', () => {
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
        [],
        [],
      );
      expect(template).toContain('const CACHE_NAME = \'testcache\';');
      expect(template).toContain(stringifyArrayConstant('PRECACHE_ASSETS', []));
      expect(template).toContain(stringifyArrayConstant('EXCLUDE_MIME_TYPES', []));
    });

    test('can build a base template with precache assets and excluded MIME types', () => {
      const template = buildTemplate(
        'base',
        'testcache',
        ['/', '/assets/', '/assets/bundle.js', '/index.html'],
        ['application/json', 'text/plain'],
      );
      expect(template).toContain('const CACHE_NAME = \'testcache\';');
      expect(template).toContain(stringifyArrayConstant('PRECACHE_ASSETS', [
        '/',
        '/assets/',
        '/assets/bundle.js',
        '/index.html',
      ]));
      expect(template).toContain(stringifyArrayConstant('EXCLUDE_MIME_TYPES', [
        'application/json',
        'text/plain',
      ]));
    });
  });
});
