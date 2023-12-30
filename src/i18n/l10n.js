import translations from "./translations.json"


/**
 * Return language saved in local storage or the navigator default language
 *
 * @returns {"en"| "fr"} ISO 639-1 Language Code
 */
function checkUserLanguage() {
	const defaultLang = navigator.language.startsWith("fr") ? "fr" : "en"
	const savedLang = localStorage.getItem("language")

	return savedLang || defaultLang
}

/**
 * Change the content language of HTML elements with data-translate attribute
 * based on the provided language.
 *
 * @param {string} lang - ISO 639-1 Language Code
 * @param {HTMLElement} element - The root element to search for elements with data-translate
 */
function changeContentLanguage(lang, rootElement) {
	for (const element of rootElement.querySelectorAll("[data-translate]")) {
		const key = element.getAttribute("data-translate")
		element.textContent = translations[lang][key] || key
	}
}

/**
 * Change the content language of the web page based on the provided language.
 *
 * @param {string} lang - ISO 639-1 Language Code
 * @param {HTMLElement} element - The root element to search for elements with data-translate
 */
function changeLanguage(lang) {
	document.documentElement.lang = lang
	changeContentLanguage(lang, document)
	localStorage.setItem("language", lang)
}

export { checkUserLanguage, changeContentLanguage, changeLanguage }