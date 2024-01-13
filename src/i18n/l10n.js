import translations from "./translations.json"

const languages = ["en", "fr"]

/**
 * Return language saved in local storage or the navigator default language
 *
 * @returns {"en"| "fr"} ISO 639-1 Language Code
 */
function getUserLanguage() {
	const defaultLang = navigator.language.startsWith("fr") ? "fr" : "en"
	const savedLang = localStorage.getItem("language")

	return savedLang || defaultLang
}

/**
 * Change the content language of the web page based on the provided language.
 *
 * @param {string} lang - ISO 639-1 Language Code
 * @param {HTMLElement} element - The root element to search for elements with data-translate
 */
function changeLanguage(lang) {
	if (!languages.includes(lang)) {
		throw new Error(`Language '${lang}' is not a valid language`)
	}
	document.documentElement.lang = lang
	changeContentLanguage(lang, document)
	localStorage.setItem("language", lang)
}

/**
 * Change the content language of HTML elements with data-translate attribute
 * based on the provided language.
 *
 * @param {string} lang - ISO 639-1 Language Code
 * @param {HTMLElement | HTMLCollection} content - HTML element or collection to be translate
 */
function changeContentLanguage(lang, content) {
	if (!content) {
		throw new ReferenceError(`Content is undefined`)
	}
	if (typeof content[Symbol.iterator] === 'function') {
		for (const element of content) {
			translateContent(element)
		}
	} else {
		translateContent(content)
	}

	function translateContent(rootElement) {
		for (const element of rootElement.querySelectorAll("[data-translate]")) {
			const key = element.getAttribute("data-translate")
			element.textContent = translations[lang][key] || key
		}
	}

}

export { getUserLanguage, changeContentLanguage, changeLanguage }