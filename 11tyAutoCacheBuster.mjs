import fs            from "fs";
import { writeFile } from "fs/promises" 
import path          from "path";
import crypto        from "crypto";
import * as glob     from "glob";

/* ----- Defaults & globals ----- */
let enableLogging = false;
let algorithm     = "md5";
let hashTruncate  = 12;

const defaultOptions = {
    globstring:    "**/*",
    globOptions:   {nodir: true},
    extensions:    ["css", "js", "png", "jpg", "jpeg", "gif", "mp4", "ico"],
    runAsync:      true,
    hashTruncate:  hashTruncate,
    enableLogging: enableLogging,
    hashAlgorithm: algorithm,
    hashFunction:  hash,
}

/* ----- Functions ----- */
/**
 * Sanitise a string (particularly, a filepath) for Regex usage
 * 
 * De-facto polyfill until Node 22 is EOL,
 * copied into a one-liner to reduce NPM dependencies
 * @author
 * License: Sindre Sorhus - MIT, see NOTICE file
 * Source: https://github.com/sindresorhus/escape-string-regexp
 * 
 * @param {string} string String to sanitise
 */
export function regexEscape(string) {
    return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

// Meant to normalise eleventt.after directories.output to dir.output style
//./_site/ -> _site/
export function stripPath(path) {
    return path.replace(/^\.\//m, "");
}

/**
 * Wrapper function for using Node.JS's crypto
 * functionality with encoding set to hex
 * The hash algorithm is "md5" by default
 * 
 * @param {string} content File contents to hash
 * @returns {string} Hash from file contents
 */
export function hash(content) {
    const currentHash = crypto.createHash(algorithm);
    currentHash.setEncoding("hex");
    currentHash.write(content);
    currentHash.end();
    return currentHash.read();
}

// Made for testing use
export function _forceLogging(enable=true) {
    enableLogging = enable;
};

/**
 * If logging is enabled, log to console
 * @param {string} message 
 */
export function logRegular(message) {
    if (enableLogging) {
        console.log(message);
    }
}

/**
 * If logging is enabled, log to console
 * using the ANSI color escape sequence
 * with the passed colourCode
 * 
 * @param {string} message Message to log
 * @param {number} colourCode ANSI color code (e.g. 31)
 */
export function _logColour(message, colourCode) {
    if (enableLogging) {
        console.log(`\x1b[${colourCode}m${message}\x1b[0m`);
    }
}

/**
 * If logging is enabled, log message in red
 * This is mostly used for individual, file-based steps
 * 
 * @param {string} message 
 */
export function logGreen(message) {
    _logColour(message, "32");
}

/**
 * If logging is enabled, log message in red
 * This is mostly used for logging what phase/grand step ACB is
 * 
 * @param {string} message
 */
export function logYellow(message) {
    _logColour(message, "33");
}

/**
 * If logging is enabled, log message in red
 * This is mostly used for error logs
 * 
 * @param {string} message Message to log 
 */
export function logRed(message) {
    _logColour(message, "31");
}

export function writeSync(outputPath, outputData) {
    try {
        fs.writeFileSync(outputPath, outputData);
        logGreen(`[ACB] Added hashes to ${outputPath}`);
    } catch (err) {
        logRed(err);
    }
}

export function writeAsync(outputPath, outputData) {
    return writeFile(outputPath, outputData, {encoding: "utf-8"}).then(() => {
        logGreen(`[ACB] Added hashes to ${outputPath}`);
    }).catch(err => {
        logRed(err);
    })
}

/**
 * 
 * @param {Array<string>} globResults - Relative filepaths from & including output dir (for example: ["_site/eleventy-test-out/test/index.html"])
 * @param {string} - Relative path to Eleventy output directory (for example: _site)
 * @param {Array<string>} extensions - Extensions to look for (for example: ["css", "js"]) 
 * @param {function} hashFunction - Function that takes a string and returns a content hash
 * @see defaultOptions for the default extensions & hashFunction
 * @returns {Array<{assetPath: string, assetHash: string}>} For example: [{assetPath: "assets/example.js", assetHash: "8e6b95c8c4091239f9394ed47cf21ad3"}]
 */
export function collectLocalAssets(globResults=[], outputDir, extensions=defaultOptions.extensions, hashFunction=defaultOptions.hashFunction) {
    const assetPaths = [];
    globResults.forEach((assetFullPath) => {
        assetFullPath = assetFullPath.replace(/\\/g, "/");
        const assetPath = assetFullPath.replace(outputDir, "") 
        
        if (!extensions.includes(path.extname(assetPath).substring(1))) {
            return;
        }

        logGreen(`[ACB] ${assetPath} is an asset! Calculating hash...`);
        const assetHash = hashFunction(fs.readFileSync(assetFullPath));
        logGreen(`[ACB] ${assetPath} hash = ${assetHash}`);

        assetPaths.push({ assetPath, assetHash });
    });

    logYellow(`[ACB] Collected all asset hashes!`);
    return assetPaths;
}

export function replaceAssetsInFile(fileData, filePath, assetPathsAndHashes, writeFunc) {
    let outputString  = fileData;
    let outputChanged = false;  // Check if any hashes have been added
    assetPathsAndHashes.forEach(({assetPath, assetHash}) => {
        // Optionally truncate
        if (hashTruncate > 0) {
            assetHash = assetHash.substring(0, hashTruncate);
        }
        // find and replace all instances of the asset URL
        const assetPathRegexString = regexEscape(assetPath);
        const regexWithQueryString = new RegExp(`${assetPathRegexString}\\?`, 'g')
        const regexWithoutQueryString = new RegExp(`${assetPathRegexString}(?!\\?)`, 'g')
        const newOutputString = outputString
            .replaceAll(regexWithQueryString, `${assetPath}?v=${assetHash}&`)
            .replaceAll(regexWithoutQueryString, `${assetPath}?v=${assetHash}`);
        // If anything was replaced, track that to write the file after all asset checks
        if (newOutputString != outputString) {
            logGreen(`[ACB] ${filePath} contains asset ${assetPath}`)
            outputChanged = true;
            outputString = newOutputString;
        } else {
            logRegular(`[ACB] ${filePath} does NOT contain asset ${assetPath}. Skipping`)   
        }
    })
    if (outputChanged) {
        writeFunc(filePath, outputString);
    }
}

/* ----- Main/plugin ----- */
export default function(eleventyConfig, options=defaultOptions) {
    // Override default options with set options
    options = Object.assign(defaultOptions, options, {
        // Object.assign seems to overwrite nested objects. @emiliorcueto added the clever handling below
        globOptions: Object.assign(defaultOptions.globOptions, options.globOptions) // -- ensure `nodir` is always set
    });
    const { globstring, globOptions, extensions, runAsync, hashFunction }  = options;
    // Set options to globals
    enableLogging     = options.enableLogging;
    hashTruncate      = options.hashTruncate;
    algorithm         = options.hashAlgorithm;
    

    // Setup
    if (hashTruncate > 0) {
        logRegular(`[ACB] Truncating hash to ${hashTruncate}`);
    } else {
        logRegular(`[ACB] hashTruncate smaller than or equal to 0, disabling truncation`);
    }

    if (runAsync) {
        eleventyConfig.on("eleventy.after", async ({ directories, results, runMode, outputMode }) => {
            const outputDir = stripPath(directories.output);
            logYellow(`[ACB] Collecting assets & calculating hashes using ${globstring} in ${outputDir}...`);
            const assetPathsAndHashes = collectLocalAssets(await glob.glob(outputDir + "/" + globstring, globOptions), outputDir, extensions, hashFunction);

            logRegular(`[ACB] Replacing in output...`);
            results.forEach(({inputPath, outputPath, url, content}) => {
                if (!globOptions.ignore?.includes(outputPath)) { // -- Do not attempt to read explicitly ignored files as they may no longer exist!
                    fs.readFile(outputPath, { encoding: "UTF-8" }, (err, pageData) => { 
                        if (err) {
                            logRed(err);
                            throw err;
                        }
                        // Save the output data
                        replaceAssetsInFile(pageData, outputPath, assetPathsAndHashes, writeAsync);
                    });
                }
            });
        });
    } else {
        eleventyConfig.on("eleventy.after", ({ directories, results, runMode, outputMode }) => {
            const outputDir = stripPath(directories.output);
            logYellow(`[ACB] Collecting assets & calculating hashes using ${globstring}...`);
            const assetPathsAndHashes = collectLocalAssets(glob.globSync(outputDir + "/" + globstring, globOptions), outputDir, extensions);

            logRegular(`[ACB] Replacing in output...`);
            results.forEach(({inputPath, outputPath, url, content}) => {
                if (!globOptions.ignore?.includes(outputPath)) { // -- Do not attempt to read explicitly ignored files as they may no longer exist!
                    const pageData = fs.readFileSync(outputPath, { encoding: "UTF-8" }); 
                    // Save the output data
                    replaceAssetsInFile(pageData, outputPath, assetPathsAndHashes, writeSync);
                }
            });
        });
    }
}
