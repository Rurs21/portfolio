import path from "path"
import slim from "./plugins/slim"

export default {
	root: "src",
	appType: "spa",
	plugins: [slim()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src")
		}
	},
	build: {
		assetsInlineLimit: 12288,
		emptyOutDir: true,
		outDir: path.resolve(__dirname, "dist"),
	}
}
