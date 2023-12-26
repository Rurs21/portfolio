/**
 * This file contains miscellaneous utility functions that can be reused
 */

/**
 * Checks if any CSS stylesheets are loaded in a specified document.
 *
 * @param {Document} doc - The document in which to check for loaded CSS stylesheets.
 * @returns {boolean} Returns `true` if there are CSS stylesheets loaded in the specified document; otherwise, returns `false`.
 */
function isCssLoaded(doc) {
	const styleSheets = doc.styleSheets
	return styleSheets.length > 0
}

/**
 * Attach a callback function to be executed when the specified element is removed from the DOM.
 *
 * This function uses a MutationObserver to detect when the element is removed from its parent node.
 * When the removal is detected, the provided callback function is executed, and the observer is disconnected.
 *
 * @param {Node} element - The DOM element to watch for removal.
 * @param {function} callback - The callback function to execute when the element is removed.
 * @throws {Error} Throws an error if the provided element is not attached to the DOM.
 * @returns {MutationObserver} Returns a MutationObserver instance for further interaction if needed.
 */
function onRemove(element, callback) {
	const parent = element.parentNode
	if (!parent) {
		throw new Error("The node must be attached to the DOM")
	}

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const removedNode of mutation.removedNodes) {
				if (removedNode === element) {
					observer.disconnect()
					callback()
				}
			}
		}
	})

	observer.observe(parent, { childList: true })
	return observer
}

export { isCssLoaded, onRemove }
