const eleventyAutoCacheBuster = require("../../../11tyAutoCacheBuster");

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        enableLogging: true,
    });
    eleventyConfig.addPassthroughCopy("src/assets");
}