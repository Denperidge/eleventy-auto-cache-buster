const eleventyAutoCacheBuster = require("../../../11tyAutoCacheBuster");

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        enableLogging: true,
        runAsync: false,
        hashTruncate: 8
    });
    eleventyConfig.addPassthroughCopy("assets");
}