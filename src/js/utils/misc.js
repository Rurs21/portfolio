/**
 * This file contains miscellaneous utility functions that can be reused
 */

/**
 * Checks if any CSS stylesheets are loaded in a specified document.
 *
 * @param {Document} doc - The document in which to check for loaded CSS stylesheets.
 * @returns {boolean} Returns `true` if there are CSS stylesheets loaded in the specified document; otherwise, returns `false`.
 */
export function isCssLoaded(doc) {
	const styleSheets = doc.styleSheets
	return (styleSheets.length > 0)
}
