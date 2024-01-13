import * as scheme from "@/lib/theme"
import * as language from "@/i18n/l10n"

class App {
	constructor(router) {
		this.router = router
		this.language = language.getUserLanguage()
		this.scheme = scheme.getUserScheme()
	}

	get language() {
		return language.getUserLanguage()
	}

	set language(lang) {
		try {
			// change document language
			language.changeLanguage(lang)
			// change cached route content
			const routes = this.router.routes
			for (const path in routes) {
				const current = window.location.pathname
				const content = routes[path]
				if (path != current && content != undefined) {
					language.changeContentLanguage(lang, content)
				}
			}
		} catch (error) {
			console.error(`language change error\n${error}`)
		}
	}

	get scheme() {
		return scheme.getUserScheme()
	}

	set scheme(value) {
		scheme.changeScheme(value)
	}

	closeMainMenu() {
		if (this.menus && this.menus["main-menu"]) {
			this.menus["main-menu"].close()
		}
	}
}

export default App
