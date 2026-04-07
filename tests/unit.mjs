import { readFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { rm } from "fs/promises";
import { spawn } from "child_process";
import { cwd } from "process";

import test from "ava";
import md5 from "md5-hex";

import { stripPath, hash, writeSync, collectLocalAssets, writeAsync, replaceAssetsInString } from "../11tyAutoCacheBuster.mjs";

const TEST_STRING = "Here is a string! @@\n@@"
const TEST_DIR = cwd() + "/tests/eleventy-test-out/";
const TEST_WRITE_SYNC = TEST_DIR + "sync";
const TEST_WRITE_ASYNC = TEST_DIR + "async";

function testLog(func="logRegular", enableLogging=true, logColour, command=null) {
    return new Promise((resolve, reject) => {
        if (command == undefined) {
            command = `${func}("test"${logColour ? ", " + logColour : ""})`
        }
        command = `echo 'const {_forceLogging, ${func}} = require("./11tyAutoCacheBuster.mjs"); _forceLogging(${enableLogging}); ${command}' | node`;
        spawn(command, {shell: true})
            .stdout.on("data", (data) => { resolve(
                JSON.stringify(
                    data.toString().replace("\n", "")
                ).replace(/^"|"$/g, "")
            )})
            .on("close", () => {
                resolve("");
            });
    })
}

test.before("Create test dir", () => {
    if (!existsSync(TEST_DIR)) {mkdirSync(TEST_DIR);}
});

test.after("Clear test files", t => {
    // Removing before gave issues
    Promise.all([TEST_WRITE_ASYNC, TEST_WRITE_SYNC].map(file => rm(file, {force: true})));
});

test("stripPath works as expected", t => {
    const dirnames = ["_site/", ".my/path/", "site", "././site"];
    for (const dirname of dirnames) {
        const strippedDirname = stripPath(`./${dirname}`);
        t.is(strippedDirname, dirname,
            `Stripped path (${strippedDirname}) !== expected path (${dirname})`)
    }
})

test("hash works as expected", t => {
    const TEST_STRING = "ME21340EZFFOéAAIPFJ6a84e8&A"
    t.is(hash(TEST_STRING), md5(TEST_STRING));
});

test("writeSync works as expected", async t => {
    writeSync(TEST_WRITE_SYNC, TEST_STRING);
    t.is(readFileSync(TEST_WRITE_SYNC, {encoding: "utf-8"}), TEST_STRING);
    return testLog("writeSync", true, undefined, `writeSync("tests/")`).then((data) => {
        t.is(data, "\\u001b[31mTypeError [ERR_INVALID_ARG_TYPE]: The \\\"data\\\" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received undefined\\u001b[0m")
    })
});

test("writeAsync works as expected", async t => {
    return Promise.all([
        writeAsync(TEST_WRITE_ASYNC, TEST_STRING).then(() => {
            t.is(readFileSync(TEST_WRITE_ASYNC, {encoding: "utf-8"}), TEST_STRING);
        }),
        testLog("writeAsync", true, undefined, `writeAsync("tests/", "")`).then((data) => {
            t.is(data, "\\u001b[31mError: EISDIR: illegal operation on a directory, open \'tests/\'\\u001b[0m")
        })
    ]);
});

test("logRegular works as expected", async t => {
    const loggingEnabled = await testLog("logRegular");
    t.deepEqual(loggingEnabled, "test", "Unexpected log output from logRegular");
    const loggingDisabled = await testLog("logRegular", false);
    t.deepEqual(loggingDisabled, "", "Unexpected log output from logRegular");
});


test("logging with colours works as expected", async t => {
    for (const val of [
        ["logRed", 31],
        ["logYellow",33],
        ["logGreen", 32]
    ]) {
        const [func, number]= val;
        const data = await testLog(func);
        const expectedData = `\\u001b[${number}mtest\\u001b[0m`
        t.deepEqual(data, expectedData, "Unexpected log output from " + func)
    
        const loggingDisabled = await testLog("logRegular", false);
        t.deepEqual(loggingDisabled, "", "Unexpected log output from " + func);
    }

    const data = await testLog("_logColour", true, 13);
    const expectedData = `\\u001b[13mtest\\u001b[0m`;
    t.deepEqual(data, expectedData, "Unexpected log output from _logColour");
    const customLoggingDisabled = await testLog("_logColour", false, 13);
    t.deepEqual(customLoggingDisabled, "", "Unexpected log output from _logColour");
})

function readDirectoryFiles(path) {
    return readdirSync(path, {withFileTypes: true}).filter(path => path.isFile()).map(path => path.name);
}

const CLA_TEST_DATA = {
    outputDir: "tests/input/",
    assetDir:  "tests/input/assets",
    assetFiles: readDirectoryFiles("tests/input/assets").map(filename => "tests/input/assets/"+filename).concat(
        readDirectoryFiles("tests/input/assets/subdir").map(name => "tests/input/assets/subdir/" + name)),
};

test("collectLocalAssets works as expected", t => {
    const {outputDir, assetFiles} = CLA_TEST_DATA;

    const collected = collectLocalAssets(assetFiles, outputDir);
    const expected = assetFiles.map(assetPath => {
        return {
            assetPath: assetPath.replace(outputDir, ""),
            assetHash: md5(
                readFileSync(assetPath), {})
        }
    })

    t.deepEqual(expected, collected);
})

test("collectLocalAssets options extensions & hashFunction are applied", t => {
    const {outputDir, assetFiles} = CLA_TEST_DATA;

    const collected = collectLocalAssets(assetFiles, outputDir, ["css", "jpg"], content => {return "testvalue"});
    

    const expected = assetFiles.filter(filename => filename.toLowerCase().endsWith("jpg") || filename.toLowerCase().endsWith("css")).map(assetPath => {
        return {
            assetPath: assetPath.replace(outputDir, ""),
            assetHash: "testvalue"
        }
    })

    t.deepEqual(expected, collected);
});

test("replaceAssetsInString works as expected", t => {
    /** @type {Array<{assetPath: string, assetHash: string}>} */
    const assets = [
        {
            assetPath: "/image.png",
            assetHash: "123"
        },
        {
            assetPath: "/image.jpeg",
            assetHash: "41352"
        },
        {
            assetPath: "/stylesheet.css",
            assetHash: "341"
        },
        {
            assetPath: "/song.mp3",
            assetHash: "3161"
        }
    ];
    const input = `<html><body>
        <img src="${assets[0].assetPath}"/>
        <img src="${assets[1].assetPath}"/>
        <link rel="stylesheet" href="${assets[2].assetPath}">
        <audio src="${assets[3].assetPath}" />
    </body></html>`;
    const expectedOutput = `<html><body>
        <img src="${assets[0].assetPath}?v=${assets[0].assetHash}"/>
        <img src="${assets[1].assetPath}?v=${assets[1].assetHash}"/>
        <link rel="stylesheet" href="${assets[2].assetPath}?v=${assets[2].assetHash}">
        <audio src="${assets[3].assetPath}?v=${assets[3].assetHash}" />
    </body></html>`;
    const actualOutput = replaceAssetsInString(input, "replaceAssetsInString example", assets);
    t.is(expectedOutput, actualOutput);
})