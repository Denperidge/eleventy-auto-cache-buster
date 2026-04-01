import test from "ava";

import { stripPath } from "../11tyAutoCacheBuster.mjs";

test("strippath works as expected", t => {
    const dirnames = ["_site/", ".my/path/", "site", "././site"];
    for (const dirname of dirnames) {
        const strippedDirname = stripPath(`./${dirname}`);
        t.is(strippedDirname, dirname,
            `Stripped path (${strippedDirname}) !== expected path (${dirname})`)
    }
})