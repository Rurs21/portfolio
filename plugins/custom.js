import fs from "fs/promises"
import path from "path"
import { minify } from "html-minifier-terser"
import { htmlMinifyConfig } from "./configs.js"
import { inlineSvgImages } from "./svglue.js"
const htmlMinify = (html) => minify(html, htmlMinifyConfig)

/**
 * Custom Vite plugin for inlining SVGs, minifying HTML, and optimizing raw imports.
 */
export default function custom(options = {}) {
	return {
		name: "custom",
		enforce: "pre",

		transformIndexHtml(html, ctx) {
			html = inlineSvgImages(html, path.dirname(ctx.filename))
			html = htmlMinify(html)
			return html
		},

		async load(id) {

			// optimize raw import
			if (id.endsWith("?raw")) {

				[id] = id.split("?")

				const supported = [".html", ".vert", ".frag"];
				if (!supported.some(ext => id.endsWith(ext))) {
					return
				}

				let content = await fs.readFile(id, "utf-8")

				if (id.endsWith(".html")) {
					content = inlineSvgImages(content, id)
					content = await htmlMinify(content)
				}

				if (id.endsWith(".vert") || id.endsWith(".frag")) {
					content = content
						.replace("\t", "") // tab
						.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "") // comment
						.replace(/(\r\n|\n|\r)/gm, "") // newline
				}

				return `export default ${JSON.stringify(content)}`
			}
		}
	}
}
