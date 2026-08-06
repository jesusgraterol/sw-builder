// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, test, vi } from 'vitest';

import { BASE_TEMPLATE } from './base.js';
import { buildBaseTemplate } from './index.js';

// minimal extendable-event contract used to execute generated workers in isolation
type IServiceWorkerExtendableEvent = {
  waitUntil: (lifetimePromise: Promise<unknown>) => void;
};

// minimal fetch-event contract used to observe interception and response lifetimes
type IServiceWorkerFetchEvent = IServiceWorkerExtendableEvent & {
  request: Request;
  respondWith: (responsePromise: Promise<Response>) => void;
};

type IServiceWorkerEventListener = (event: IServiceWorkerExtendableEvent) => void;

// controlled CacheStorage behavior used by the worker runtime
type ICacheStorageOptions = {
  deleteCache?: (cacheName: string) => Promise<boolean>;
  putInCache?: (cacheName: string, request: Request, response: Response) => Promise<void>;
};

// controlled generated-worker behavior used by individual tests
type IWorkerRuntimeOptions = {
  cacheName?: string;
  cacheNamePrefix?: string;
  cacheStorage?: ReturnType<typeof createCacheStorage>;
  claimClients?: () => Promise<void>;
  excludeMimeTypes?: string[];
  networkResponse?: Response;
  precacheAssets?: string[];
};

/**
 * Converts a request or precache path into the absolute key used by the isolated CacheStorage.
 * @param request The request or asset path to normalize.
 * @returns The absolute cache key.
 */
const getRequestKey = (request: Request | string): string =>
  new URL(typeof request === 'string' ? request : request.url, 'https://example.com').href;

/**
 * Builds a shared in-memory CacheStorage implementation with observable operations.
 * @param options Optional controlled cache operation implementations.
 * @returns The CacheStorage implementation, records, and operation spies.
 */
const createCacheStorage = (options: ICacheStorageOptions = {}) => {
  const cacheRecords = new Map<string, Map<string, Response>>();

  const seedCache = (cacheName: string, entries: Record<string, Response> = {}): void => {
    cacheRecords.set(
      cacheName,
      new Map(
        Object.entries(entries).map(([request, response]) => [getRequestKey(request), response]),
      ),
    );
  };

  const cacheAddAll = vi.fn(async (cacheName: string, assetPaths: string[]): Promise<void> => {
    const records = cacheRecords.get(cacheName);
    if (!records) {
      throw new Error(`Cache '${cacheName}' was not opened.`);
    }

    assetPaths.forEach((assetPath) => {
      records.set(
        getRequestKey(assetPath),
        new Response(`${cacheName}:${assetPath}`, {
          headers: { 'Content-Type': 'text/plain' },
          status: 200,
        }),
      );
    });
  });

  const cacheMatch = vi.fn(
    async (cacheName: string, request: Request): Promise<Response | undefined> =>
      cacheRecords.get(cacheName)?.get(getRequestKey(request)),
  );

  const cachePut = vi.fn(
    async (cacheName: string, request: Request, response: Response): Promise<void> => {
      if (options.putInCache) {
        await options.putInCache(cacheName, request, response);
        return;
      }

      cacheRecords.get(cacheName)?.set(getRequestKey(request), response);
    },
  );

  const cacheOpen = vi.fn(async (cacheName: string) => {
    if (!cacheRecords.has(cacheName)) {
      seedCache(cacheName);
    }

    return {
      addAll: (assetPaths: string[]): Promise<void> => cacheAddAll(cacheName, assetPaths),
      match: (request: Request): Promise<Response | undefined> => cacheMatch(cacheName, request),
      put: (request: Request, response: Response): Promise<void> =>
        cachePut(cacheName, request, response),
    };
  });

  const cacheDelete = vi.fn(async (cacheName: string): Promise<boolean> => {
    if (options.deleteCache) {
      const wasDeleted = await options.deleteCache(cacheName);
      if (wasDeleted) {
        cacheRecords.delete(cacheName);
      }
      return wasDeleted;
    }

    return cacheRecords.delete(cacheName);
  });

  const cacheKeys = vi.fn(async (): Promise<string[]> => [...cacheRecords.keys()]);
  const globalCacheMatch = vi.fn(async (): Promise<Response | undefined> => undefined);

  return {
    cacheAddAll,
    cacheDelete,
    cacheKeys,
    cacheMatch,
    cacheOpen,
    cachePut,
    cacheRecords,
    globalCacheMatch,
    seedCache,
    value: {
      delete: cacheDelete,
      keys: cacheKeys,
      match: globalCacheMatch,
      open: cacheOpen,
    },
  };
};

