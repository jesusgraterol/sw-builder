/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
/* ************************************************************************************************
 *                                             CACHE                                              *
 ************************************************************************************************ */

/**------------------------------------------------------------------------------------------------
 * Constants
 -------------------------------------------------------------------------------------------------*/

// the current version of the cache
const CACHE_NAME = '';

// assets that will be cached once the service worker is installed
const PRECACHE_ASSETS = [];

// the list of MIME Types that won't be cached when the app sends HTTP GET requests
const EXCLUDE_MIME_TYPES = [];

/**------------------------------------------------------------------------------------------------
 * Main actions
 -------------------------------------------------------------------------------------------------*/

/**
 * Invoked when the Service Worker has been installed. It takes care of adding the base resources
 * to the cache (if any).
 * @returns A promise that resolves when the resources have been added to the cache
 */
const precacheResources = async () => {
  if (PRECACHE_ASSETS.length > 0) {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_ASSETS);
  }
};

/**
 * Verifies if the value of the 'Accept' or 'Content-Type' header is cacheable.
 * @param {*} contentTypeHeader
 * @returns A boolean indicating if the value of the header is cacheable
 */
const isMIMETypeCacheable = (contentTypeHeader) =>
  contentTypeHeader === null ||
  !EXCLUDE_MIME_TYPES.some((type) => contentTypeHeader.includes(type));

/**
 * Verifies that a response does not vary on every request header.
 * @param {*} varyHeader
 * @returns A boolean indicating if the value of the header is cacheable
 */
const isVaryHeaderCacheable = (varyHeader) =>
  varyHeader === null || !varyHeader.split(',').some((field) => field.trim() === '*');

/**
 * All successful responses should be cached except for:
 * - Non-GET requests
 * - Opaque responses
 * - Partial Content responses
 * - Responses that include a Vary: * header
 * - Requests or responses with MIME Types included in EXCLUDE_MIME_TYPES
 * @param {*} request
 * @param {*} response
 * @returns A boolean indicating if the request can be cached
 */
const canRequestBeCached = (request, response) =>
  response.ok &&
  response.status !== 206 &&
  request.method === 'GET' &&
  response.type !== 'opaque' &&
  isVaryHeaderCacheable(response.headers.get('vary')) &&
  isMIMETypeCacheable(request.headers.get('accept')) &&
  isMIMETypeCacheable(response.headers.get('content-type'));

/**
 * Adds the request and its response to the cache.
 * @param {*} request
 * @param {*} response
 * @returns A promise that resolves when the request and its response have been added to the cache
 */
const putInCache = async (request, response) => {
  if (canRequestBeCached(request, response)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
  }
};

/**
 * Attempts to cache a response without rejecting the fetch lifecycle on storage failures.
 * @param {*} request
 * @param {*} response
 * @returns A promise that resolves after the cache write has completed or failed
 */
const putInCacheSafely = async (request, response) => {
  try {
    await putInCache(request, response);
  } catch (error) {
    // cache writes are best-effort and must not replace a valid network response
    // eslint-disable-next-line no-console
    console.error('Failed to cache the network response.', error);
  }
};

/**
 * Intercepts the fetch requests and attempts to fill them with data from the cache. If not present,
 * it will perform the request and store the data in cache.
 * Note: the Response stored in cache is a clone as it can only be read once.
 * @param {*} request
 * @param {*} event
 * @returns A promise that resolves to a Response object
 */
const cacheFirst = async (request, event) => {
  // first, try to get the resource from the cache
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }

  // next, try to get the resource from the network
  let responseFromNetwork;
  try {
    responseFromNetwork = await fetch(request);
  } catch (error) {
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  event.waitUntil(putInCacheSafely(request, responseFromNetwork.clone()));
  return responseFromNetwork;
};

/**------------------------------------------------------------------------------------------------
 * Clean up actions
 -------------------------------------------------------------------------------------------------*/

/**
 * Deletes everything stored in cache that doesn't match the current version.
 * @returns A promise that resolves when the old caches have been deleted
 */
const deleteOldCaches = async () => {
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter((key) => key !== CACHE_NAME);
  if (cachesToDelete.length) {
    await Promise.all(cachesToDelete.map((key) => caches.delete(key)));
  }
};

/**------------------------------------------------------------------------------------------------
 * Events
 -------------------------------------------------------------------------------------------------*/

/**
 * Triggers when the Service Worker has been fetched and registered.
 * It takes care of clearing and adding the new base resources to the cache.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(deleteOldCaches().then(() => precacheResources()));
});

/**
 * Triggers after the Service Worker is installed and it has taken control of the app.
 * It takes care of enabling navigation preload (if supported) and it also takes control of any
 * pages that were controlled by the previous version of the worker (if any).
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim().then(() => deleteOldCaches()));
});

/**
 * Triggers when the app thread makes a network request.
 * It intercepts the request and checks if it can be filled with data from cache. Otherwise, it
 * resumes the network request and then stores it cache for future requests.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(cacheFirst(event.request, event));
});
