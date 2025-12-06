import path from "path"
import slim from "./plugins/slim"
import pkg from './package.json' with { type: 'json' }

const deps = Object.keys(pkg.dependencies || {});
const depsRegex = new RegExp(`(${deps.join('|')})(\\/|$)`);

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
		rolldownOptions: {
			input: {
				index: 'src/index.html',
				sw: 'src/sw.js',
			},
			output: {
				entryFileNames: (chunkInfo) => {
					if (chunkInfo.name === 'sw')
						return 'sw.js'
					else
						return `assets/[name]-v${pkg.version}.js`
				},
				chunkFileNames: "assets/[name]-[hash:6].js",
				assetFileNames: `assets/[name]-v${pkg.version}.[ext]`,
				advancedChunks: {
					groups: [
						{
							test: depsRegex,
							name(id) { return `vendor/${id.match(depsRegex)[1]}`; }
						}
					]
				}
			},
		},
	}
}
