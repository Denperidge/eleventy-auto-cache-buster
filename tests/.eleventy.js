const { env } = require("process");
const eleventyAutoCacheBuster = require("../11tyAutoCacheBuster");

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        enableLogging: true,
        hashTruncate: env.TRUNCATE
    });
    eleventyConfig.addPassthroughCopy("src/assets");
    return {
        dir: {
            input: "src",
            output: "out/" + env.TRUNCATE,
        }
    }
}