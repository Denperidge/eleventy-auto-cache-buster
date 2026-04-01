const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");
const glob   = require("glob");

const regexEscape = parseInt(process.versions.node.split(".")[0]) >= 24 
    ? RegExp.escape 
    : require("escape-string-regexp").default;

let enableLogging = false;
let algorithm     = "md5";
let hashTruncate  = 12;
let hashFunction;

function hash(content) {
    const currentHash = crypto.createHash(algorithm);
    currentHash.setEncoding("hex");
    currentHash.write(content);
    currentHash.end();
    return currentHash.read();
}

function logRegular(string) {
    if (enableLogging) {
        console.log(string);
    }
}

function _logColour(string, colourCode) {
    if (enableLogging) {
        console.log(`\x1b[${colourCode}m${string} \x1b[0m`);
    }
}

function logGreen(string) {
    _logColour(string, "32");
}

function logYellow(string) {
    _logColour(string, "33");
}

function logRed(string) {
    _logColour(string, "31");
}

const defaultOptions = {
    globstring:    "**/*",
    globOptions:   {nodir: true},
    extensions:    ["css", "js", "png", "jpg", "jpeg", "gif", "mp4", "ico"],
    hashTruncate:  12,
    runAsync:      true,
    enableLogging: enableLogging,
    hashAlgorithm: algorithm,
    hashFunction:  hash,
}

function collectLocalAssets(globResults=[], outputDir, extensions=defaultOptions.extensions) {
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

        assetPaths.push({
            assetPath: assetPath.replace(outputDir + "/", ""),
            assetHash: assetHash
        });
    });

    logYellow(`[ACB] Collected all asset hashes!`);
    return assetPaths;
}

function writeSync(outputPath, outputData) {
    try {
        fs.writeFileSync(outputPath, outputData);
        logGreen(`[ACB] Added hashes to ${outputPath}`);
    } catch (err) {
        logRed(err);
    }
}

function writeAsync(outputPath, outputData) {
    fs.writeFile(outputPath, outputData, () => {
        logGreen(`[ACB] Added hashes to ${outputPath}`);
    });
}

function replaceAssetsInFile(fileData, filePath, assetPathsAndHashes, writeFunc) {
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

// Meant to normalise eleventt.after directories.output to dir.output style
function stripPath(path) {
    return path.replace(/^\.\//m, "");
}

module.exports = function(eleventyConfig, options=defaultOptions) {
    // Override default options with set options
    options = Object.assign(defaultOptions, options, {
        // Object.assign seems to overwrite nested objects. @emiliorcueto added the clever handling below
        globOptions: Object.assign(defaultOptions.globOptions, options.globOptions) // -- ensure `nodir` is always set
    });
    const { globstring, globOptions, extensions, runAsync }  = options;
    // Set options to globals
    enableLogging     = options.enableLogging;
    hashTruncate      = options.hashTruncate;
    hashFunction      = options.hashFunction;
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
            const assetPathsAndHashes = collectLocalAssets(await glob.glob(outputDir + "/" + globstring, globOptions), outputDir, extensions);

            logRegular(`[ACB] Replacing in output...`);
            results.forEach(({inputPath, outputPath, url, content}) => {
                if (!globOptions.ignore?.includes(outputPath)) { // -- Do not attempt to read explicitly ignored files as they may no longer exist!
                    fs.readFile(outputPath, encoding="UTF-8", (err, pageData) => { 
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
                    const pageData = fs.readFileSync(outputPath, encoding="UTF-8"); 
                    // Save the output data
                    replaceAssetsInFile(pageData, outputPath, assetPathsAndHashes, writeSync);
                }
            });
        });
    }
}

this.functions = {
    _logColour, logRegular, logGreen, logRed, logYellow,
    hash,
    writeSync, writeAsync,
    collectLocalAssets,
    replaceAssetsInFile,
    stripPath
}
