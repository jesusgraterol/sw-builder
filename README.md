# Service Worker Builder

The `sw-builder` package automates the creation of your Application's Service Worker, which pre-caches your build. This leads to a better overall performance and enables users to access your PWA without an Internet connection.

</br>

## Getting Started

Install the package:
```bash
npm install -D sw-builder
```

Create the `sw-builder.config.json` file in your project's root:
```json
{
  "outDir": "dist",
  "template": "base",
  "includeToPrecache": [
    "/assets",
    "/some-other-dir",
    "/index.html",
    "/logo.png",
    "/splash.png"
  ],
  "excludeFilesFromPrecache": [
    "some-ignorable-file.woff2"
  ],
  "excludeMIMETypesFromCache": [
    "application/json",
    "text/plain"
  ]
}
```

Include the `sw-builder` binary in your `package.json` file:
```json
...
"scripts": {
  "build": "tsc -b && vite build && sw-builder",
  
  // specify a custom path for the configuration file
  "build": "tsc -b && vite build && sw-builder --config='sw-custom.config.json'",
}
...
```


<br/>

If you are using [Vite](https://vitejs.dev/) include an empty `sw.js` file in your `public` directory so you can test the Service Worker's Registration while developing.




<br/>

## Types

<details>
  <summary><code>IBaseConfig</code></summary>
  
  The configuration required to build the 'base' template. This type should be turned into a discriminated union once more templates are introduced.
  ```typescript
  type IBaseConfig = {
    // the dir path in which the build's output is placed
    outDir: string;

    // the name of the template that will be generated
    template: ITemplateName;

    // the list of asset paths that will be traversed and included in the cache
    includeToPrecache: string[];

    // the list of file names that will be ignored
    excludeFilesFromPrecache: string[];

    // the list of MIME Types that won't be cached when the app sends HTTP GET requests
    excludeMIMETypesFromCache: string[];
  };
  ```
</details>




<br/>

## Templates

<details>
  <summary><code>base</code></summary>
  
  The list of templates supported by the sw-builder.
  ```javascript
  /* ************************************************************************************************
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
    || EXCLUDE_MIME_TYPES.every((type) => !contentTypeHeader.includes(type))
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
    request.method === 'GET'
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
    event.waitUntil(Promise.all([
      addResourcesToCache(PRECACHE_ASSETS),
      deleteOldCaches(),
    ]));
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
  ```
</details>




<br/>

## Built With

- TypeScript





<br/>

## Running the Tests
```bash
# unit tests
npm run test:unit

# integration tests
npm run test:integration
```



<br/>

## License

[MIT](https://choosealicense.com/licenses/mit/)





<br/>

## Deployment

Install dependencies:
```bash
npm install
```

Build the project:
```bash
npm start
```

Publish to `npm`:
```bash
npm publish
```
