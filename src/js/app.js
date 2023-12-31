import Scheme from "./theme"
import { checkUserLanguage, changeLanguage, changeContentLanguage } from "../i18n/l10n"

class App {
	menus

	constructor() {
		this.language = checkUserLanguage()
		this.scheme = new Scheme()
	}

	get language() {
		return checkUserLanguage()
	}

	set language(lang) {
		changeLanguage(lang)
		// change cached route
		if (this.router) {
			const routes = this.router.routes
			for (const path in routes) {
				const current = window.location.pathname
				if (path != current && routes[path].content != null) {
					changeContentLanguage(lang, routes[path].content)
				}
			}
		}
	}

	closeMainMenu() {
		if (this.menus) {
			this.menus["main-menu"].close()
		}
	}
}

export default App
