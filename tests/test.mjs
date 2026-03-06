import test from "ava";
import { buildScenarios } from "eleventy-test";
import { JSDOM } from "jsdom";

/**
 * URLS in this refer to src or href or whatever
 */

// Build utils
const results = await buildScenarios({returnArray: false});
const BASIC_SCENARIOS = ["8-sync@3", "8-async@3", "16-sync@3", "16-async@3"];
console.log(BASIC_SCENARIOS)

// Helpers
function _getAttribute(document, id, attribute) {
	try { 
		return document.getElementById(id).getAttribute(attribute);
	} catch (e) {
		if (e instanceof TypeError) {
			throw TypeError()
		}
	}
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

async function parseHtml(t, scenarioTitle, filename="/test/index.html") {
	try {
		const result = results[scenarioTitle]
		const dom = (new JSDOM(
			await result.getFileContent(filename)
		));
		return dom.window.document;
	} catch (e) {
		t.log(scenarioTitle, filename);
		throw e;
	}
}

// Tests
// "1css & 3css hrefs =/=, hashes =="
test("different {href,src}, different hashes", async t => {
	const ids = ["1css", "3css", "js", "1img", "3img"];
	
	for (let resultId of BASIC_SCENARIOS) {
		t.log(resultId);
		const document = await parseHtml(t, resultId);
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
		
	}
});

// "1css & 2css hrefs =/=, hashes =="
test("different {href,src}, same hashes", async t => {
	const ids = ["1css", "2css"];
	
	for (let resultId of BASIC_SCENARIOS) {
		t.log(resultId);
		const document = await parseHtml(t, resultId); 
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
	};
});


// "1css & 2css hrefs ==, hashes =="
test("same {href,src}, same hashes", async t => {
	const ids = ["1img", "2img"];
	for (let resultId of BASIC_SCENARIOS) {
		t.log(resultId);
		const document = await parseHtml(t, resultId);
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
	}
});


test("hash lengths are all set hash length", async t => {
	const ids = ["1css", "2css", "3css", "js"];
	for (let resultId of BASIC_SCENARIOS) {
		const document = await parseHtml(t, resultId);
		const desiredHashLength = parseInt(resultId.split("-")[0]);
		t.true(desiredHashLength == 8 || desiredHashLength == 16);

		const [urls, hashes] = elementIdsToUrlsAndHashArrays(document, ids);
		console.log(`Checking correctHashLengths (${ids})`)
		console.log("---------------------------")
		hashes.forEach((fileHash) => {
			t.deepEqual(fileHash.length, desiredHashLength);
			console.log(`${fileHash} (${fileHash.length}) == ${desiredHashLength}`)
		});
		console.log();
	}
});
