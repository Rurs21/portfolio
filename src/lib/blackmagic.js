/**
 * This module contains a collection of JavaScript "quirks and hacks" that extend
 * standard functionalities in unconventional ways.
 *
 * @module blackmagic
 */

/**
 * Wraps the setter of a specified property on an object with additional custom logic provided by a callback function.
 * The original setter of the property, if it exists, is called within the provided callback function.
 *
 * @this {Object} The object whose property setter is to be wrapped.
 * @param {Object} obj - The target object whose property setter is to be wrapped.
 * @param {string} prop - The property name whose setter is to be wrapped.
 * @param {Function} callbackFn - The callback function to be executed when the property's setter is invoked.
 *                                The function receives two arguments: the original setter function and the value being set.
 *                                The original setter function can be called within the callback function to maintain original setter behavior.
 * @returns {Object} The object that was passed to the function, with the specified setter modified.
 */
function wrapPropertySetter(obj, prop, callbackFn) {
	const prototype = Object.getPrototypeOf(obj)
	const descriptor = Object.getOwnPropertyDescriptor(prototype, prop)

	if (!descriptor) {
		throw new Error(`Property descriptor for '${prop}' not found.`)
	}
	if (typeof descriptor.set !== "function") {
		throw new Error(`Setter for property '${prop}' not defined.`)
	}

	const originalSetter = descriptor.set
	descriptor.set = function (value) {
		callbackFn.call(obj, originalSetter, value)
	}
	Object.defineProperty(obj, prop, descriptor)
	return obj
}

// The function is added as a method to the Object & Object Prototype.
Object.wrapPropertySetter = wrapPropertySetter
Object.defineProperty(Object.prototype, "wrapPropertySetter", {
	value: function (prop, callbackFn) {
		return wrapPropertySetter(this, prop, callbackFn)
	},
	enumerable: false,
	configurable: true,
	writable: true
})

/**
 * Creates a clone of the current function. The cloned function will have the same behavior and properties
 * as the original function. If the function has already been cloned before, the clone will be based on the
 * original function, not the previously cloned one.
 * https://stackoverflow.com/a/11230005
 *
 * @this {Function} The function to be cloned. This method is added to Function.prototype.
 * @returns {Function} A clone of the original function.
 */
Function.prototype.clone = function () {
	const cloneTarget = Symbol.for("cloneTarget")
	const targetFn = this[cloneTarget] ?? this

	function clone() {
		return targetFn.apply(this, arguments)
	}

	for (const key in targetFn) {
		clone[key] = this[key]
	}

	clone[cloneTarget] = targetFn

	return clone
}

/**
 * Add event 'locationchange' to detect if URL has changed
 * https://stackoverflow.com/a/52809105
 */
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
