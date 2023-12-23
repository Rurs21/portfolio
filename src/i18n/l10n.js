import translations from "./translations.json"

function checkUserLanguage() {
	const defaultLang = navigator.language.startsWith("fr") ? "fr" : "en"
	const savedLang = localStorage.getItem("language")

	return savedLang || defaultLang
}

function changeContentLanguage(lang, element) {
	element.querySelectorAll("[data-translate]").forEach((el) => {
		const key = el.getAttribute("data-translate")
		el.textContent = translations[lang][key] || key
	})
}

function changeLanguage(lang) {
	document.documentElement.lang = lang
	changeContentLanguage(lang, document)
	localStorage.setItem("language", lang)
}

export { checkUserLanguage, changeContentLanguage, changeLanguage }