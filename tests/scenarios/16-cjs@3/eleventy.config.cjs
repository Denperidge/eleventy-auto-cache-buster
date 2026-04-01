const eleventyAutoCacheBuster = require("../../../11tyAutoCacheBuster.mjs").default;

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        enableLogging: true,
        hashTruncate: 16
    });
    eleventyConfig.addPassthroughCopy("assets");
}