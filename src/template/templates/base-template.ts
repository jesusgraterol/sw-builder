

/* ************************************************************************************************
 *                                         IMPLEMENTATION                                         *
 ************************************************************************************************ */
const BASE_TEMPLATE: string = `/* ************************************************************************************************
*                                           CONSTANTS                                            *
************************************************************************************************ */

// the current version of the cache
const CACHE_NAME = '';

// assets that will be cached once the service worker is installed
const PRECACHE_ASSETS = [];

// the list of MIME Types that won't be cached when the app sends HTTP GET requests
const EXCLUDE_MIME_TYPES = [];





/* ************************************************************************************************
*                                       MAIN CACHE ACTIONS                                       *
************************************************************************************************ */

/**
* Adds the given list of resource URLs to the cache.
* @param {*} resources
* @returns Promise<void>
*/
const addResourcesToCache = async (resources) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(resources);
};

/**
 * Verifies if the value of the 'Accept' or 'Content-Type' header is cacheable.
 * @param {*} contentTypeHeader
 * @returns boolean
 */
const isMIMETypeCacheable = (contentTypeHeader) => (
  contentTypeHeader === null
  || !EXCLUDE_MIME_TYPES.some((type) => contentTypeHeader.includes(type))
);

/**
* All requests should be cached except for:
* - Non-GET requests
* - Requests with MIME Types that are not included in EXCLUDE_MIME_TYPES
* @param {*} request
* @param {*} response
* @returns boolean
*/
const canRequestBeCached = (request, response) => (
  request.ok
  && request.method === 'GET'
  && response.type !== 'opaque'
  && isMIMETypeCacheable(request.headers.get('accept'))
  && isMIMETypeCacheable(response.headers.get('content-type'))
);

/**
* Adds the request and its response to the cache.
* @param {*} request
* @param {*} response
* @returns Promise<void>
*/
const putInCache = async (request, response) => {
  if (canRequestBeCached(request, response)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
  }
};

/**
* Intercepts the fetch requests and attempts to fill them with data from the cache. If not present,
* it will perform the request and store the data in cache.
* Note: the Response stored in cache is a clone as it can only be read once.
* @param {*} request
* @returns Promise<Response>
*/
const cacheFirst = async (request) => {
  // first, try to get the resource from the cache
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }

  // next, try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request);
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};





/* ************************************************************************************************
*                                     CACHE CLEAN UP ACTIONS                                     *
************************************************************************************************ */

/**
* Deletes everything stored in cache that doesn't match the current version.
* @returns Promise<void>
*/
const deleteOldCaches = async () => {
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter((key) => key !== CACHE_NAME);
  if (cachesToDelete.length) {
    await Promise.all(cachesToDelete.map((key) => caches.delete(key)));
  }
};





/* ************************************************************************************************
*                                             EVENTS                                             *
************************************************************************************************ */

/**
* Triggers when the Service Worker has been fetched and registered.
* It takes care of clearing and adding the new base resources to the cache.
*/
self.addEventListener('install', (event) => {
  event.waitUntil(deleteOldCaches().then(() => addResourcesToCache(PRECACHE_ASSETS)));
});

/**
* Triggers after the Service Worker is installed and it has taken control of the app.
* It takes care of enabling navigation preload (if supported) and it also takes control of any
* pages that were controlled by the previous version of the worker (if any).
*/
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    deleteOldCaches(),
  ]));
});

/**
* Triggers when the app thread makes a network request.
* It intercepts the request and checks if it can be filled with data from cache. Otherwise, it
* resumes the network request and then stores it cache for future requests.
*/
self.addEventListener('fetch', (event) => {
  event.respondWith(cacheFirst(event.request));
});
`;





/* ************************************************************************************************
 *                                         MODULE EXPORTS                                         *
 ************************************************************************************************ */
export {
  BASE_TEMPLATE,
};
