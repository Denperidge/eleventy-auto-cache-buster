`use strict`;

const eleventyAutoCacheBuster          = require('eleventy-auto-cache-buster');
const { minify: htmlmin }              = require(`html-minifier-terser`);

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
  // HTML minification
  async function do_minifyhtml(source, output_path) {
      if(!output_path.endsWith(".html")) return source;

      const result = await htmlmin(source, {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          continueOnParseError: true,
          decodeEntities: true,
          keepClosingSlash: true,
          minifyCSS: true,
          quoteCharacter: `"`,
          removeComments: false,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: false,
          caseSensitive: true
      });

      console.log(`MINIFY ${output_path}`, source.length, `→`, result.length, `(${((1 - (result.length / source.length)) * 100).toFixed(2)}% reduction)`);

      return result;
  }

  // Cache busting fails if this transform runs.
  // Comment next line to see successful cache busting.
  eleventyConfig.addTransform(`htmlmin`, do_minifyhtml);

  // Cache busting
  eleventyConfig.addPlugin(eleventyAutoCacheBuster, {
    extensions: [`css`, `js`, `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `mp4`, `ico` ]
  });

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
