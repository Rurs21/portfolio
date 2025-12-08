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

	get view() {
		return this.ui.appView.element
	}

	async resolveRoute(href = window.location.href) {
		try {
			const path = new URL(href, document.baseURI).pathname
			const view = await this.router.resolve(path)
			// avoid updating view if the path changed
			if (path === this.router.currentPath) {
			    this.ui.appView.view = view
			}
		} catch (error) {
			throw new Error(`Failed to resolve '${href}'`, { cause: error })
		}
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

// changing the language for each route
function changeRoutesLang(lang, router) {
	console.debug("Change Route lang")
	const routes = router.routes
	for (const path in routes) {
	    // TODO: this will stack callbacks on routes pending to be resolve
		routes[path].view.then((view) => {
			language.changeContentLanguage(lang, view.content)})
	}
}

export default App