/**
 * Returns a registered generated-worker event listener.
 * @param eventListeners The registered listener map.
 * @param eventName The event name to retrieve.
 * @returns The registered event listener.
 */
const getEventListener = (
  eventListeners: Map<string, IServiceWorkerEventListener>,
  eventName: string,
): IServiceWorkerEventListener => {
  const listener = eventListeners.get(eventName);
  if (!listener) {
    throw new Error(`The generated worker did not register a '${eventName}' listener.`);
  }

  return listener;
};

/**
 * Executes a generated worker with controlled network, clients, and CacheStorage dependencies.
 * @param options The worker template and runtime dependencies.
 * @returns The registered listeners and observable runtime dependencies.
 */
const createWorkerRuntime = (options: IWorkerRuntimeOptions = {}) => {
  const cacheNamePrefix = options.cacheNamePrefix ?? 'test-app';
  const cacheName = options.cacheName ?? `${cacheNamePrefix}--version-a`;
  const cacheStorage = options.cacheStorage ?? createCacheStorage();
  const eventListeners = new Map<string, IServiceWorkerEventListener>();
  const clientsClaim = vi.fn(options.claimClients ?? (() => Promise.resolve()));
  const consoleError = vi.fn();
  const fetchRequest = vi.fn(() =>
    Promise.resolve(
      options.networkResponse ??
        new Response('network response', {
          headers: { 'Content-Type': 'text/javascript' },
          status: 200,
        }),
    ),
  );
  const skipWaiting = vi.fn(() => Promise.resolve());

  runInNewContext(
    buildBaseTemplate(
      cacheNamePrefix,
      cacheName,
      options.precacheAssets ?? [],
      options.excludeMimeTypes ?? [],
    ),
    {
      URL,
      caches: cacheStorage.value,
      console: { error: consoleError },
      fetch: fetchRequest,
      Response,
      self: {
        addEventListener: (eventName: string, listener: IServiceWorkerEventListener): void => {
          eventListeners.set(eventName, listener);
        },
        clients: { claim: clientsClaim },
        location: { origin: 'https://example.com' },
        skipWaiting,
      },
    },
  );

  return {
    activateListener: getEventListener(eventListeners, 'activate'),
    cacheName,
    cacheStorage,
    clientsClaim,
    consoleError,
    fetchListener: getEventListener(eventListeners, 'fetch'),
    fetchRequest,
    installListener: getEventListener(eventListeners, 'install'),
    skipWaiting,
  };
};

/**
 * Dispatches an install or activate event and returns its lifetime promise.
 * @param listener The generated worker event listener.
 * @returns The event lifetime promise.
 */
const dispatchExtendableEvent = (listener: IServiceWorkerEventListener): Promise<unknown> => {
  let lifetimePromise: Promise<unknown> | undefined;

  listener({
    waitUntil: (pendingOperation): void => {
      lifetimePromise = pendingOperation;
    },
  });

  if (!lifetimePromise) {
    throw new Error('The generated worker did not extend the event lifetime.');
  }

  return lifetimePromise;
};

/**
 * Dispatches a fetch event and captures whether and how the worker intercepted it.
 * @param fetchListener The generated worker fetch listener.
 * @param request The request dispatched to the listener.
 * @returns The response, lifetime, and respondWith observations.
 */
