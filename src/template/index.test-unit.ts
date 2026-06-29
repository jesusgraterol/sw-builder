import { describe, afterEach, test, expect, vi } from 'vitest';
import { Exception } from 'error-message-utils';

import { ERRORS } from '../shared/errors.js';
import { stringifyArrayConstant } from './utilities.js';
import { buildTemplate } from './index.js';

/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

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

describe('Template', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildBaseTemplate', () => {
    test('throws if an invalid template name is provided', () => {
      expectException(
        // @ts-ignore
        () => buildTemplate('non-existent'),
        "The template name 'non-existent' is not supported.",
        ERRORS.INVALID_TEMPLATE_NAME,
      );
    });

    test('can build a base template', () => {
      const template = buildTemplate('base', 'testcache', [], [], undefined);
      expect(template).toContain("const CACHE_NAME = 'testcache';");
      expect(template).toContain(stringifyArrayConstant('PRECACHE_ASSETS', []));
      expect(template).toContain(stringifyArrayConstant('EXCLUDE_MIME_TYPES', []));
    });

    test('can build a base template with precache assets and excluded MIME types', () => {
      const template = buildTemplate(
        'base',
        'testcache',
        ['/', '/assets/', '/assets/bundle.js', '/index.html'],
        ['application/json', 'text/plain'],
        undefined,
      );
      expect(template).toContain("const CACHE_NAME = 'testcache';");
      expect(template).toContain(
        stringifyArrayConstant('PRECACHE_ASSETS', [
          '/',
          '/assets/',
          '/assets/bundle.js',
          '/index.html',
        ]),
      );
      expect(template).toContain(
        stringifyArrayConstant('EXCLUDE_MIME_TYPES', ['application/json', 'text/plain']),
      );
    });
  });
});
