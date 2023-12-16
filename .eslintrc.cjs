import eslintConfigPrettier from "eslint-config-prettier";

module.exports = {
	env: {
		browser: true,
		es2021: true
	},
	extends: [
		"eslint:recommended",
		eslintConfigPrettier,
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
			"never"
		]
	}
}
