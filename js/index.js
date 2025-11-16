// js/index.js
import { CACHE_NAME, IMAGE_KEY } from "./constants.js";

document.addEventListener("DOMContentLoaded", () => {
	main();
	displayQuote();
});

async function main() {
	await loadPhoto();

	chrome.runtime.sendMessage({ command: "next-image" });
}

async function loadPhoto() {
	const cache = await caches.open(CACHE_NAME);
	const cachedResponse = await cache.match(IMAGE_KEY);

	if (cachedResponse) {
		const blob = await cachedResponse.blob();
		document.body.style.backgroundImage = `url(${URL.createObjectURL(blob)})`;
	} else {
		document.body.style.backgroundColor = "#111";
	}
}

async function runPrompt(prompt, params) {
	let session;

	try {
		if (!session) {
			session = await LanguageModel.create(params);
		}
		return session.prompt(prompt);
	} catch (e) {
		console.log("Prompt failed");
		console.error(e);
		console.log("Prompt:", prompt);
		session.destroy();
	}
}

async function displayQuote() {
	const { showQuote } = await chrome.storage.local.get("showQuote");
	if (!showQuote) return;

	if (!("LanguageModel" in self)) return;

	const prompt =
		"Write a one-sentence motivational message about success, perseverancee or discipline";

	const params = {
		expectedInputs: [{ type: "text", languages: ["en"] }],
		expectedOutputs: [{ type: "text", languages: ["en"] }],
		temperature: 2,
		topK: 128,
	};
	const availability = await LanguageModel.availability(params);

	if (availability !== "available") {
		return;
	}

	const quoteText = document.getElementById("quote-text");
	const quoteAuthor = document.getElementById("quote-author");

	try {
		quoteText.textContent = "Loading quote...";
		const response = await runPrompt(prompt, params);
		quoteText.textContent = response;
		quoteAuthor.classList.remove("is-hidden");
	} catch (e) {
		console.log(e);
		quoteText.textContent = "";
	}
}
