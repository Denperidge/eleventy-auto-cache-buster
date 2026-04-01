import { readFileSync } from "fs";
import { readFile, rm } from "fs/promises";
import { spawn } from "child_process";

import test from "ava";
import md5 from "md5";

import { stripPath, hash, writeSync, logRed } from "../11tyAutoCacheBuster.mjs";

const TEST_STRING = "Here is a string! @@\n@@"
const TEST_DIR = "tests/eleventy-test-out/";
const TEST_WRITE_SYNC = TEST_DIR + "sync";
const TEST_WRITE_ASYNC = TEST_DIR + "async";

function testLog(logFunc="logRegular", message="test", enableLogging=true, logColour) {
    return new Promise((resolve, reject) => {
        spawn(`echo 'const {_forceLogging, ${logFunc}} = require("./11tyAutoCacheBuster.mjs"); _forceLogging(${enableLogging}); ${logFunc}("${message}"${logColour ? ", "+logColour : ""})' | node`, {shell: true})
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

test.before("Clear test files", t => {
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
    t.is(hash(TEST_STRING), md5(TEST_STRING))
});

test("writeSync works as expected", t => {
    writeSync(TEST_WRITE_SYNC, TEST_STRING);
    t.is(readFileSync(TEST_WRITE_SYNC, {encoding: "utf-8"}), TEST_STRING);
});

test("logRegular works as expected", async t => {
    const loggingEnabled = await testLog("logRegular", "test");
    t.deepEqual(loggingEnabled, "test", "Unexpected log output from logRegular");
    const loggingDisabled = await testLog("logRegular", "test", false);
    t.deepEqual(loggingDisabled, "", "Unexpected log output from logRegular");
});


test("logging with colours works as expected", async t => {
    for (const val of [
        ["logRed", 31],
        ["logYellow",33],
        ["logGreen", 32]
    ]) {
        const [func, number]= val;
        const data = await testLog(func, "test");
        const expectedData = `\\u001b[${number}mtest\\u001b[0m`
        t.deepEqual(data, expectedData, "Unexpected log output from " + func)
    
        const loggingDisabled = await testLog("logRegular", "test", false);
        t.deepEqual(loggingDisabled, "", "Unexpected log output from " + func);
    }

    const data = await testLog("_logColour", "test", true, 13);
    const expectedData = `\\u001b[13mtest\\u001b[0m`;
    t.deepEqual(data, expectedData, "Unexpected log output from _logColour");
    const customLoggingDisabled = await testLog("_logColour", "test", false, 13);
    t.deepEqual(customLoggingDisabled, "", "Unexpected log output from _logColour");
})
