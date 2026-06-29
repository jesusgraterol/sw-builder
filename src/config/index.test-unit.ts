// @vitest-environment node
import { config as loadDotEnv } from 'dotenv';
import { Exception } from 'error-message-utils';
import { readJSONFile } from 'fs-utils-sync';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ERRORS } from '../shared/errors.js';
import type { IBaseConfig, IFirebaseFcmConfig, IFirebaseOptions } from './index.js';
import { readConfigFile } from './index.js';

/* ************************************************************************************************
 *                                           CONSTANTS                                            *
 ************************************************************************************************ */

// the config's test path
const CONFIG_PATH = 'config.json';

// env key used to isolate Firebase config values from the developer's shell
const TEST_FIREBASE_CONFIG_PROCESS_ENV_KEY = 'SW_BUILDER_TEST_FIREBASE_CONFIG';

// SDK version used by Firebase FCM configuration tests
const FIREBASE_SDK_VERSION = '11.0.0';

// the original Firebase config env value so tests can restore process state
const ORIGINAL_FIREBASE_CONFIG = process.env[TEST_FIREBASE_CONFIG_PROCESS_ENV_KEY];

/* ************************************************************************************************
 *                                             MOCKS                                              *
 ************************************************************************************************ */

// dotenv package
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

// fs-utils-sync package
vi.mock('fs-utils-sync', () => ({
  readJSONFile: vi.fn(),
}));

/* ************************************************************************************************
 *                                            HELPERS                                             *
 ************************************************************************************************ */

// exception expectation fields used by the config reader tests
type IExceptionExpectation = {
  code: string;
  message?: string;
  messagePrefix?: string;
};

/**
 * Builds a valid base configuration fixture.
 * @param config The configuration fields to override.
 * @returns The complete base configuration fixture.
 */
const buildBaseConfig = (config: Partial<IBaseConfig> = {}): IBaseConfig => ({
  outDir: config.outDir ?? 'test-dist',
  template: 'base',
  includeToPrecache: config.includeToPrecache ?? ['/', '/index.html', '/style.css', 'app.js'],
  excludeFilesFromPrecache: config.excludeFilesFromPrecache ?? [],
  excludeMIMETypesFromCache: config.excludeMIMETypesFromCache ?? [],
});

/**
 * Builds a valid Firebase FCM configuration fixture.
 * @param config The configuration fields to override.
 * @returns The complete Firebase FCM configuration fixture.
 */
const buildFirebaseFcmConfig = (config: Partial<IFirebaseFcmConfig> = {}): IFirebaseFcmConfig => ({
  outDir: config.outDir ?? 'test-dist',
  template: 'firebase-fcm',
  includeToPrecache: config.includeToPrecache ?? ['/', '/index.html', '/style.css', 'app.js'],
  excludeFilesFromPrecache: config.excludeFilesFromPrecache ?? [],
  excludeMIMETypesFromCache: config.excludeMIMETypesFromCache ?? [],
  firebaseConfigProcessEnvKey:
    config.firebaseConfigProcessEnvKey ?? TEST_FIREBASE_CONFIG_PROCESS_ENV_KEY,
  firebaseSdkVersion: config.firebaseSdkVersion ?? FIREBASE_SDK_VERSION,
});

/**
 * Builds a valid Firebase options fixture.
 * @param options The Firebase option fields to override.
 * @returns The complete Firebase options fixture.
 */
const buildFirebaseOptions = (options: Partial<IFirebaseOptions> = {}): IFirebaseOptions => ({
  apiKey: options.apiKey ?? 'test-api-key',
  authDomain: options.authDomain ?? 'test.firebaseapp.com',
  projectId: options.projectId ?? 'test-project',
  storageBucket: options.storageBucket ?? 'test.firebasestorage.app',
  messagingSenderId: options.messagingSenderId ?? '123456789',
  appId: options.appId ?? '1:123456789:web:test-app',
});

/**
 * Restores the Firebase config env value mutated by Firebase config tests.
 */
