import "@/lib/blackmagic"
import * as scheme from "@/lib/theme"
import * as language from "@/i18n/l10n"
import * as animation from "@/lib/animation"

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
			const current = window.location.pathname
			const routes = this.router.routes
			for (const path in routes) {
				const content = routes[path].contentView
				if (path != current && routes[path] != undefined) {
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

	async resolveRoute(path) {
		const route = await this.router.resolve(path)
	}

	closeMainMenu() {
		if (this.menus && this.menus["main-menu"]) {
			this.menus["main-menu"].close()
		}
	}

	set initialized(isCssLoaded) {
		// Add animations
		if (isCssLoaded) {
			// FadeIn FadeOut on Route Change
			const resolveRouteFn = this.resolveRoute.clone()
			this.resolveRoute = (path) => {
				animation.fadeInAndOut(this.router.appView,
					() => resolveRouteFn.call(this, path)
				)
			}
			// Glitch Text on Language Change
			this.wrapPropertySetter("language", (setter, lang) => {
				const translateElems = language.queryTranslateElem(document)
				animation.glitchText(
					translateElems,
					() => setter.call(this, lang)
				)
			})
		}
	}
}

export default App
