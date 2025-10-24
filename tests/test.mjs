import test from "ava";
import { buildScenarios } from "eleventy-test";
import { readFileSync, rmSync } from "fs";
import { execSync } from "child_process";
import { JSDOM } from "jsdom";
import { env, cwd } from "process";

/**
 * URLS in this refer to src or href or whatever
 */

/*
// Build utils
const DIR_TEST = "tests/"
const OUT_DIR = DIR_TEST + "out/" 

rmSync(OUT_DIR, { recursive: true, force: true })
*/

// Helpers
function getDom(input) {
    return new JSDOM(input).window.document;
}

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
const results = await buildScenarios({
    projectRoot: cwd(),
    returnArray: false,
});
const resultsArray = Object.values(results);


test("1css & 3css hrefs =/=, but hashes ==", async t => {
	resultsArray.forEach(async (result) => {
		console.log(result)
		console.log("getting data")
		const data = await result.getFileContent("/index.html");
		console.log("data got")
		const document = getDom(data);
		console.log("dom got")
		const ids = ["1css", "3css", "js", "1img", "3img"];
		console.log(document)
		const [urls, hashes] = elementIdsToUrlsAndHashArrays(document, ids)
		console.log(urls)
		console.log(hashes)
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
	})

	/*
	title(providedTitle = "", document, ids) {
		return `${providedTitle} ${ids}: different {href,src}, different hashes`;	
	}
		*/
});

/*

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
*/
/*
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
			*/