const dispatchFetch = (fetchListener: IServiceWorkerEventListener, request: Request) => {
  let responsePromise: Promise<Response> | undefined;
  let lifetimePromise: Promise<unknown> | undefined;
  const respondWith = vi.fn((pendingResponse: Promise<Response>): void => {
    responsePromise = pendingResponse;
  });
  const event: IServiceWorkerFetchEvent = {
    request,
    respondWith,
    waitUntil: (pendingOperation): void => {
      lifetimePromise = pendingOperation;
    },
  };

  fetchListener(event);

  return {
    getLifetimePromise: (): Promise<unknown> | undefined => lifetimePromise,
    respondWith,
    responsePromise,
  };
};

/**
 * Returns the response promise for a fetch event that must be intercepted.
 * @param responsePromise The possibly registered response promise.
 * @returns The registered response promise.
 */
const requireResponsePromise = (
  responsePromise: Promise<Response> | undefined,
): Promise<Response> => {
  if (!responsePromise) {
    throw new Error('The generated worker did not respond to an eligible fetch event.');
  }

  return responsePromise;
};

/**
 * Verifies that a network response is returned but is not written to the current cache.
 * @param networkResponse The response that must not be cached.
 * @param excludeMimeTypes MIME types excluded by the generated worker.
 * @returns A promise that resolves after the fetch and lifetime promises have settled.
 */
const expectResponseNotCached = async (
  networkResponse: Response,
  excludeMimeTypes: string[] = [],
): Promise<void> => {
  const runtime = createWorkerRuntime({ excludeMimeTypes, networkResponse });
  const request = new Request('https://example.com/app.js', {
    headers: { Accept: 'text/javascript' },
  });
  const pendingFetch = dispatchFetch(runtime.fetchListener, request);

  await expect(requireResponsePromise(pendingFetch.responsePromise)).resolves.toBe(networkResponse);

  const lifetimePromise = pendingFetch.getLifetimePromise();
  expect(lifetimePromise).toBeDefined();

  if (!lifetimePromise) {
    throw new Error('The generated worker did not extend the cache-write lifetime.');
  }

  await expect(lifetimePromise).resolves.toBeUndefined();
  expect(runtime.cacheStorage.cachePut).not.toHaveBeenCalled();
};

describe('Base worker source', () => {
  test('keeps the editable worker and embedded template synchronized', () => {
    const editableWorker = readFileSync(new URL('./base.sw.js', import.meta.url), 'utf8').replace(
      '/* eslint-disable no-undef */\n/* eslint-disable no-restricted-globals */\n',
      '',
    );

    expect(BASE_TEMPLATE.trim()).toBe(editableWorker.trim());
  });
});

