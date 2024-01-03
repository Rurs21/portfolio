import path from "path"

export default {
	root: "src",
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src")
		}
	},
	build: {
		outDir: path.resolve(__dirname, "dist"),
		rollupOptions: {
			input: {
				main: path.resolve(__dirname, "src/index.html"),
				webgl: path.resolve(__dirname, "src/webgl/index.html")
			}
		}
	}
}
