// js/popup.js

/**
 * Listens for the DOM to be loaded, then adds a click
 * listener to the "options-btn" button.
 */
document.addEventListener("DOMContentLoaded", () => {
	const optionsButton = document.getElementById("options-btn");

	if (optionsButton) {
		optionsButton.addEventListener("click", () => {
			chrome.runtime.openOptionsPage();
		});
	}
});
