// js/options.js

// Saves options to chrome.storage
async function saveOptions() {
	const key = document.getElementById("unsplashKey").value;
	const collections = document.getElementById("collections").value;
	const showQuote = document.getElementById("showQuote").checked;

	await chrome.storage.local.set({
		unsplashAccessKey: key,
		collections,
		showQuote,
	});

	const status = document.getElementById("status");
	status.textContent = "Options saved.";
	setTimeout(() => {
		status.textContent = "";
	}, 1500);

	if (showQuote) {
		createModelSession();
	}
}

async function restoreOptions() {
	const result = await chrome.storage.local.get([
		"unsplashAccessKey",
		"collections",
		"showQuote",
	]);

	document.getElementById("unsplashKey").value = result.unsplashAccessKey || "";
	document.getElementById("collections").value = result.collections || "";
	document.getElementById("showQuote").checked = result.showQuote ?? false;
}

async function checkAIAvailability() {
	const quoteCheckbox = document.getElementById("showQuote");
	const quoteLabel = document.getElementById("quote-label");
	const quoteHelp = document.getElementById("quote-help");

	const markUnavailable = () => {
		quoteCheckbox.disabled = true;
		quoteLabel.classList.add("is-disabled");

		quoteHelp.textContent = "This feature is not available in your browser";
		quoteHelp.classList.add("is-danger");
	};

	if (!("LanguageModel" in self)) {
		markUnavailable();
	}

	const availability = await LanguageModel.availability();

	if (availability === "available") return;

	if (availability === "unavailable") {
		return markUnavailable();
	}
}

async function createModelSession() {
	const progress = document.getElementById("model-progress");
	const quoteHelp = document.getElementById("quote-help");

	try {
		quoteHelp.textContent = "Initializing download...";
		progress.classList.remove("is-hidden");

		const availability = await LanguageModel.availability();

		if (availability === "available") return;

		const session = await LanguageModel.create({
			monitor(m) {
				m.addEventListener("downloadprogress", (e) => {
					quoteHelp.textContent = `Downloading AI model... (${Math.round(e.loaded * 100)}%)`;
					progress.value = e.loaded;

					if (e.loaded === 1) {
						quoteHelp.textContent = "Download complete, model installed";
						progress.removeAttribute("value");
					}
				});
			},
		});

		session.destroy();
	} catch (error) {
		quoteHelp.textContent = error.message;
		quoteHelp.classList.add("is-danger");
		console.log(error);
	} finally {
		progress.classList.add("is-hidden");
		progress.value = 0;
	}
}

document.addEventListener("DOMContentLoaded", async () => {
	restoreOptions();

	await checkAIAvailability();
});
document.getElementById("save").addEventListener("click", saveOptions);