describe('Base template lifecycle', () => {
  test('install populates only the new cache without deleting caches or skipping waiting', async () => {
    const cacheStorage = createCacheStorage();
    cacheStorage.seedCache('test-app--version-a');
    const runtime = createWorkerRuntime({
      cacheName: 'test-app--version-b',
      cacheStorage,
      precacheAssets: ['/app.js'],
    });

    await expect(dispatchExtendableEvent(runtime.installListener)).resolves.toBeUndefined();

    expect(cacheStorage.cacheAddAll).toHaveBeenCalledWith('test-app--version-b', ['/app.js']);
    expect(cacheStorage.cacheDelete).not.toHaveBeenCalled();
    expect(cacheStorage.cacheRecords.has('test-app--version-a')).toBe(true);
    expect(cacheStorage.cacheRecords.has('test-app--version-b')).toBe(true);
    expect(runtime.skipWaiting).not.toHaveBeenCalled();
  });

  test('the active worker keeps serving its cache while the next worker is installed', async () => {
    const cacheStorage = createCacheStorage();
    const workerA = createWorkerRuntime({
      cacheName: 'test-app--version-a',
      cacheStorage,
      precacheAssets: ['/app.js'],
    });
    const workerB = createWorkerRuntime({
      cacheName: 'test-app--version-b',
      cacheStorage,
      precacheAssets: ['/app.js'],
    });

    await dispatchExtendableEvent(workerA.installListener);
    await dispatchExtendableEvent(workerB.installListener);

    const pendingFetch = dispatchFetch(
      workerA.fetchListener,
      new Request('https://example.com/app.js'),
    );
    const response = await requireResponsePromise(pendingFetch.responsePromise);

    await expect(response.text()).resolves.toBe('test-app--version-a:/app.js');
    expect(workerA.fetchRequest).not.toHaveBeenCalled();
    expect(cacheStorage.cacheDelete).not.toHaveBeenCalled();
    expect(cacheStorage.cacheRecords.has('test-app--version-a')).toBe(true);
    expect(cacheStorage.cacheRecords.has('test-app--version-b')).toBe(true);
  });

  test('activate deletes only older caches in the namespace before claiming clients', async () => {
    let resolveCacheDeletion: ((wasDeleted: boolean) => void) | undefined;
    const cacheDeletionPromise = new Promise<boolean>((resolve) => {
      resolveCacheDeletion = resolve;
    });
    const cacheStorage = createCacheStorage({
      deleteCache: () => cacheDeletionPromise,
    });
    cacheStorage.seedCache('test-app--version-a');
    cacheStorage.seedCache('test-app--version-b');
    cacheStorage.seedCache('test-app-other--version-a');
    cacheStorage.seedCache('other-app--version-a');
    cacheStorage.seedCache('legacyrandom');
    const runtime = createWorkerRuntime({
      cacheName: 'test-app--version-b',
      cacheStorage,
    });

    const activationPromise = dispatchExtendableEvent(runtime.activateListener);
    await vi.waitFor(() => {
      expect(cacheStorage.cacheDelete).toHaveBeenCalledWith('test-app--version-a');
    });

    expect(runtime.clientsClaim).not.toHaveBeenCalled();
    expect(cacheStorage.cacheDelete).toHaveBeenCalledTimes(1);

    if (!resolveCacheDeletion) {
      throw new Error('The controlled cache deletion was not initialized.');
    }

    resolveCacheDeletion(true);
    await expect(activationPromise).resolves.toBeUndefined();

    expect(runtime.clientsClaim).toHaveBeenCalledOnce();
    expect(cacheStorage.cacheRecords.has('test-app--version-a')).toBe(false);
    expect(cacheStorage.cacheRecords.has('test-app--version-b')).toBe(true);
    expect(cacheStorage.cacheRecords.has('test-app-other--version-a')).toBe(true);
    expect(cacheStorage.cacheRecords.has('other-app--version-a')).toBe(true);
    expect(cacheStorage.cacheRecords.has('legacyrandom')).toBe(true);
  });
});

describe('Base template fetch interception', () => {
  test('handles same-origin GET requests using only the opened current cache', async () => {
    const cachedResponse = new Response('cached response');
    const cacheStorage = createCacheStorage();
    cacheStorage.seedCache('test-app--version-a', {
      '/app.js': cachedResponse,
    });
    const runtime = createWorkerRuntime({ cacheStorage });
    const request = new Request('https://example.com/app.js');
    const pendingFetch = dispatchFetch(runtime.fetchListener, request);

    await expect(requireResponsePromise(pendingFetch.responsePromise)).resolves.toBe(
      cachedResponse,
    );
    expect(pendingFetch.respondWith).toHaveBeenCalledOnce();
    expect(cacheStorage.cacheOpen).toHaveBeenCalledWith('test-app--version-a');
    expect(cacheStorage.cacheMatch).toHaveBeenCalledWith('test-app--version-a', request);
    expect(cacheStorage.globalCacheMatch).not.toHaveBeenCalled();
    expect(runtime.fetchRequest).not.toHaveBeenCalled();
  });

  test.each([
    ['POST request', new Request('https://example.com/app.js', { method: 'POST' })],
    ['cross-origin GET request', new Request('https://cdn.example.net/app.js')],
  ])('does not intercept a %s', (_description, request) => {
    const runtime = createWorkerRuntime();
    const pendingFetch = dispatchFetch(runtime.fetchListener, request);

    expect(pendingFetch.respondWith).not.toHaveBeenCalled();
    expect(pendingFetch.responsePromise).toBeUndefined();
    expect(runtime.cacheStorage.cacheOpen).not.toHaveBeenCalled();
    expect(runtime.fetchRequest).not.toHaveBeenCalled();
  });
});

