/**
 * This file contains miscellaneous utility functions that can be reused
 */

/**
 * Checks if any CSS stylesheets are loaded in the current document.
 *
 * @param {function(boolean)} callback - A callback function that receives a boolean indicating
 * whether CSS stylesheets are loaded (true) or not (false).
 */
export function isCssLoaded(callback) {
	const styleSheets = document.styleSheets
	if (styleSheets.length > 0) {
		callback(true)
		return
	}
	callback(false)
}
