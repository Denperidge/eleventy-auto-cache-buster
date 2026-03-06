`use strict`;

const eleventyAutoCacheBuster          = require('../../../11tyAutoCacheBuster.js');
const eleventyPluginFilesMinifier      = require('@codestitchofficial/eleventy-plugin-minify');

const siteURL    = `https://my.web.site`;

module.exports = async function(eleventyConfig) {

  // Require layout file extensions; see
  // https://www.11ty.dev/docs/layouts/#omitting-the-layouts-file-extension
  eleventyConfig.setLayoutResolution(false);

  // Copy assets to build directory
  eleventyConfig.addPassthroughCopy(`src/assets/images`);

  // Sort blog entries
  function sortByPubDate(values) {
    let vals = [...values];     // this *seems* to prevent collection mutation...
    return vals.sort((a, b) => Math.sign(a.data.pubdate - b.data.pubdate));
  }

  eleventyConfig.addFilter(`sortByPubDate`, sortByPubDate);

  // Cache busting
  eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
    extensions: [`css`, `js`, `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `mp4`, `ico` ]
  });

  // HTML minification
  eleventyConfig.addPlugin(eleventyPluginFilesMinifier);

  // Set custom directory for input; otherwise use defaults
  return {
    // Site URL
    url: siteURL,
    // When a passthrough file is modified, rebuild the pages:
    passthroughFileCopy: true,
    // Copy any file in these formats:
    templateFormats: [`html`, `njk`, `md`, `js`, `woff2`],
    markdownTemplateEngine: `njk`,
    htmlTemplateEngine: `njk`,
    dataTemplateEngine: `njk`,
    // Set up directory structure:
    dir: {
      input: `src`,
    },
  };
};
