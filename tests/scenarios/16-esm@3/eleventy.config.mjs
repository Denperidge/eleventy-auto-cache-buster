import eleventyAutoCacheBuster from "../../../11tyAutoCacheBuster.js";

export default function (eleventyConfig) {
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        enableLogging: true,
        hashTruncate: 16
    });
    eleventyConfig.addPassthroughCopy("assets");
}