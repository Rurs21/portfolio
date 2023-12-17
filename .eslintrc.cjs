module.exports = {
	env: {
		browser: true,
		es2021: true
	},
	extends: [
		"eslint:recommended",
		"prettier",
	],
	overrides: [
		{
			env: {
				node: true
			},
			files: [
				".eslintrc.{js,cjs}"
			],
			parserOptions: {
				sourceType: "script"
			}
		}
	],
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module"
	},
	rules: {
		"linebreak-style": [
			"error",
			"unix"
		],
		"no-duplicate-imports": [
			"error",
			{ "includeExports": true }
		],
		"no-unused-vars": [
			"error",
			{
				"vars": "all",
				"args": "none",
				"ignoreRestSiblings": false
			}
		]
	}
}
