import test from "ava";
import { buildScenarios } from "eleventy-test";
import { JSDOM } from "jsdom";
import Parser from "rss-parser";
const parser = new Parser();

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
	// make a URL and get the search params
	const queryStringIndex = string.indexOf('?');
	if (queryStringIndex < 0) {
		throw new Error("Query string could not be found in " + string);
	}
	const queryString = string.substring(queryStringIndex)
	const searchParams = new URLSearchParams(queryString);
	const param = searchParams.get("v");
	if (param === null) {
		throw new Error("Hash could not be found in " + string);
	}
	return param
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

/*
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
*/

/**
 * Tests for compatibility with minifiers.
 * 
 * Thanks to github.com/seezee and github.com/6TELOIV
 * for all their work in finding and fixing the issues! <3
 * 
 * See:
 * - https://github.com/Denperidge/eleventy-auto-cache-buster/issues/18
 * - https://github.com/Denperidge/eleventy-auto-cache-buster/pull/25
 */

const dogHash = "5e3f593b903b7172a3c962c6b0561742";
const cityHash = "8b04b1249bf9fb3d2e62c91d641511b7";
const logoHash = "cb41ee4bb73806e70aab98036c517b89";

const minifierCacheBust = test.macro({
	async exec(t, scenarioTitle) {
        const scenarioOutput = results[scenarioTitle]
	    t.log(scenarioTitle)


        for (const [htmlDir, imageFilename, hash] of [
            ["/", "placeholder-dog-1.jpg", dogHash],
            ["/blog/blog-1/", "placeholder-dog-1.jpg", dogHash],
            ["/blog/blog-2/", "placeholder-dog-2.jpg", dogHash],
            ["/blog/blog-3/", "placeholder-dog-3.jpg", dogHash]
        ]) {
            const html = await scenarioOutput.getFileContent(htmlDir + "index.html")
            const document = (new JSDOM(html)).window.document;
	        const images = document.querySelectorAll("img");

            t.is(images[0].getAttribute("src"), "/assets/images/blog/" + imageFilename + "?v=" + hash);
        }

        const rss = await scenarioOutput.getFileContent("/rss.xml")
        try {
            const parsedRss = await parser.parseString(rss);
            // Check if RSS is parseable & correct
            t.is(parsedRss.title, "My Web Site")
            t.is(parsedRss.image.url, "https://my.web.site/assets/images/site/logo.png?v=" + logoHash)
        } catch {
            t.fail("rss could not be parsed")
        }
	}, 
	title(providedTitle = "") {
		return `${providedTitle} is cache busted and has valid rss`;
	}
});
test("eleventy-plugin-minify", minifierCacheBust, "eleventy-plugin-minify@3")
test("html-minifier-terser", minifierCacheBust, "html-minifier-terser@3")

