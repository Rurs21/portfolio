import path from "path"
import fs from "fs"
import { optimize } from "svgo"
import { svgoConfig, } from "./configs.js"

/**
 * Replaces <img> elements that reference SVG images with fully inlined <svg> markup.
 *
 * - Preserves relevant attributes (class, id, style, size, ARIA, data-*)
 * - Converts `alt` text into accessible SVG <title> and <desc> elements
 * - Automatically adds `aria-labelledby` for improved accessibility
 * - Optimizes the resulting SVG using SVGO
 *
 * @module svglue
 */

function inlineSvgImages(html, fileLocation) {
	// Regular expression to find img and image tags with SVG sources and capture attributes
	const imgRegex = /<img ([^>]*src="([^"]+\.svg|data:image\/svg\+xml[^"]+)"[^>]*)>/g;

	const replacer = (match, attributes, src) => {
		try {
			// Read the SVG file content
			let svgContent = retrieveSVG(src, fileLocation)
			// Capture common attributes
			const capturedAttributes = captureAttriubtes(attributes)
			// Add <title> and <description> with "aria-labelledby"
			if (capturedAttributes["alt"]) {
				svgContent = setAriaAttributes(svgContent, capturedAttributes)
			}
			// Append the attributes to <svg>
			svgContent = svgContent.replace(
				/<svg([^>]*)>/,
				`<svg$1${capturedAttributes.toString()}>`
			)
			// return optimize svg
			return optimize(svgContent, svgoConfig).data
		} catch (error) {
			console.error(`Error reading SVG file: ${src}`, error)
			return match // return the original <image>
		}
	}
	html = html.replace(imgRegex, replacer)
	return html
}

function captureAttriubtes(attributes) {
	const obj = {}
	obj.toString = function() {
		let str = ""
		for (var key in this) {
			if (typeof obj[key] == "string") {
				str += ` ${key}="${obj[key]}" `
			}
		}
		return str
	}

	const attrRegex = /(class|id|style|height|width|alt|aria-\w+|data-\w+)="([^"]*)"/g;
	let attrMatch
	while ((attrMatch = attrRegex.exec(attributes)) !== null) {
		obj[attrMatch[1]] = attrMatch[2]
	}

	return obj
}

function setAriaAttributes(svgString, capturedAttributes) {
	if (!capturedAttributes["id"]) {
		capturedAttributes["id"] = capturedAttributes["alt"]
			.replace(/^[^a-zA-Z]+/, "")
			.replace(/[^a-zA-Z]+$/, "")
			.replace(/[^a-zA-Z0-9-]/g, "-")
			.toLowerCase()
	}
	const alt = capturedAttributes["alt"]
	const id = capturedAttributes["id"]
	const titleId = id + "-title"
	const descId = id + "-desc"
	svgString = svgString.replace(
		/<svg([^>]*)>/,
		`<svg$1><title id="${titleId}">${alt}</title><desc id="${descId}">${alt}</desc>`
	)

	capturedAttributes["aria-labelledby"] = `${titleId} ${descId}`
	delete capturedAttributes["alt"]

	return svgString
}

function retrieveSVG(src, from) {
	var svgString = undefined
	if (src.endsWith(".svg")) {
		src = src.startsWith("/") ? "." + src : src // vite quirk fix
		const svgPath = path.resolve(from, src)
		svgString = fs.readFileSync(svgPath, "utf-8")
	} else if (src.startsWith("data:image/svg+xml;base64")) {
		const base64svg = src.slice(src.indexOf(",") + 1)
		svgString = atob(base64svg)
	} else if (src.startsWith("data:image/svg")) {
		const dataURIsvg = src.slice(src.indexOf(",") + 1)
		svgString = decodeURIComponent(dataURIsvg)
	}
	return svgString
}

export { inlineSvgImages }
