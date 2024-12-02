const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const glob = require("glob");

let enableLogging = false;
let algorithm = "md5";
let hashTruncate = 12;
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
    globstring: "**/*",
    extensions: ["css", "js", "png", "jpg", "jpeg", "gif", "mp4", "ico"],
    hashTruncate: 12,
    runAsync: true,
    enableLogging: enableLogging,
    hashAlgorithm: algorithm,
    hashFunction: hash,
}

function collectLocalAssets(globResults=[], outputDir, extensions=defaultOptions.extensions) {
    const assetPaths = [];
    globResults.forEach((assetPath) => {
        assetPath = assetPath.replace(/\\/g, "/")
        if (!extensions.includes(path.extname(assetPath).substring(1))) {
            return;
        }

        logGreen(`[ACB] ${assetPath} is an asset! Calculating hash...`);
        const assetHash = hashFunction(fs.readFileSync(assetPath));
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
    let outputString = fileData;
    let outputChanged = false;  // Check if any hashes have been added

    // Check for every asset
    assetPathsAndHashes.forEach(({assetPath, assetHash}) => {
        if (fileData.includes(assetPath)) {
            logGreen(`[ACB] ${filePath} contains asset ${assetPath}`)

            // Optionally truncate
            if (hashTruncate > 0) {
                assetHash = assetHash.substring(0, hashTruncate);
            }

            // Replace asset path with asset path with hash
            outputString = outputString.replaceAll(assetPath, `${assetPath}?v=${assetHash}`);
            // Write changes to file
            outputChanged = true;
        } else {
            logRegular(`[ACB] ${filePath} does NOT contain asset ${assetPath}. Skipping`)                        
        }
    });

    if (outputChanged) {
        writeFunc(filePath, outputString);
    }

}

module.exports = function(eleventyConfig, options=defaultOptions) {
    // Override default options with set options
    options = Object.assign(defaultOptions, options);
    const globstring = options.globstring;
    const extensions = options.extensions;
    const runAsync = options.runAsync;
    // Set options to globals
    enableLogging = options.enableLogging;
    hashTruncate = options.hashTruncate;
    hashFunction = options.hashFunction;
    algorithm = options.hashAlgorithm;
    

    // Setup
    if (hashTruncate > 0) {
        logRegular(`[ACB] Truncating hash to ${hashTruncate}`);
    } else {
        logRegular(`[ACB] hashTruncate smaller than or equal to 0, disabling truncation`);
    }

    if (runAsync) {
        eleventyConfig.on("eleventy.after", async ({ dir, results, runMode, outputMode }) => {
            logYellow(`[ACB] Collecting assets & calculating hashes using ${globstring}...`);
            const assetPathsAndHashes = collectLocalAssets(await glob.glob(dir.output + "/" + globstring, {nodir: true}), dir.output, extensions);

            logRegular(`[ACB] Replacing in output...`);
            results.forEach(({inputPath, outputPath, url, content}) => {
                fs.readFile(outputPath, encoding="UTF-8", (err, pageData) => { 
                    if (err) {
                        logRed(err);
                        throw err;
                    }
                    // Save the output data
                    replaceAssetsInFile(pageData, outputPath, assetPathsAndHashes, writeAsync);
                });
            });
        });
    } else {
        eleventyConfig.on("eleventy.after", ({ dir, results, runMode, outputMode }) => {
            logYellow(`[ACB] Collecting assets & calculating hashes using ${globstring}...`);
            const assetPathsAndHashes = collectLocalAssets(glob.globSync(dir.output + "/" + globstring, {nodir: true}), dir.output, extensions);

            logRegular(`[ACB] Replacing in output...`);
            results.forEach(({inputPath, outputPath, url, content}) => {
                const pageData = fs.readFileSync(outputPath, encoding="UTF-8"); 
                // Save the output data
                replaceAssetsInFile(pageData, outputPath, assetPathsAndHashes, writeSync);
            });
        });
    }

}
