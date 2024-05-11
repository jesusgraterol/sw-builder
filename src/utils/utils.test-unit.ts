import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect } from 'vitest';
import { CACHE_NAME_CHARACTERS, CACHE_NAME_LENGTH, generateCacheName } from './utils.js';

describe('generateCacheName', () => {
  beforeAll(() => { });

  afterAll(() => { });

  beforeEach(() => { });

  afterEach(() => { });

  test('can generate a valid cache name', () => {
    expect(new RegExp(`^[${CACHE_NAME_CHARACTERS}]{${CACHE_NAME_LENGTH}}$`).test(generateCacheName())).toBeTruthy();
  });

  test('generates a different name every time', () => {
    const arr: string[] = [generateCacheName(), generateCacheName(), generateCacheName()];
    const unique: Set<string> = new Set(arr);
    expect(unique.size).toBe(arr.length);
  });
});
