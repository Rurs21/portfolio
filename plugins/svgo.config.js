export default {
	plugins: [
		{
			name: "preset-default",
			params: {
				overrides: {
					removeComments: {
						preservePatterns: false
					},
					removeTitle: false,
					cleanupIds: {
						remove: false
					},
					inlineStyles: false
				}
			}
		}
	]
}
