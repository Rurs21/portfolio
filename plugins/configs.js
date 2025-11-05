const svgoConfig = {
	plugins: [
		{
			name: "preset-default",
			params: {
				overrides: {
					removeComments: {
						preservePatterns: false
					},
					cleanupIds: {
						remove: false
					},
					inlineStyles: false
				}
			}
		}
	]
}

const htmlMinifyConfig = {
	html5: true,
	caseSensitive: true,
	useShortDoctype: true,
	sortClassName: true,
	keepClosingSlash: true,
	// remove
	removeAttributeQuotes: false,
	removeComments: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: false,
	removeStyleLinkTypeAttributes: true,
	removeTagWhitespace: false,
	trimCustomFragments: true,
	// white space
	collapseWhitespace: true,
	preserveLineBreaks: false,
	minifyJS: true,
	minifyCSS: true,
	minifyURLs: true
}

export { svgoConfig, htmlMinifyConfig }
