const fs = require("fs");
const crypto = require("crypto");
const glob = require("glob");

function hash(content, algorithm="md5") {
    const currentHash = crypto.createHash(algorithm);
    currentHash.setEncoding("hex");
    currentHash.write(content);
    currentHash.end();
    return currentHash.read();
}

function logRegular(string) {
    console.log(string);
}

function _logColour(string, colourCode) {
    console.log(`\x1b[${colourCode}m${string} \x1b[0m`);
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


module.exports = function(eleventyConfig, globstring="**/*.{css,js,png,jpg,jpeg,gif,mp4,ico}") {
    eleventyConfig.on("eleventy.after", async ({ dir, results, runMode, outputMode }) => {
        const assetPaths = [];
        logYellow(`[ACB] Collecting assets & calculating hashes using ${globstring}...`);
        (await glob.glob(dir.output + "/" + globstring)).forEach((assetPath) => {
            assetPath = assetPath.replace(/\\/g, "/")
            logGreen(`[ACB] ${assetPath} is an asset! Calculating hash...`);
            const assetHash = hash(fs.readFileSync(assetPath));
            logGreen(`[ACB] ${assetPath} hash = ${assetHash}`);

            assetPaths.push({
                assetPath: assetPath.replace(dir.output, ""),
                assetHash: assetHash
            });
        });

        logYellow(`[ACB] Collected all asset hashes!`);
        logRegular(`[ACB] Replacing in output...`);

        // For every file Eleventy outputs
        results.forEach(({inputPath, outputPath, url, content}) => {
            let outputData = "";  // Assigned later
            let outputChanged = false;  // Check if any hashes have been added

            // Read the output content
            fs.readFile(outputPath, encoding="UTF-8", (err, data) => { 
                if (err) {
                    logRed(err);
                    throw err;
                }
                // Save the output data
                outputData = data;

                
                assetPaths.forEach(({assetPath, assetHash}) => {
                    if (data.includes(assetPath)) {
                        logGreen(`[ACB] ${outputPath} contains asset ${assetPath}`)
                        outputData = outputData.replace(assetPath, assetPath + "?v=" + assetHash);
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
