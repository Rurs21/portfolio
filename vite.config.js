import path from "path"
import slim from "./plugins/slim"
import pkg from './package.json' with { type: 'json' }

export default {
	root: "src",
	appType: "spa",
	plugins: [slim()],
	optimizeDeps: {
		entries: ["src/index.html"]
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src")
		}
	},
	build: {
		target: 'baseline-widely-available',
		manifest: true,
		assetsInlineLimit: 12288,
		outDir: path.resolve(__dirname, "dist"),
		emptyOutDir: true,
		rollupOptions: {
			input: {
				index: 'src/index.html', // Your main entry point
				sw: 'src/sw.js',    // Your service worker entry point
			},
			output: {
				entryFileNames: (chunkInfo) => {
					if (chunkInfo.name === 'sw')
						return 'sw.js'
					else
						return `assets/[name]-v${pkg.version}.js`
				},
				chunkFileNames: "assets/[name]-[hash:6].js",
				assetFileNames: `assets/[name]-v${pkg.version}.[ext]`
			},
		},
	}
}
