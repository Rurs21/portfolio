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
		language.changeLanguage(lang)
		// change cached route
		const routes = this.router.routes
		for (const path in routes) {
			const current = window.location.pathname
			if (path != current && routes[path].content != null) {
				language.changeContentLanguage(lang, routes[path].content)
			}
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