const restoreFirebaseConfigEnv = (): void => {
  if (ORIGINAL_FIREBASE_CONFIG === undefined) {
    delete process.env[TEST_FIREBASE_CONFIG_PROCESS_ENV_KEY];
    return;
  }

  process.env[TEST_FIREBASE_CONFIG_PROCESS_ENV_KEY] = ORIGINAL_FIREBASE_CONFIG;
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
 * Verifies an Exception and the stable parts of its message.
 * @param throwError The callback expected to throw.
 * @param expected The expected exception code and message details.
 */
const expectException = (throwError: () => unknown, expected: IExceptionExpectation): void => {
  const error = captureError(throwError);

  expect(error).toBeInstanceOf(Exception);
  expect(error).toMatchObject({ code: expected.code });

  const exception = error as Exception;

  if (expected.message !== undefined) {
    expect(exception.message).toBe(expected.message);
  }

  if (expected.messagePrefix !== undefined) {
    expect(exception.message.startsWith(expected.messagePrefix)).toBe(true);
  }
};

/* ************************************************************************************************
 *                                             TESTS                                              *
 ************************************************************************************************ */

describe('readConfigFile', () => {
  afterEach(() => {
    restoreFirebaseConfigEnv();
    vi.clearAllMocks();
  });

  test.each([
    ['missing config object', undefined],
    ['empty outDir', { ...buildBaseConfig(), outDir: '' }],
    ['missing template', { ...buildBaseConfig(), template: undefined }],
    ['invalid template', { ...buildBaseConfig(), template: 'non-existent' }],
    ['extra base config field', { ...buildBaseConfig(), firebaseSdkVersion: FIREBASE_SDK_VERSION }],
    ['invalid includeToPrecache', { ...buildBaseConfig(), includeToPrecache: undefined }],
    [
      'invalid excludeFilesFromPrecache',
      { ...buildBaseConfig(), excludeFilesFromPrecache: undefined },
    ],
    [
      'invalid excludeMIMETypesFromCache',
      { ...buildBaseConfig(), excludeMIMETypesFromCache: undefined },
    ],
  ])('readConfigFile(%s) -> FAILED_TO_READ_BASE_CONFIG', (_description, config) => {
    vi.mocked(readJSONFile).mockReturnValue(config);

    expectException(() => readConfigFile(CONFIG_PATH, undefined), {
      code: ERRORS.FAILED_TO_READ_BASE_CONFIG,
      messagePrefix: `Failed to read the base configuration file '${CONFIG_PATH}':`,
    });
  });

  test('throws if the config file cannot be read', () => {
    vi.mocked(readJSONFile).mockImplementation(() => {
      throw new Error('Config file is missing.');
    });

    expectException(() => readConfigFile(CONFIG_PATH, undefined), {
      code: ERRORS.FAILED_TO_READ_BASE_CONFIG,
      messagePrefix: `Failed to read the base configuration file '${CONFIG_PATH}':`,
    });
  });

  test('can read a valid base config', () => {
    const baseConfig = buildBaseConfig();
    vi.mocked(readJSONFile).mockReturnValue(baseConfig);

    expect(readConfigFile(CONFIG_PATH, undefined)).toStrictEqual(baseConfig);
    expect(loadDotEnv).not.toHaveBeenCalled();
  });

  test.each([
    [
      'missing Firebase config env key',
      { ...buildFirebaseFcmConfig(), firebaseConfigProcessEnvKey: undefined },
    ],
    [
      'empty Firebase config env key',
      { ...buildFirebaseFcmConfig(), firebaseConfigProcessEnvKey: '' },
    ],
    [
      'missing Firebase SDK version',
      { ...buildFirebaseFcmConfig(), firebaseSdkVersion: undefined },
    ],
    ['empty Firebase SDK version', { ...buildFirebaseFcmConfig(), firebaseSdkVersion: '' }],
  ])('readConfigFile(%s) -> FAILED_TO_READ_BASE_CONFIG', (_description, config) => {
    vi.mocked(readJSONFile).mockReturnValue(config);

    expectException(() => readConfigFile(CONFIG_PATH, 'production'), {
      code: ERRORS.FAILED_TO_READ_BASE_CONFIG,
      messagePrefix: `Failed to read the base configuration file '${CONFIG_PATH}':`,
    });
    expect(loadDotEnv).not.toHaveBeenCalled();
  });

  test('throws if Firebase config is requested without a valid environment', () => {
    const firebaseOptions = buildFirebaseOptions();

    vi.mocked(readJSONFile).mockReturnValue(buildFirebaseFcmConfig());
    process.env[TEST_FIREBASE_CONFIG_PROCESS_ENV_KEY] = JSON.stringify({
      options: firebaseOptions,
    });

    expectException(() => readConfigFile(CONFIG_PATH, undefined), {
      code: ERRORS.INVALID_ENVIRONMENT,
      message:
        "The firebase-fcm sw template requires a valid environment to be provided. The provided environment is 'undefined'.",
    });
  });

  test('throws if the Firebase config process env key has no value', () => {
    vi.mocked(readJSONFile).mockReturnValue(buildFirebaseFcmConfig());

    expectException(() => readConfigFile(CONFIG_PATH, 'production'), {
      code: ERRORS.INVALID_FIREBASE_CONFIG,
      message: `The Firebase configuration process environment key is invalid: ${TEST_FIREBASE_CONFIG_PROCESS_ENV_KEY}`,
    });
    expect(loadDotEnv).toHaveBeenCalledWith({
      path: '.env.production',
      override: false,
      quiet: true,
    });
  });

  test('throws if the Firebase config environment value cannot be parsed', () => {
    vi.mocked(readJSONFile).mockReturnValue(buildFirebaseFcmConfig());
    process.env[TEST_FIREBASE_CONFIG_PROCESS_ENV_KEY] = 'invalid-json';

    expectException(() => readConfigFile(CONFIG_PATH, 'production'), {
      code: ERRORS.FAILED_TO_READ_FIREBASE_CONFIG,
      messagePrefix: `Failed to read the Firebase configuration from the process environment variable '${TEST_FIREBASE_CONFIG_PROCESS_ENV_KEY}':`,
    });
    expect(loadDotEnv).toHaveBeenCalledWith({
      path: '.env.production',
      override: false,
      quiet: true,
    });
  });

  test('can read a Firebase config with environment options', () => {
    const firebaseFcmConfig = buildFirebaseFcmConfig();
    const firebaseOptions = buildFirebaseOptions();
    const expectedConfig = {
      ...firebaseFcmConfig,
      firebaseOptions,
    };

    vi.mocked(readJSONFile).mockReturnValue(firebaseFcmConfig);
    process.env[TEST_FIREBASE_CONFIG_PROCESS_ENV_KEY] = JSON.stringify({
      options: firebaseOptions,
    });

    expect(readConfigFile(CONFIG_PATH, 'development')).toStrictEqual(expectedConfig);
    expect(loadDotEnv).toHaveBeenCalledWith({
      path: '.env',
      override: false,
      quiet: true,
    });
  });
});
