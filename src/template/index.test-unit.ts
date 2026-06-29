// @vitest-environment node
import { describe, afterEach, test, expect, vi } from 'vitest';
import { Exception } from 'error-message-utils';

import { ERRORS } from '../shared/errors.js';
import type { IFirebaseOptions } from '../config/index.js';
import { stringifyArrayConstant } from './utilities.js';
import { buildTemplate } from './index.js';

/* ************************************************************************************************
 *                                           CONSTANTS                                            *
 ************************************************************************************************ */

// Firebase options used to verify Firebase FCM template replacement
const TEST_FIREBASE_OPTIONS: IFirebaseOptions = {
  apiKey: 'test-api-key',
  authDomain: 'test.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test.firebasestorage.app',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:test-app',
};

// Firebase SDK version used by Firebase FCM template replacement tests
const FIREBASE_SDK_VERSION = '11.0.0';

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
      const template = buildTemplate('base', 'testcache', [], [], undefined, undefined);
      expect(template).toContain("const CACHE_NAME = 'testcache';");
      expect(template).toContain('const PRECACHE_ASSETS = [];');
      expect(template).toContain('const EXCLUDE_MIME_TYPES = [];');
      expect(template).not.toContain(stringifyArrayConstant('PRECACHE_ASSETS', []));
      expect(template).not.toContain(stringifyArrayConstant('EXCLUDE_MIME_TYPES', []));
    });

    test('can build a base template with precache assets and excluded MIME types', () => {
      const template = buildTemplate(
        'base',
        'testcache',
        ['/', '/assets/', '/assets/bundle.js', '/index.html'],
        ['application/json', 'text/plain'],
        undefined,
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

  describe('buildFirebaseFcmTemplate', () => {
    test('can build a Firebase FCM template appended to the base template', () => {
      const template = buildTemplate(
        'firebase-fcm',
        'testcache',
        ['/', '/assets/bundle.js', '/index.html'],
        ['application/json', 'text/plain'],
        TEST_FIREBASE_OPTIONS,
        FIREBASE_SDK_VERSION,
      );

      expect(template).toContain("const CACHE_NAME = 'testcache';");
      expect(template).toContain(
        stringifyArrayConstant('PRECACHE_ASSETS', ['/', '/assets/bundle.js', '/index.html']),
      );
      expect(template).toContain(
        stringifyArrayConstant('EXCLUDE_MIME_TYPES', ['application/json', 'text/plain']),
      );
      expect(template)
        .toContain(`\n\n/* ************************************************************************************************
 *                                          FIREBASE FCM                                          *
 ************************************************************************************************ */`);
      expect(template).toContain(`const FIREBASE_SDK_VERSION = '${FIREBASE_SDK_VERSION}';`);
      expect(template).toContain(
        `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-compat.js`,
      );
      expect(template).toContain(
        `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-messaging-compat.js`,
      );
      // eslint-disable-next-line no-template-curly-in-string
      expect(template).not.toContain('${FIREBASE_SDK_VERSION}');
      expect(template).not.toContain("const FIREBASE_SDK_VERSION = '';");
      expect(template).not.toContain("importScripts('firebase-app-compat.js');");
      expect(template).not.toContain("importScripts('firebase-messaging-compat.js');");
      expect(template).not.toContain('firebase.initializeApp({});');
      expect(template).toContain(
        `firebase.initializeApp(${JSON.stringify(TEST_FIREBASE_OPTIONS, null, 2)});`,
      );
    });
  });
});
