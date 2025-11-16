// js/background.js
import { CACHE_NAME, IMAGE_KEY, METADATA_KEY } from "./constants.js";

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install") {
		chrome.runtime.openOptionsPage();
	}

	// Always fetch a new image on install or update
	fetchAndCacheImage();
});

// Listen for the "next-image" command from the new tab page
chrome.runtime.onMessage.addListener((request) => {
	if (request.command === "next-image") {
		fetchAndCacheImage();
	}
});

async function fetchAndCacheImage() {
	try {
		// 1. Get the saved API key from storage
		const { unsplashAccessKey } =
			await chrome.storage.local.get("unsplashAccessKey");
		if (!unsplashAccessKey) {
			// Open options page if key isn't set
			chrome.runtime.openOptionsPage();
			return;
		}

		// 2. Fetch photo metadata from Unsplash
		const metaResponse = await fetchPhotoMetadata(unsplashAccessKey);

		// 3. Fetch the actual image (resized for performance)
		const imageResponse = await fetch(metaResponse.urls.raw + "&q=85&w=2000");

		if (!imageResponse.ok) {
			throw new Error("Failed to fetch the image file.");
		}

		// 4. Save to Cache and Storage
		const cache = await caches.open(CACHE_NAME);
		await cache.put(IMAGE_KEY, imageResponse);

		await chrome.storage.local.set({ [METADATA_KEY]: metaResponse });
	} catch (err) {
		console.error("Error fetching and caching image:", err);
	}
}

async function fetchPhotoMetadata(apiKey) {
	const { collections } = await chrome.storage.local.get("collections");

	let endpoint = "https://api.unsplash.com/photos/random?orientation=landscape";
	if (collections) {
		endpoint += `&collections=${collections}`;
	}

	const headers = new Headers();
	headers.append("Authorization", `Client-ID ${apiKey}`);

	const response = await fetch(endpoint, { headers });

	if (!response.ok) {
		throw new Error(`Unsplash API error: ${response.statusText}`);
	}

	return response.json();
}
