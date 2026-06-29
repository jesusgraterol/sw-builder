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
    "text/plain",
    "text/html"
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

## Using the `firebase-fcm` template

The `firebase-fcm` template includes the same caching behavior as the `base` template and appends
Firebase Cloud Messaging support to the generated Service Worker.

Update your `sw-builder.config.json` file to use the `firebase-fcm` template:

```json
{
  "outDir": "dist",
  "template": "firebase-fcm",
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

The generated Service Worker imports the Firebase compat SDK scripts from `gstatic`, initializes the
Firebase app with the provided options, and handles background messages. When app clients are open,
messages are posted to them as `{ type: 'PUSH_MESSAGE', data }`. When no app client is open, the
Service Worker shows a notification using the `title`, `body`, `icon`, `badge`, and `url` fields from
the message data. Notification click URLs are limited to the same origin and fall back to the app root
URL when missing or unsafe.

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
