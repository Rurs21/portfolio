/**
 *  Events stuff
 */

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

/**
 * Attach a callback function to be executed when the "lang" attribute of the document's root element changes.
 *
 * This function uses a MutationObserver to detect changes in the "lang" attribute of the document's root element
 * <html>. When a change is detected, the provided callback function is executed.
 *
 * @param {function} callback - The callback function to execute when the "lang" attribute changes.
 * @returns {MutationObserver} Returns a MutationObserver instance for further interaction if needed.
 */
function onLanguageChange(callback) {
	const observer = new MutationObserver((mutations) => {
		const lang = mutations[0].target.lang
		callback(lang)
	})

	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["lang"]
	})
	return observer
}

/**
 * Registers a callback function to be executed when a link is clicked.
 * This function prevent the default link action and handle cases where the event target is a child element (like <img> or <svg>) of an <a> tag.
 *
 * @param {Function} callback - The callback function that will be executed when a link is clicked.
 *                              This function receives the href of the clicked link as its argument.
 * @returns {Function} A function that can be used as an event listener.
 *                     This returned function takes an event object, extracts the href from the event target
 *                     (or its parent if the target is a child element of an <a> tag), prevents the default link
 *                     behavior, and then calls the provided callback function with the href as its argument.
 */
function onLinkClick(callback) {
	return (event) => {
		// handle event target is the child <img> or <svg> instead of the <a>
		let href = event.target.href || event.target.closest("a").href
		if (href) {
			event.preventDefault()
			callback(href)
		}
	}
}

/**
 * Executes a given callback function once the document is in an 'interactive' or 'complete' state.
 * This function checks the document's readiness at a very short interval (every 2 milliseconds) and executes the callback as soon as the ready state is 'interactive' or 'complete'. Once the callback is executed, the interval is cleared.
 *
 * @param {Function} callback - The callback function to be executed when the document is ready.
 */
function onInterative(callback) {
	const id = setInterval(function () {
		switch (document.readyState) {
			case "interactive":
			case "complete":
				callback(new Event("documentinteractive"))
				clearInterval(id)
				break
		}
	}, 2)
}

/**
 * Add event 'locationchange' to detect if URL has changed
 * https://stackoverflow.com/a/52809105
 */
;(() => {
	let oldPushState = history.pushState
	history.pushState = function pushState() {
		let ret = oldPushState.apply(this, arguments)
		window.dispatchEvent(new Event("pushstate"))
		window.dispatchEvent(new Event("locationchange"))
		return ret
	}

	let oldReplaceState = history.replaceState
	history.replaceState = function replaceState() {
		let ret = oldReplaceState.apply(this, arguments)
		window.dispatchEvent(new Event("replacestate"))
		window.dispatchEvent(new Event("locationchange"))
		return ret
	}

	window.addEventListener("popstate", () => {
		window.dispatchEvent(new Event("locationchange"))
	})
})()

export { onRemove, onLanguageChange, onLinkClick, onInterative }
