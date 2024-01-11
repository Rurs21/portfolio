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
 * Converts a given string to a valid HTML element ID.
 *
 * - removes leading and trailing characters that are not letters.
 * - replaces any character that is not a letter or a digit with a dash ('-')
 * - converts the string to lowercase
 *
 * @param {String} str - The string to be converted into a valid ID
 * @returns {String} A valid HTML element ID derived from the input string.
 */
function toValidId(str) {
	return str
		.replace(/^[^a-zA-Z]+/, "")
		.replace(/[^a-zA-Z]+$/, "")
		.replace(/[^a-zA-Z0-9-]/g, "-")
		.toLowerCase()
}

export { isCssLoaded, toValidId }
