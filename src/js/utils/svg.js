/**
 * SVG Utility Functions
 *
 * This module provides utility functions for SVG
 *
 * @module svgUtils
 */

// SVG Namespace
const svgNS = "http://www.w3.org/2000/svg";

/**
 * This function fetches SVG content or decodes base64-encoded SVG images and replaces the `img`
 * elements with the corresponding SVG elements.
 *
 * @param {NodeList} svgImages - A NodeList containing HTML <img> elements with SVG sources.
 * @returns {Promise<Array<SVGSVGElement>>} A promise that resolves to an array of newly created SVG elements.
 * @throws {Error} If an element is not an HTML <img> element with an SVG source.
 */
export async function setImagesToSVG(svgImages) {
	const parser = new DOMParser();

	return Promise.all(Array.from(svgImages,
		imgElement => retrieveSVG(imgElement)
			.then(svgContent => {
				// Parse svg content string into svg document
				const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
				const svgElement = svgDoc.documentElement;
				// Set the svg element with image attributes
				svgElement.id = imgElement.id;
				setAriaAttributes(svgElement, imgElement.getAttribute('alt'));
				// Replace the img element with the svg element and return its reference
				imgElement.parentNode.replaceChild(svgElement, imgElement);
				return svgElement;
			})
	));
}

/**
 * Sets ARIA attributes and a title element to an SVG element based on provided alternative text.
 * The function creates a title element with a unique ID derived from the alternative text,
 * inserts it into the SVG element, and sets the 'aria-labelledby' attribute to reference this title.
 * It also sets the 'role' attribute of the SVG element to "img" to improve accessibility.
 *
 * @param {SVGSVGElement} svgElement - The SVG element to which ARIA attributes and title will be added.
 * @param {string} altText - The alternative text used for the title element and ARIA attributes.
 */
function setAriaAttributes(svgElement, altText) {
	svgElement.setAttribute('role',"img");
	if (altText) {
		// create a title id from the altText
		var titleId = altText.replace(/^[^a-zA-Z]+/, '').toLowerCase();
		titleId = titleId.replace(/[^a-zA-Z0-9-]/g, '-').concat('-title');
 		// create SVG title element with altText
		const titleElement = document.createElementNS(svgNS, 'title');
		titleElement.textContent = altText;
		titleElement.id = titleId;
		// add title to SVG
		svgElement.insertBefore(titleElement, svgElement.firstChild);
		svgElement.setAttribute('aria-labelledby', titleId);
    }
}

/**
 * Retrieves SVG content from an image element.
 *
 * @param {HTMLImageElement} imgElement - An HTML `img` element with an SVG source.
 * @returns {Promise<string>} A promise that resolves to the SVG content.
 */
async function retrieveSVG(imgElement) {
	if (imgElement instanceof HTMLImageElement) {
		if (imgElement.src.endsWith(".svg")) {
			return fetchSVG(imgElement)
		} else if (imgElement.src.startsWith("data:image/svg")) {
			return decodeBase64ToSVG(imgElement)
		}
	} else {
		throw new Error("Element is not an HTML image element.");
	}
	throw new Error("Image source is not an SVG.");
}

/**
 * Fetches SVG content from an image element with an SVG source URL.
 *
 * @param {HTMLImageElement} imgElement - An HTML `img` element with an SVG source URL.
 * @returns {Promise<string>} A promise that resolves to the SVG content.
 */
function fetchSVG(imgElement) {
	const src = imgElement.getAttribute('src');
	return fetch(src)
		.then(response => {
			if (!response.ok) {
                throw new Error(`Failed to fetch SVG: ${response.statusText}`);
            }
			const contentType = response.headers.get("Content-Type");
			if (!contentType || !contentType.includes("image/svg+xml")) {
                throw new Error("Fetched content is not SVG.");
            }
			return response.text();
		});
}

/**
 * Decodes base64-encoded SVG data from an image element's source.
 *
 * @param {HTMLImageElement} imgElement - An HTML `img` element with a base64-encoded SVG source.
 * @returns {Promise<string>} A promise that resolves to the decoded SVG content.
 */
function decodeBase64ToSVG(imgElement) {
	return new Promise((resolve, reject) => {
		try {
			const base64svg = imgElement.src.slice(imgElement.src.indexOf(',') + 1);
			const svgData = decodeURIComponent(base64svg);
			resolve(svgData);
		} catch (error) {
			reject(`Failed to decode base64 SVG: ${error.message}`);
		}
	});
}