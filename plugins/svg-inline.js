import path from "path"
import fsp from "fs/promises"
import { JSDOM } from "jsdom"
import * as svgUtils from "./svg-utils.js"
import { optimize } from "svgo"
import svgoConfig from "./svgo.config.js"

export default function htmlSvgInline(options = {}) {

	const postfix = "?html-import"

	return {
		name: "html-svg-inline",
		enforce: "pre",

		async transformIndexHtml(html, ctx) {
			let fileLocation = path.dirname(ctx.filename)
			html = await replaceImageSVG(html, fileLocation)
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
			if (!id.endsWith(postfix)) {
				return
			}

			id = cleanUrl(id)
			let fileLocation = path.dirname(id)
			let htmlContent = await fsp.readFile(id)
			htmlContent = await replaceImageSVG(htmlContent, fileLocation)

			return `export default ${JSON.stringify(htmlContent)}`
		}
	}

	async function replaceImageSVG(html, fileLocation) {
		// parse html & initiate DOM
		const dom = new JSDOM(html)
		const document = dom.window.document

		const svgImgSelector = 'img[src$=".svg"], img[src^="data:image/svg"]'
		const images = document.querySelectorAll(svgImgSelector)
		for (const img of images) {
			var svgContent = await retrieveSVG(img.src, fileLocation)
			const svg = JSDOM.fragment(svgContent).firstChild
			svgUtils.transferAttributes(img, svg)
			img.replaceWith(svg)
		}

		return dom.serialize()
	}

	async function retrieveSVG(src, from) {
		var svgString = undefined
		if (src.endsWith(".svg")) {
			src = src.startsWith("/") ? "." + src : src // vite quirk fix
			const svgPath = path.resolve(from, src)
			svgString = await fsp.readFile(svgPath, "utf-8")
		} else if (src.startsWith("data:image/svg")) {
			const base64svg = src.slice(src.indexOf(",") + 1)
			svgString = decodeURIComponent(base64svg)
		}

		return optimize(svgString, svgoConfig).data
	}
}

function cleanUrl(url) {
	let queryIndex = url.indexOf("?")
	if (queryIndex !== -1) {
		url = url.slice(0, queryIndex)
	}
	return url
}
