const { env } = require("process");
const eleventyAutoCacheBuster = require("../11tyAutoCacheBuster");

module.exports = function (eleventyConfig) {
    const runAsync = Boolean(parseInt(env.RUNASYNC));  // Boolean("0") == true, Boolean(parseInt("0")) == false
    const useServe = Boolean(parseInt(env.USESERVE));
    const hashTruncate = env.HASHTRUNCATE;
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        enableLogging: true,
        runAsync: runAsync,
        hashTruncate: hashTruncate
    });
    eleventyConfig.addPassthroughCopy("src/assets");
    return {
        dir: {
            input: "src",
            output: `out/${hashTruncate}-${runAsync ? "async" : "sync"}-${useServe ? "build" : "serve"}`,
        }
    }
}