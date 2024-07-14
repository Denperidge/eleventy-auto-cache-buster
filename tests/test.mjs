import test from "ava";
import { readFileSync, rmSync } from "fs";
import { execSync } from "child_process";
import { JSDOM } from "jsdom";

// Build utils
rmSync("out/", { recursive: true })

function buildEleventy(truncate=16) {
	// I tried using Eleventy programmatically. Emphasis on tried
	execSync("npx @11ty/eleventy", { env: { TRUNCATE:truncate }});
	const outputHtml = readFileSync(`out/${truncate}/test/index.html`, { encoding: "utf-8" });
	const dom = (new JSDOM(outputHtml));
	return dom.window.document;
}


// Helpers
function _getAttribute(document, id, attribute) {
	return document.getElementById(id).getAttribute(attribute);
}

function hash(string) {
	const paramIndex = string.indexOf("?v=");
	if (paramIndex < 0) {
		throw new Error("Hash could not be found in " + string);
	}
	return string.substring(paramIndex + 3)
}
function href(document, id) {
	return _getAttribute(document, id, "href");
}

// Tests
// "1css & 3css hrefs =/=, hashes =="
const differentHrefsDifferentHashes = test.macro({
	exec(t, document, id1, id2) {
		t.notDeepEqual(href(document, id1), href(document, id2))
		t.notDeepEqual(hash(href(document, id1)), hash(href(document, id2)))
	},
	title(providedTitle = "", document, id1, id2) {
		return `${providedTitle} ${id1}.href =/= ${id2}.href, ${id1}.hash =/= ${id2}.hash`;
	}
});

// "1css & 2css hrefs =/=, hashes =="
const differentHrefSameHashes = test.macro({
	exec(t, document, id1, id2){
		t.notDeepEqual(href(document, id1), href(document, id2))
		t.deepEqual(hash(href(document, id1)), hash(href(document, id2)))
	}, 
	title(providedTitle = "", document, id1, id2) {
		return `${providedTitle} ${id1}.href =/= ${id2}.href, ${id1}.hash === ${id2}.hash`;
	}
});

[16, 8].forEach((trunc) => {
	const document = buildEleventy(trunc);
	const prefix = `[hashTruncate: ${trunc.toString().padEnd(2, " ")}]`;
	test(prefix, differentHrefsDifferentHashes, document, "1css", "3css")
	test(prefix, differentHrefSameHashes, document, "1css", "2css")
});
