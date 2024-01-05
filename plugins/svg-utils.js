import { JSDOM } from "jsdom"

const svgNS = "http://www.w3.org/2000/svg"
const { document } = new JSDOM(`...`).window

/**
 * Transfers applicable attributes from an HTMLImageElement to an SVGSVGElement.
 * This function iterates through all attributes of the provided image element (imgElement)
 * and sets them on the provided SVG element (svgElement) if they are applicable to SVG elements.
 * If the 'alt' attribute is present in the image element, it triggers a function to set
 * appropriate ARIA (Accessible Rich Internet Applications) attributes on the SVG element
 * to maintain accessibility standards.
 *
 * @param {HTMLImageElement} imgElement - The source image element from which attributes are to be transferred.
 * @param {SVGSVGElement} svgElement - The SVG element to which attributes are to be set.
 */
function transferAttributes(imgElement, svgElement) {
	for (let attr of imgElement.attributes) {
		if (isApplicableToSVG(attr.name)) {
			if (attr.name == "alt") {
				setAriaAttributes(imgElement, svgElement)
			} else {
				svgElement.setAttribute(attr.name, attr.value)
			}
		}
	}
}

function setAriaAttributes(imgElement, svgElement) {
	if (!imgElement.id) {
		let newId = imgElement.alt
		newId = newId
			.replace(/^[^a-zA-Z]+/, "") // alphanumeric
			.toLowerCase()
			.replace(/[^a-zA-Z0-9-]/g, "-") // space to "-"
		imgElement.id = newId
	}

	// <title> element
	const titleElem = document.createElementNS(svgNS, "title")
	titleElem.id = imgElement.id.concat("-title")
	titleElem.textContent = imgElement.alt
	// <desc> element
	const descElem = document.createElementNS(svgNS, "desc")
	descElem.id = imgElement.id.concat("-desc")
	descElem.textContent = imgElement.alt

	svgElement.setAttribute("role", "img")
	svgElement.insertBefore(titleElem, svgElement.firstChild)
	svgElement.insertBefore(descElem, titleElem.nextSibling)
	svgElement.setAttribute("aria-labelledby",`${titleElem.id} ${descElem.id}`)
}

function isApplicableToSVG(attrName) {
	const applicableAttrs = ["class","style","id","width","height","role","alt"]
	return (
		applicableAttrs.includes(attrName) ||
		attrName.startsWith("aria-") ||
		attrName.startsWith("data-")
	)
}

export { transferAttributes }
