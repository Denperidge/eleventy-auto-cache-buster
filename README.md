# Eleventy-Auto-Cache-Buster
An Eleventy content-hash based cache buster, not requiring any filters or code changes aside from adding the plugin in `.eleventy.js`!

Turn...
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="stylesheet" href="/stylesheet.css">
```
Into...
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico?v=542610a0404a5b8a2f5459c0fc5b9691">
<link rel="stylesheet" href="/stylesheet.css?v=c9ca3e51cf7edc4c86c5fef68361957c">
```

## How-to
### Getting started
1. Install the plugin
    - Yarn: `yarn add -D eleventy-auto-cache-buster`
    - Npm: `npm install --save-dev eleventy-auto-cache-buster`
2. Enable the plugin
    ```js
    // .eleventy.js
    
    const eleventyAutoCacheBuster = require("eleventy-auto-cache-buster");
    
    // Alternatively, you can use ESM
    import eleventyAutoCacheBuster from "eleventy-auto-cache-buster";

    module.exports = function (eleventyConfig) {
        eleventyConfig.addPlugin(eleventyAutoCacheBuster);
        // ...
    }
    ```
    
3. That's it! No further changes are required.

### Changing options
```js
// .eleventy.js
const eleventyAutoCacheBuster = require("eleventy-auto-cache-buster");

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        enableLogging: true,  // Whether to enable eleventy-auto-cache-buster logging.
        hashTruncate: 0,  // Desired substring length of the hash. Set to 0 or lower to disable truncating
        runAsync: false,  // Whether to run asynchronously. Default is true
        globstring: "**/*.ico",  // What glob string is used to locate assets.
        hashAlgorithm: "sha1",  // What hash method to pass to the hash function. See Node.js' crypto.createHash documentation.
        hashFunction: function (content) { return "example" }  // What function to run to calculate hashes. Overrides hashAlgorithm.
    });
    // ...
}
```


## License
This project is licensed under the [MIT License](LICENSE).
