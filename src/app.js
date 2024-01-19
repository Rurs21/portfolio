import "@/lib/blackmagic"
import * as scheme from "@/lib/theme"
import * as motion from "@/lib/motion"
import * as language from "@/i18n/l10n"
import animation from "@/lib/animation"

class App {
	constructor(router) {
		this.router = router
		this.language = language.getUserLanguage()
		this.scheme = scheme.getUserScheme()
		this.motion = motion.getUserMotionPref()
	}

	get language() {
		return language.getUserLanguage()
	}

	set language(lang) {
		try {
			language.changeLanguage(lang)
			// change cached route content
			changeRoutesLang(lang, this.router)
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

	get motion() {
		return motion.getUserMotionPref()
	}

	set motion(value) {
		motion.changeMotionPref(value)
		if (value == "reduce") {
			animation.reducedMotion = true
		} else {
			animation.reducedMotion = false
		}
	}

	async resolveRoute(path) {
		const route = await this.router.resolve(path)
	}

	closeMainMenu() {
		if (this.menus && this.menus["main-menu"]) {
			this.menus["main-menu"].close()
		}
	}

	enableMainMenu(value = true) {
		if (this.menus && this.menus["main-menu"]) {
			this.menus["main-menu"].enableControls(value)
		}
	}
}

// changing the language for each route except the current one.
function changeRoutesLang(lang, router) {
	const routes = router.routes
	for (const path in routes) {
		const content = routes[path].contentView
		if (path != router.currentPath && content != undefined) {
			language.changeContentLanguage(lang, content)
		}
	}
}

export default App
