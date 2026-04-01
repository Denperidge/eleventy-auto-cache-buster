const eleventyAutoCacheBuster = require("../../../11tyAutoCacheBuster");

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        enableLogging: true,
        hashTruncate: 16
    });
    eleventyConfig.addPassthroughCopy("assets");
}