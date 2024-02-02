import path from "path"
import fs from "fs"
import fsp from "fs/promises"
import { minify } from "html-minifier"
import { optimize } from "svgo"
import { svgoConfig, htmlMinifyConfig } from "./configs.js"

/**
 * Plugins that replace the img with referenced svg with the actual svg inline inside html files
 */
export default function slim(options = {}) {
	const postfix = "?html-import"

	return {
		name: "slim",
		enforce: "pre",

		async transformIndexHtml(html, ctx) {
			let fileLocation = path.dirname(ctx.filename)
			html = replaceImgWithInlineSVG(html, fileLocation)
			return html
		},

		async resolveId(id, importer, options) {
			if (importer && importer.endsWith(".js") && id.endsWith(".html")) {
				let res = await this.resolve(id, importer, {
					skipSelf: true,
					...options
				})

				if (!res || res.external) {
					return res
				}

				return res.id + postfix
			}
		},

		async load(id) {
			async function readFile(id) {
				let content = await fsp.readFile(id, "utf-8")
				return content
					.replace("\t", "") // tab
					.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "") // comment
					.replace(/(\r\n|\n|\r)/gm, "") // newline
			}

			if (id.endsWith(".html")) {
				let htmlContent = await readFile(id)
				htmlContent = minify(htmlContent, htmlMinifyConfig)
				return htmlContent
			}

			if (id.endsWith(postfix)) {
				id = cleanUrl(id)
				let content = await readFile(id)
				let fileLocation = path.dirname(id)
				content = replaceImgWithInlineSVG(content, fileLocation)
				content = minify(content, htmlMinifyConfig)
				return `export default ${JSON.stringify(content)}`
			}

			if (id.endsWith("?raw")) {
				id = cleanUrl(id)
				// GLSL files
				if (id.endsWith(".vert") || id.endsWith(".frag")) {
					let content = await readFile(id)
					return `export default ${JSON.stringify(content)}`
				}
			}
		}
	}
}

function cleanUrl(url) {
	let queryIndex = url.indexOf("?")
	if (queryIndex !== -1) {
		url = url.slice(0, queryIndex)
	}
	return url
}

function replaceImgWithInlineSVG(html, fileLocation) {
	// Regular expression to find img and image tags with SVG sources and capture attributes
	const imgRegex =
		/<img ([^>]*src="([^"]+\.svg|data:image\/svg\+xml[^"]+)"[^>]*)>/g

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

	const attrRegex =
		/(class|id|style|height|width|alt|aria-\w+|data-\w+)="([^"]*)"/g
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
