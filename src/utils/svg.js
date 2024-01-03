/**
 * SVG Utility Functions
 *
 * This module provides utility functions for SVG
 *
 * @module svgUtils
 */
import { findMinMaxCoordinates } from "./geometry.js"

// SVG Namespace
const svgNS = "http://www.w3.org/2000/svg"

/**
 * This function generates an SVG element that includes a path element defined by the given coordinates.
 * The path is styled with the specified color and stroke width. If a drawing duration is provided,
 * the path is animated to draw the path over the specified duration.
 *
 * @param {number[][]} coordinates - An array of coordinate pairs (x,y).
 * @param {string} color - The color of the path stroke.
 * @param {number} strokeWidth - The width of the path stroke.
 * @param {<clock-value>} duration of an animation. Must be greater than 0 and can be expressed with hours (h), minutes (m), seconds (s) or milliseconds (ms). Could be hh:mm:ss.iii for exemple.
 *                                        Pass `null` to skip animation.
 *
 * @returns {SVGElement} - The SVG element containing the drawn path.;
 */
export function createCoordinatesSVG(
	coordinates,
	color,
	strokeWidth,
	drawingDuration
) {
	const svgElement = document.createElementNS(svgNS, "svg")
	const group = document.createElementNS(svgNS, "g")

	var pathElement = createPathElement(coordinates, color, strokeWidth)
	if (drawingDuration != null) {
		pathElement = animateDrawingPath(pathElement, drawingDuration)
	}

	const { minX, minY, width, height } = determineViewBox(
		coordinates,
		strokeWidth
	)

	svgElement.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`)
	group.setAttribute("transform-origin", "0 -4")
	group.setAttribute("transform", `matrix(1, 0, 0, -1, 0, 0)`)
	svgElement.appendChild(group)
	group.appendChild(pathElement)

	return svgElement
}

/**
 * Define attributes and elements within an SVG element to provide accessibility information.
 *
 * This function sets the id, title, and description attributes of an SVG element and
 * inserts <title> and <desc> elements with appropriate content for accessibility.
 * It also sets the "aria-labelledby" attribute to associate the title and description
 * elements with the SVG element.
 *
 * @param {SVGElement} svgElement - The SVG element to define.
 * @param {string} id - The id attribute to set on the SVG element.
 * @param {string} title - The text content to set as the title of the SVG.
 * @param {string} desc - The text content to set as the description of the SVG.
 */
export function defineSVG(svgElement, id, title, desc) {
	svgElement.id = id

	const titleElement = document.createElementNS(svgNS, "title")
	const descElement = document.createElementNS(svgNS, "desc")

	const titleId = id + "-title"
	const descId = id + "-desc"

	titleElement.id = titleId
	titleElement.textContent = title

	descElement.id = descId
	descElement.textContent = desc

	svgElement.insertBefore(titleElement, svgElement.firstChild)
	svgElement.insertBefore(descElement, titleElement.nextSibling)
	svgElement.setAttribute("aria-labelledby", `${titleId} ${descId}`)
}

/**
 * Determines the optimal viewBox dimensions for an SVG element based on a set of coordinates
 * and adjusted with the stroke width. This Ensure that the entire path, including
 * its stroke, is visible within the SVG viewBox
 *
 * @param {number[][]} coordinates - An array of coordinate pairs (x,y).
 * @param {number} strokeWidth - The width of the stroke for the path, used to adjust the viewBox.
 * @returns {Object} An object containing the viewBox properties: minX, minY, width, and height.
 */
function determineViewBox(coordinates, strokeWidth) {
	var { minX, minY, maxX, maxY } = findMinMaxCoordinates(coordinates)

	minX = Math.floor(minX - strokeWidth / 2)
	minY = Math.floor(minY - strokeWidth / 2)
	maxX = Math.ceil(maxX + strokeWidth / 2)
	maxY = Math.ceil(maxY + strokeWidth / 2)

	const width = maxX - minX
	const height = maxY - minY

	return { minX, minY, width, height }
}

/**
 * Creates an SVG path element using the specified coordinates, stroke color and stroke width.
 *
 * @param {number[][]} coordinates - An array of coordinate pairs (x,y).
 * @param {string} [color="#000000"] - The color of the stroke.
 * @param {number} [strokeWidth=1] - The width of the stroke for the path.
 * @returns {SVGPathElement} The created SVG path element
 */
function createPathElement(coordinates, color = "#000000", strokeWidth = 1) {
	// Convert points to a path string and set the "d" attribute
	let d = `M ${coordinates[0][0]} ${coordinates[0][1]}`
	coordinates.slice(1).forEach((point) => {
		d += ` L ${point[0]} ${point[1]}`
	})

	let pathElem = document.createElementNS(svgNS, "path")
	pathElem.setAttribute("fill", "none")
	pathElem.setAttribute("stroke", color)
	pathElem.setAttribute("stroke-width", strokeWidth)
	pathElem.setAttribute("d", d)

	return pathElem
}

/**
 * Creates an animated version of a given SVG path element to simulate drawing the path over time.
 *
 * @param {SVGPathElement} pathElement - The SVG path element to animate
 * @param {<clock-value>} duration of an animation. Must be greater than 0 and can be expressed with hours (h), minutes (m), seconds (s) or milliseconds (ms). Could be hh:mm:ss.iii for exemple.
 * @returns {SVGPathElement} A clone of the original path element, with added animation properties.
 *
 * @todo could be functionnal ? (make copy of path element ?)
 */
function animateDrawingPath(pathElement, duration) {
	const pathLength = pathElement.getTotalLength()
	var animatedPath = pathElement.cloneNode(true)

	// Animate the spiral drawing
	animatedPath.setAttribute("stroke-dasharray", pathLength)
	animatedPath.setAttribute("stroke-dashoffset", pathLength)

	let animateDrawElem = document.createElementNS(svgNS, "animate")
	animateDrawElem.setAttribute("attributeName", "stroke-dashoffset")
	animateDrawElem.setAttribute("from", pathLength)
	animateDrawElem.setAttribute("to", 0)
	animateDrawElem.setAttribute("dur", duration)
	animateDrawElem.setAttribute("fill", "freeze")
	animatedPath.appendChild(animateDrawElem)

	return animatedPath
}

/**
 * This function fetches SVG content or decodes base64-encoded SVG images and replaces the `img`
 * elements with the corresponding SVG elements.
 *
 * @param {HTMLElement} element - The root element to search for elements with SVG sources.
 * @returns {Promise<SVGSVGElement[]>} A promise that resolves to an array of newly created SVG elements.
 * @throws {Error} If an element is not an HTML <img> element with an SVG source.
 */
export async function loadInlineSVG(element) {
	const parser = new DOMParser()
	const svgs = []

	const imgSelector = 'img[src$=".svg"], img[src^="data:image/svg"]'
	const svgImages = element.querySelectorAll(imgSelector)

	for (const imgElement of svgImages) {
		const svgContent = await retrieveSVG(imgElement)
		// Parse svg content string into svg document
		const svgDoc = parser.parseFromString(svgContent, "image/svg+xml")
		const svgElement = svgDoc.documentElement
		// Set the svg element with image attributes
		svgElement.id = imgElement.id
		setAriaAttributes(svgElement, imgElement.getAttribute("alt"))
		// Replace the img element with the svg element and return its reference
		imgElement.replaceWith(svgElement)
		svgs.push(svgElement)
	}

	return svgs
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
	svgElement.setAttribute("role", "img")
	if (altText) {
		// create a title id from the altText
		var titleId = altText.replace(/^[^a-zA-Z]+/, "").toLowerCase()
		titleId = titleId.replace(/[^a-zA-Z0-9-]/g, "-").concat("-title")
		// create SVG title element with altText
		const titleElement = document.createElementNS(svgNS, "title")
		titleElement.textContent = altText
		titleElement.id = titleId
		// add title to SVG
		svgElement.insertBefore(titleElement, svgElement.firstChild)
		svgElement.setAttribute("aria-labelledby", titleId)
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
		throw new Error("Element is not an HTML image element.")
	}
	throw new Error("Image source is not an SVG.")
}

/**
 * Fetches SVG content from an image element with an SVG source URL.
 *
 * @param {HTMLImageElement} imgElement - An HTML `img` element with an SVG source URL.
 * @returns {Promise<string>} A promise that resolves to the SVG content.
 */
function fetchSVG(imgElement) {
	const src = imgElement.getAttribute("src")
	return fetch(src).then((response) => {
		if (!response.ok) {
			throw new Error(`Failed to fetch SVG: ${response.statusText}`)
		}
		const contentType = response.headers.get("Content-Type")
		if (!contentType || !contentType.includes("image/svg+xml")) {
			throw new Error("Fetched content is not SVG.")
		}
		return response.text()
	})
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
			const base64svg = imgElement.src.slice(
				imgElement.src.indexOf(",") + 1
			)
			const svgData = decodeURIComponent(base64svg) //actually not base64 encoded lol
			resolve(svgData)
		} catch (error) {
			reject(`Failed to decode base64 SVG: ${error.message}`)
		}
	})
}
