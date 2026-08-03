// @vitest-environment node
import { runInNewContext } from 'node:vm';
import { describe, expect, test, vi } from 'vitest';

import { buildBaseTemplate } from './index.js';

// minimal fetch-event contract used to execute the generated worker in isolation
type IServiceWorkerFetchEvent = {
  request: Request;
  respondWith: (responsePromise: Promise<Response>) => void;
  waitUntil: (lifetimePromise: Promise<unknown>) => void;
};

type IServiceWorkerFetchListener = (event: IServiceWorkerFetchEvent) => void;

/**
 * Executes the generated worker with controlled network and cache dependencies.
 * @param networkResponse The response returned by the mocked network request.
 * @param writeToCache The controlled cache-write operation.
 * @returns The captured fetch listener, request, and dependency mocks.
 */
const createWorkerRuntime = (
  networkResponse: Response,
  writeToCache: () => Promise<void> = () => Promise.resolve(),
) => {
  const eventListeners = new Map<string, IServiceWorkerFetchListener>();
  const cachePut = vi.fn(writeToCache);
  const cacheOpen = vi.fn(() => Promise.resolve({ put: cachePut }));
  const consoleError = vi.fn();

  runInNewContext(buildBaseTemplate('test-cache', [], []), {
    caches: {
      delete: vi.fn(() => Promise.resolve(true)),
      keys: vi.fn(() => Promise.resolve([])),
      match: vi.fn(() => Promise.resolve(undefined)),
      open: cacheOpen,
    },
    console: { error: consoleError },
    fetch: vi.fn(() => Promise.resolve(networkResponse)),
    Response,
    self: {
      addEventListener: (eventName: string, listener: IServiceWorkerFetchListener): void => {
        eventListeners.set(eventName, listener);
      },
      clients: { claim: vi.fn(() => Promise.resolve()) },
    },
  });

  const fetchListener = eventListeners.get('fetch');
  if (!fetchListener) {
    throw new Error('The generated worker did not register a fetch listener.');
  }

  return {
    cacheOpen,
    cachePut,
    consoleError,
    fetchListener,
    request: new Request('https://example.com/app.js', {
      headers: { Accept: 'text/javascript' },
    }),
  };
};

/**
 * Dispatches a fetch event and captures its response and lifetime promises.
 * @param fetchListener The generated worker fetch listener.
 * @param request The request dispatched to the listener.
 * @returns The response promise and a getter for the asynchronously registered lifetime promise.
 */
const dispatchFetch = (fetchListener: IServiceWorkerFetchListener, request: Request) => {
  let responsePromise: Promise<Response> | undefined;
  let lifetimePromise: Promise<unknown> | undefined;

  fetchListener({
    request,
    respondWith: (pendingResponse): void => {
      responsePromise = pendingResponse;
    },
    waitUntil: (pendingOperation): void => {
      lifetimePromise = pendingOperation;
    },
  });

  if (!responsePromise) {
    throw new Error('The generated worker did not respond to the fetch event.');
  }

  return {
    getLifetimePromise: (): Promise<unknown> | undefined => lifetimePromise,
    responsePromise,
  };
};

/**
 * Verifies that a network response is returned without opening the runtime cache.
 * @param networkResponse The response that must not be cached.
 * @returns A promise that resolves after the fetch and lifetime promises have settled.
 */
const expectResponseNotCached = async (networkResponse: Response): Promise<void> => {
  const runtime = createWorkerRuntime(networkResponse);
  const pendingFetch = dispatchFetch(runtime.fetchListener, runtime.request);

  await expect(pendingFetch.responsePromise).resolves.toBe(networkResponse);

  const lifetimePromise = pendingFetch.getLifetimePromise();
  expect(lifetimePromise).toBeDefined();

  if (!lifetimePromise) {
    throw new Error('The generated worker did not extend the cache-write lifetime.');
  }

  await expect(lifetimePromise).resolves.toBeUndefined();
  expect(runtime.cacheOpen).not.toHaveBeenCalled();
  expect(runtime.cachePut).not.toHaveBeenCalled();
};

describe('Base template runtime cache', () => {
  test('returns a successful network response while extending the cache-write lifetime', async () => {
    let resolveCacheWrite: (() => void) | undefined;
    const cacheWritePromise = new Promise<void>((resolve) => {
      resolveCacheWrite = resolve;
    });
    const networkResponse = new Response('app', {
      headers: { 'Content-Type': 'text/javascript' },
      status: 200,
    });
    const runtime = createWorkerRuntime(networkResponse, () => cacheWritePromise);
    const pendingFetch = dispatchFetch(runtime.fetchListener, runtime.request);

    await expect(pendingFetch.responsePromise).resolves.toBe(networkResponse);
    expect(runtime.cacheOpen).toHaveBeenCalledWith('test-cache');
    expect(runtime.cachePut).toHaveBeenCalledOnce();

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
    const runtime = createWorkerRuntime(networkResponse, () => Promise.reject(cacheError));
    const pendingFetch = dispatchFetch(runtime.fetchListener, runtime.request);

    await expect(pendingFetch.responsePromise).resolves.toBe(networkResponse);

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
});
