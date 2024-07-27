const fs = require("fs");
const crypto = require("crypto");
const glob = require("glob");

let enableLogging = false;
let algorithm = "md5";

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
    globstring: "**/*.{css,js,png,jpg,jpeg,gif,mp4,ico}",
    hashTruncate: 12,
    enableLogging: enableLogging,
    hashAlgorithm: algorithm,
    hashFunction: hash,
}

module.exports = function(eleventyConfig, options=defaultOptions) {
    eleventyConfig.on("eleventy.after", async ({ dir, results, runMode, outputMode }) => {

        // Override default options with set options
        options = Object.assign(defaultOptions, options);

        const globstring = options.globstring;
        const hashTruncate = options.hashTruncate;
        const hashFunction = options.hashFunction;
        // Set options to globals
        enableLogging = options.enableLogging;
        algorithm = options.hashAlgorithm;

        if (hashTruncate > 0) {
            logRegular(`[ACB] Truncating hash to ${hashTruncate}`);
        } else {
            logRegular(`[ACB] hashTruncate smaller than or equal to 0, disabling truncation`);
        }

        const assetPaths = [];
        logYellow(`[ACB] Collecting assets & calculating hashes using ${globstring}...`);
        (await glob.glob(dir.output + "/" + globstring)).forEach((assetPath) => {
            assetPath = assetPath.replace(/\\/g, "/")
            logGreen(`[ACB] ${assetPath} is an asset! Calculating hash...`);
            const assetHash = hashFunction(fs.readFileSync(assetPath));
            logGreen(`[ACB] ${assetPath} hash = ${assetHash}`);

            assetPaths.push({
                assetPath: assetPath.replace(dir.output + "/", ""),
                assetHash: assetHash
            });
        });

        logYellow(`[ACB] Collected all asset hashes!`);
        logRegular(`[ACB] Replacing in output...`);

        // For every page Eleventy outputs
        results.forEach(({inputPath, outputPath, url, content}) => {
            let outputData = "";  // Assigned later
            let outputChanged = false;  // Check if any hashes have been added

            // Read the output content
            fs.readFile(outputPath, encoding="UTF-8", (err, pageData) => { 
                if (err) {
                    logRed(err);
                    throw err;
                }
                // Save the output data
                outputData = pageData;
                
                assetPaths.forEach(({assetPath, assetHash}) => {
                    if (pageData.includes(assetPath)) {
                        logGreen(`[ACB] ${outputPath} contains asset ${assetPath}`)

                        if (hashTruncate > 0) {
                            assetHash = assetHash.substring(0, hashTruncate);
                        }

                        outputData = outputData.replaceAll(assetPath, `${assetPath}?v=${assetHash}`);
                        outputChanged = true;
                        
                    } else {
                        logRegular(`[ACB] ${outputPath} does NOT contain asset ${assetPath}. Skipping`)                        
                    }
                });

                if (outputChanged) {
                    fs.writeFile(outputPath, outputData, () => {
                        logGreen(`[ACB] Added hashes to ${outputPath}`);
                    });
                }
            });
        });
    });
}
