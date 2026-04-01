const eleventyAutoCacheBuster = require("../../../11tyAutoCacheBuster.mjs").default;

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        enableLogging: true,
        runAsync: true,
        hashTruncate: 8
    });
    eleventyConfig.addPassthroughCopy("assets");
}