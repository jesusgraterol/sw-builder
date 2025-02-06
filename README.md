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

- [`base(base-template.sw.js`)](https://github.com/jesusgraterol/sw-builder/blob/main/src/template/templates/base-template.sw.js)





<br/>

## Built With

- TypeScript





<br/>

## Tests
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
