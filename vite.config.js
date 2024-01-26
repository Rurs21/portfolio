import path from "path"
import htmlSvgInline from "./plugins/svg-inline"

export default {
	root: "src",
	appType: "spa",
	plugins: [htmlSvgInline()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src")
		}
	},
	build: {
		assetsInlineLimit: 8192,
		emptyOutDir: true,
		outDir: path.resolve(__dirname, "dist"),
	}
}
