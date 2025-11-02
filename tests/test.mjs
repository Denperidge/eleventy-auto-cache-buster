import test from "ava";
import { readFileSync, rmSync } from "fs";
import { execSync } from "child_process";
import { JSDOM } from "jsdom";
import { env } from "process";

/**
 * URLS in this refer to src or href or whatever
 */

// Build utils
const DIR_TEST = "tests/"
const OUT_DIR = DIR_TEST + "out/" 

rmSync(OUT_DIR, { recursive: true, force: true })

function buildEleventy(hashTruncate=16, runAsync=true, useServe=false) {
	// I tried using Eleventy programmatically. Emphasis on tried
	// Thanks to https://github.com/actions/setup-node/issues/224#issuecomment-943531791
	try {
		const command = useServe ? "timeout 4 npx @11ty/eleventy --serve" : "npx @11ty/eleventy"
		execSync(command, { env: { ...env, HASHTRUNCATE:hashTruncate, RUNASYNC: +runAsync /* convert to int */, USESERVE: +useServe }, cwd: DIR_TEST});
	} catch (e) {
		if (!useServe) {
			throw e;
		}
	}
	const outputHtml = readFileSync(`${OUT_DIR}${hashTruncate}-${runAsync ? "async" : "sync"}-${useServe ? "build" : "serve"}/test/index.html`, { encoding: "utf-8" });
	const dom = (new JSDOM(outputHtml));
	return dom.window.document;
}


// Helpers
function _getAttribute(document, id, attribute) {
	return document.getElementById(id).getAttribute(attribute);
}

function hash(string) {
	const paramIndex = string.lastIndexOf("v=");
	if (paramIndex < 0) {
		throw new Error("Hash could not be found in " + string);
	}
	return string.substring(paramIndex + 2)
}

function getUrl(document, id) {
	if (id.includes("css")) {
		return _getAttribute(document, id, "href");
	} else if (id.includes("js") || id.includes("img")) {
		return _getAttribute(document, id, "src");
	} else {
		throw Error("No url getter defined for " + id)
	}

}


function elementIdsToUrlsAndHashArrays(document, ids) {
	const attrs = [];
	const hashes = [];
	ids.forEach((id) => {
		const attr = getUrl(document, id);
		attrs.push(attr);
		hashes.push(hash(attr));
	});
	return [attrs, hashes];
}

function removeDuplicatesFromArray(arr) {
	return Array.from(new Set(arr));
}


// Tests
// "1css & 3css hrefs =/=, hashes =="
const differentUrlsDifferentHashes = test.macro({
	exec(t, document, ids) {
		const [urls, hashes] = elementIdsToUrlsAndHashArrays(document, ids)
		console.log(`Checking for different hrefs, same hashes (${ids})`)
		console.log("-----------------------------------------")

		// No duplicate hrefs
		t.deepEqual(
			urls.length,
			removeDuplicatesFromArray(urls).length
		);

		console.log("URLS:", urls)
		console.log("URLS (duplicates removed):", removeDuplicatesFromArray(urls))
		console.log("URLS length:", urls.length)
		console.log("URLS length (duplicates removed):", removeDuplicatesFromArray(urls).length)

		console.log();

		// No duplicate hashes
		t.deepEqual(
			hashes.length,
			removeDuplicatesFromArray(hashes).length
		);
		
		console.log("Hashes:", hashes)
		console.log("Hashes (duplicates removed):", removeDuplicatesFromArray(hashes))
		console.log("Hashes length:", hashes.length)
		console.log("Hashes length (duplicates removed):", removeDuplicatesFromArray(hashes).length)

		console.log();
		
	},
	title(providedTitle = "", document, ids) {
		return `${providedTitle} ${ids}: different {href,src}, different hashes`;	
	}
});

