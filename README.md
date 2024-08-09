# Service Worker Builder

The `sw-builder` package automates the creation of your Application's Service Worker, which pre-caches your build. This leads to a better overall performance and enables users to access your PWA without an Internet connection.

</br>

## Getting Started

Install the package:
```bash
$ npm install -D sw-builder
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
  "build": "tsc && ... && sw-builder",
  
  // specify a custom path for the configuration file
  "build": " tsc && ... && sw-builder --config='sw-custom.config.json'",
}
...
```


<br/>

If you are using [Vite](https://vitejs.dev/) include an empty `sw.js` file in your `public` directory so you can test the Service Worker's Registration while developing.




<br/>

## Built With

- TypeScript





<br/>

## Running the Tests
```bash
# Unit Tests
$ npm run test:unit

# Integration Tests
$ npm run test:integration
```



<br/>

## License

[MIT](https://choosealicense.com/licenses/mit/)





<br/>

## Acknowledgments

- [Service Worker API | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Introduction to Service Workers | PWAbuilder](https://docs.pwabuilder.com/#/home/sw-intro)
- [Service workers | web.dev](https://web.dev/learn/pwa/service-workers)





<br/>

## Deployment

Install dependencies:
```bash
$ npm install
```

Build the project:
```bash
$ npm start
```

Publish to `npm`:
```bash
$ npm publish
```