describe('Base template runtime cache writes', () => {
  test('returns a successful network response while extending the cache-write lifetime', async () => {
    let resolveCacheWrite: (() => void) | undefined;
    const cacheWritePromise = new Promise<void>((resolve) => {
      resolveCacheWrite = resolve;
    });
    const networkResponse = new Response('app', {
      headers: { 'Content-Type': 'text/javascript' },
      status: 200,
    });
    const cacheStorage = createCacheStorage({ putInCache: () => cacheWritePromise });
    const runtime = createWorkerRuntime({ cacheStorage, networkResponse });
    const pendingFetch = dispatchFetch(
      runtime.fetchListener,
      new Request('https://example.com/app.js', {
        headers: { Accept: 'text/javascript' },
      }),
    );

    await expect(requireResponsePromise(pendingFetch.responsePromise)).resolves.toBe(
      networkResponse,
    );
    expect(cacheStorage.cachePut).toHaveBeenCalledOnce();

    const lifetimePromise = pendingFetch.getLifetimePromise();
    expect(lifetimePromise).toBeDefined();

    if (!resolveCacheWrite || !lifetimePromise) {
      throw new Error('The generated worker did not extend the cache-write lifetime.');
    }

    resolveCacheWrite();
    await expect(lifetimePromise).resolves.toBeUndefined();
  });

  test('returns a successful network response when the cache write fails', async () => {
    const cacheError = new Error('Cache storage unavailable.');
    const networkResponse = new Response('app', {
      headers: { 'Content-Type': 'text/javascript' },
      status: 200,
    });
    const cacheStorage = createCacheStorage({
      putInCache: () => Promise.reject(cacheError),
    });
    const runtime = createWorkerRuntime({ cacheStorage, networkResponse });
    const pendingFetch = dispatchFetch(
      runtime.fetchListener,
      new Request('https://example.com/app.js', {
        headers: { Accept: 'text/javascript' },
      }),
    );

    await expect(requireResponsePromise(pendingFetch.responsePromise)).resolves.toBe(
      networkResponse,
    );

    const lifetimePromise = pendingFetch.getLifetimePromise();
    expect(lifetimePromise).toBeDefined();

    if (!lifetimePromise) {
      throw new Error('The generated worker did not extend the cache-write lifetime.');
    }

    await expect(lifetimePromise).resolves.toBeUndefined();
    expect(runtime.consoleError).toHaveBeenCalledWith(
      'Failed to cache the network response.',
      cacheError,
    );
  });

  test('does not cache an unsuccessful network response', async () => {
    await expectResponseNotCached(
      new Response('Not found', {
        headers: { 'Content-Type': 'text/plain' },
        status: 404,
      }),
    );
  });

  test('does not cache an opaque network response', async () => {
    const opaqueResponse = new Response(null, { status: 200 });
    const cloneOpaqueResponse = opaqueResponse.clone.bind(opaqueResponse);
    Object.defineProperty(opaqueResponse, 'type', { value: 'opaque' });
    Object.defineProperty(opaqueResponse, 'clone', {
      value: (): Response => {
        const clonedResponse = cloneOpaqueResponse();
        Object.defineProperty(clonedResponse, 'type', { value: 'opaque' });
        return clonedResponse;
      },
    });

    await expectResponseNotCached(opaqueResponse);
  });

  test('does not cache a Partial Content network response', async () => {
    await expectResponseNotCached(
      new Response('Partial content', {
        headers: { 'Content-Type': 'text/plain' },
        status: 206,
      }),
    );
  });

  test('does not cache a network response that varies on every request header', async () => {
    await expectResponseNotCached(
      new Response('app', {
        headers: { 'Content-Type': 'text/javascript', Vary: 'Accept-Encoding, *' },
        status: 200,
      }),
    );
  });

  test('does not cache a response with an excluded MIME type', async () => {
    await expectResponseNotCached(
      new Response('{}', {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
      ['application/json'],
    );
  });
});