// "1css & 2css hrefs =/=, hashes =="
const differentUrlsSameHashes = test.macro({
	exec(t, document, ids){
		const [urls, hashes] = elementIdsToUrlsAndHashArrays(document, ids)
		console.log(`Checking for different hrefs, same hashes (${ids})`)
		console.log("-----------------------------------------")

		// No duplicate hrefs
		t.deepEqual(
			urls.length,
			removeDuplicatesFromArray(urls).length
		);
		console.log("URLS:", urls)
		console.log("URLS (duplicates removed):", removeDuplicatesFromArray(urls))
		console.log("URLS length:", urls.length)
		console.log("URLS length (duplicates removed):", removeDuplicatesFromArray(urls).length)

		console.log();

		// Duplicate hashes
		t.notDeepEqual(
			hashes.length,
			removeDuplicatesFromArray(hashes).length
		);

		console.log("Hashes:", hashes)
		console.log("Hashes (duplicates removed):", removeDuplicatesFromArray(hashes))
		console.log("Hashes length:", hashes.length)
		console.log("Hashes length (duplicates removed):", removeDuplicatesFromArray(hashes).length)

		console.log();
	}, 
	title(providedTitle = "", document, ids) {
		return `${providedTitle} ${ids}: different {href,src}, same hashes`;
	}
});


// "1css & 2css hrefs ==, hashes =="
const sameUrlsSameHashes = test.macro({
	exec(t, document, ids){
		const [urls, hashes] = elementIdsToUrlsAndHashArrays(document, ids)
		console.log(`Checking for different hrefs, same hashes (${ids})`)
		console.log("-----------------------------------------")

		// No duplicate hrefs
		t.notDeepEqual(
			urls.length,
			removeDuplicatesFromArray(urls).length
		);
		console.log("URLS:", urls)
		console.log("URLS (duplicates removed):", removeDuplicatesFromArray(urls))
		console.log("URLS length:", urls.length)
		console.log("URLS length (duplicates removed):", removeDuplicatesFromArray(urls).length)

		console.log();

		// Duplicate hashes
		t.notDeepEqual(
			hashes.length,
			removeDuplicatesFromArray(hashes).length
		);

		console.log("Hashes:", hashes)
		console.log("Hashes (duplicates removed):", removeDuplicatesFromArray(hashes))
		console.log("Hashes length:", hashes.length)
		console.log("Hashes length (duplicates removed):", removeDuplicatesFromArray(hashes).length)

		console.log();
	}, 
	title(providedTitle = "", document, ids) {
		return `${providedTitle} ${ids}: same {href,src}, same hashes`;
	}
});

const correctHashLengths = test.macro({
	exec(t, document, ids, desiredHashLength) {
		const [urls, hashes] = elementIdsToUrlsAndHashArrays(document, ids);
		console.log(`Checking correctHashLengths (${ids})`)
		console.log("---------------------------")
		hashes.forEach((fileHash) => {
			t.deepEqual(fileHash.length, desiredHashLength);
			console.log(`${fileHash} (${fileHash.length}) == ${desiredHashLength}`)
		});
		console.log();
	},
	title(providedTitle = "", document, ids, desiredHashLength) {
		return `${providedTitle} ${ids} hash lengths are all set hash length (${desiredHashLength})`;
	}
});

[16, 8].forEach((trunc) => {
	[true, false].forEach((runAsync) => {
		[true, false].forEach((useServe) => {
			const document = buildEleventy(trunc, runAsync, useServe);
			const prefix = `[hashTruncate: ${trunc.toString().padEnd(2, " ")}, runAsync: ${runAsync}, useServe: ${useServe}]`;
			test(prefix, differentUrlsDifferentHashes, document, ["1css", "3css", "js", "1img", "3img"]);
			test(prefix, differentUrlsSameHashes, document, ["1css", "2css"]);
			test(prefix, sameUrlsSameHashes, document, ["1img", "2img"]);
			test(prefix, correctHashLengths, document, ["1css", "2css", "3css", "js"], trunc)
		});
	});
});
