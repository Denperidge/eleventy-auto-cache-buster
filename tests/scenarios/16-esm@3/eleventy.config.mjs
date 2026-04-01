import eleventyAutoCacheBuster from "../../../11tyAutoCacheBuster.mjs";

export default function (eleventyConfig) {
    eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
        enableLogging: true,
        hashTruncate: 16
    });
    eleventyConfig.addPassthroughCopy("assets");
}