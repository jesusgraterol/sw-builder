# Service Worker Builder

The `sw-builder` package automates the creation of your Application's Service Worker, which pre-caches your build. This leads to a better overall performance and enables users to access your PWA without an Internet connection.

</br>

## Getting Started

Install the package:

```bash
npm i -D sw-builder
```

Create the `sw-builder.config.json` file in your project's root:

```json
{
  "outDir": "dist",
  "template": "base",
  "cacheNamePrefix": "my-app",
  "includeToPrecache": [
    "/assets"
  ],
  "excludeFilesFromPrecache": [
    "some-ignorable-file.woff2"
  ],
  "excludeMIMETypesFromCache": [
    "application/json",
    "text/plain",
    "text/html"
  ]
}
```

This recommended configuration recursively precaches the hashed files under `/assets` without caching `/` or `index.html`. Precache inputs are exact: `/` is included only when it is explicitly listed in `includeToPrecache`.

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

## Cache lifecycle and request scope

Each build creates a version-specific cache named `<cacheNamePrefix>--<random-suffix>`. The required `cacheNamePrefix` configuration property must contain lowercase alphanumeric tokens separated by single hyphens, such as `my-app` or `customer-dashboard`. Choose an application-specific value, especially when multiple applications use the same origin, so each generated worker cleans up only the caches it owns.

The generated worker uses the safe Service Worker lifecycle:

- `install` populates only the new version's cache and does not call `skipWaiting()`.
- The previous worker and cache remain available to its existing clients while the new worker waits to activate.
- `activate` deletes older caches with the same configured namespace, preserves unrelated and legacy anonymous caches, and then calls `clients.claim()`.
- Runtime lookups read only from the current version's cache.

Only same-origin `GET` requests are intercepted. Other methods and cross-origin requests continue through the browser normally. Successful runtime responses are cached only when they pass the status, opaque-response, partial-content, `Vary`, and MIME safeguards; a cache-write failure is logged without replacing a valid network response.

`includeToPrecache` describes exactly what should be precached. Directories are traversed recursively, filename exclusions still apply, an empty list disables precaching, and the application root `/` is never added implicitly. To precache the application shell, list `/` and/or `/index.html` explicitly.


<br/>

## Using the `firebase-fcm` template

The `firebase-fcm` template includes the same caching behavior as the `base` template and appends
Firebase Cloud Messaging support to the generated Service Worker.

Update your `sw-builder.config.json` file to use the `firebase-fcm` template:

```json
{
  "outDir": "dist",
  "template": "firebase-fcm",
  "cacheNamePrefix": "my-app",
  "includeToPrecache": [],
  "excludeFilesFromPrecache": [],
  "excludeMIMETypesFromCache": [
    "application/json",
    "text/plain",
    "text/html"
  ],
  "firebaseConfigProcessEnvKey": "VITE_FIREBASE_CONFIG",
  "firebaseSdkVersion": "11.0.0"
}
```

Provide the Firebase Web App options as a JSON string in a process environment variable:

```bash
export VITE_FIREBASE_CONFIG='{"options":{"apiKey":"example-api-key","authDomain":"example.firebaseapp.com","projectId":"example-project","storageBucket":"example.firebasestorage.app","messagingSenderId":"123456789012","appId":"1:123456789012:web:example"}}'
```

The Firebase config variable must be available to the Node process when the command runs. Then pass
the environment name to `sw-builder`:

```json
...
"scripts": {
  "build": "tsc -b && vite build && sw-builder --environment='production'"
}
...
```

The `environment` value must be `development`, `staging`, or `production`. It is the only
Firebase-related command argument, and it determines the dotenv file name used by the builder:
`.env`, `.env.staging`, or `.env.production`.

The generated Service Worker imports the Firebase compat SDK scripts from `gstatic` and initializes
Firebase with the provided options. The SDK routes messages to a visible app window without a system
notification. Its background callback shows a system notification when no app window is visible,
including when a window is open but hidden. The default notification uses the `title`, `body`, `icon`,
`badge`, and `url` fields from the message data. Notification click URLs are limited to the same origin
and fall back to the app root URL when missing or unsafe.

An application that needs its own background validation or display policy can append code to the
generated worker and assign `self.swBuilderFcmBackgroundMessageHandler = async (payload) => { ... }`.
The template awaits this handler inside Firebase Messaging's background callback, which runs as part
of the original push event. The application handler owns notification display and must await any
`registration.showNotification()` call. Without the handler, the template displays data-only pushes
and lets Firebase Messaging display notification payloads. Send data-only pushes when the application
must decide whether to display them: Firebase Messaging displays a notification payload before the
application handler runs. Firebase Messaging remains initialized for subscription changes.

<br/>

## Types

<details>
  <summary><code>IBaseConfig</code></summary>
  <br/>
  
  The configuration required to build the `base` template.

  ```typescript
  type IBaseConfig = {
    // the dir path in which the build's output is placed
    outDir: string;

    // the required application-specific cache namespace
    cacheNamePrefix: string;

    // the name of the template that will be generated
    template: "base";

    // the list of asset paths that will be traversed and included in the cache
    includeToPrecache: string[];

    // the list of file names that will be ignored
    excludeFilesFromPrecache: string[];

    // the list of MIME Types that won't be cached when the app sends HTTP GET requests
    excludeMIMETypesFromCache: string[];
  };
  ```
  <br/>
</details>

<details>
  <summary><code>IFirebaseOptions</code> & <code>FirebaseConfigSchema</code></summary>
  <br/>
  
  The options object needed to initialize the Firebase project.

  ```typescript
  type IFirebaseOptions = {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  }

  type FirebaseConfigSchema = {
    options: IFirebaseOptions;
  }
  ```
  <br/>
</details>

<details>
  <summary><code>IFirebaseFcmConfig</code></summary>
  <br/>
  
  The configuration used to build a service working definition that makes use of the `firebase-fcm` template.

  ```typescript
  type IFirebaseFcmConfig = {
    outDir: string;
    cacheNamePrefix: string;
    includeToPrecache: string[];
    excludeFilesFromPrecache: string[];
    excludeMIMETypesFromCache: string[];
    template: "firebase-fcm";
    firebaseConfigProcessEnvKey: string;
    firebaseSdkVersion: string;
  }
  ```
  <br/>
</details>





<br/>

## Built With

- TypeScript





<br/>

## Tests
```bash
# unit and integration tests
npm run test

# unit tests
npm run test:unit

# integration tests
npm run test:integration
```



<br/>

## License

[MIT](https://choosealicense.com/licenses/mit/)
