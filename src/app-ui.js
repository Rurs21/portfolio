import Menu from "@/lib/menu"
import animation from "@/lib/animation"
import * as language from "@/i18n/l10n"
import { schemeToggle } from "@/lib/theme"
import { onLinkClick } from "@/utils/events"
import { AppView } from "@/lib/view"

export default function initialize(app) {
	if (app == null) {
		throw new ReferenceError("app is undefined")
	}

	document.body.classList.remove("no-js")
	document.querySelector("noscript").remove()
	document.querySelector("main").id = "app-view"

	function UI() {
		this.appView = setAppView(app)
		this.actionDialog = setActionDialog()

		this.menu = () => {
			app.menus = setNavbar()
			return this
		}

		this.controls = {
			language: () => {
				setLanguageSelect(app)
				return this
			},
			scheme: () => {
				setSchemeToggler(app)
				return this
			},
			motion: () => {
				setMotionToggler(app)
				return this
			}
		}

		this.navigation = () => {
			initNavigation(app)
			return this
		}

		this.nonCssFeatures = () => {
			enableNonCssFeatures()
			return this
		}
	}

	app.ui = new UI()

	return app.ui
}

function setAppView(app, elementId = "app-view") {
	const appView = new AppView(document.getElementById(elementId))
	app.resolveRoute()
	return appView
}

function setLanguageSelect(app, elementId = "language-select") {
	const languageSelect = document.getElementById(elementId)
	languageSelect.value = app.language
	languageSelect.onchange = function () {
		app.enableMainMenu(false)
		app.closeMainMenu()
		const translateElems = language.queryTranslateElem(document)
		animation.glitchText(translateElems, () => {
			app.language = this.value
			app.enableMainMenu()
		})
	}
	return languageSelect
}

function setSchemeToggler(app, elementId = "scheme-toggle") {
	// Scheme Toggler with icons
	const schemeToggler = document.getElementById(elementId)
	const icons = {
		light: document.getElementById("light-scheme-icon"),
		dark: document.getElementById("dark-scheme-icon"),
		system: document.getElementById("system-scheme-icon")
	}
	schemeToggler.replaceChildren(icons[app.scheme])
	schemeToggler.onclick = function () {
		const scheme = schemeToggle(app.scheme)
		schemeToggler.replaceChildren(icons[scheme])
		app.scheme = scheme
		app.ui.actionDialog.flash(`
			${language.translations[app.language][scheme]}`)
	}
	return schemeToggler
}

function setMotionToggler(app, elementId = "motion-toggle") {
	// Motion Toggler with icons
	const motionToggler = document.getElementById(elementId)
	const icons = {
		"no-preference": document.getElementById("enabled-motion-icon"),
		reduce: document.getElementById("disabled-motion-icon")
	}
	motionToggler.replaceChildren(icons[app.motion])

	motionToggler.onclick = function () {
		const motion = app.motion == "reduce" ? "no-preference" : "reduce"
		motionToggler.replaceChildren(icons[motion])
		app.motion = motion
		const isMotionEnable = motion == "reduce" ? "enabled" : "disabled"
		app.ui.actionDialog.flash(`
			${language.translations[app.language]["reduced-motion"]}
			${language.translations[app.language][isMotionEnable]}`)
	}
	return setMotionToggler
}

function initNavigation(app) {
	setNavigationLinks("#navigation-menu a")
	setActiveLink()
	window.addEventListener("locationchange", function () {
		setActiveLink()
	})
	window.onpopstate = function () {
		animation.fadeInAndOut(app.view, () => {
			app.resolveRoute()
		})
	}

	function setNavigationLinks(selector) {
		const navigationLinks = document.querySelectorAll(selector)
		for (const navlink of navigationLinks) {
			navlink.onclick = onLinkClick((href) => {
				if (href != window.location.href) {
					app.closeMainMenu()
					animation.fadeInAndOut(app.view, () => {
						app.resolveRoute(href)
					})
				}
			})
		}
	}

	function setActiveLink() {
		// set previously active links back
		const previouslyActives = document.querySelectorAll("a:not([href])")
		for (const link of previouslyActives) {
			const url = new URL(link.getAttribute("data-href"))
			link.href = url.pathname
		}
		// disable active path links
		const relativeLinks = 'a[href^="./"], a[href^="/"]'
		for (const link of document.querySelectorAll(relativeLinks)) {
			if (link.href == window.location.href) {
				link.setAttribute("aria-disabled", true)
				link.setAttribute("data-href", link.href)
				link.removeAttribute("href")
			} else {
				link.setAttribute("aria-disabled", false)
			}
		}
	}
}

function setNavbar() {
	const menus = {}

	// instantiate each menu
	const menuElements = document.querySelectorAll('[id$="-menu"]')
	for (const element of menuElements) {
		const menuButtons = document.querySelectorAll(
			`button[aria-controls="${element.id}"]`
		)
		menus[element.id] = new Menu(element, ...menuButtons)
	}
	// set sub menus
	menus["main-menu"].addSubMenu(menus["settings-menu"])
	menus["main-menu"].addSubMenu(menus["navigation-menu"])
	menus["settings-menu"].addSubMenu(menus["language-menu"])

	// Reveal overlay & navbar when menu all setup
	document.getElementById("top-overlay").removeAttribute("hidden")
	document.getElementById("navbar").removeAttribute("hidden")

	return menus
}

function setActionDialog() {
	const dialog = document.createElement("dialog")
	dialog.id = "action-dialog"
	const dialogText = document.createElement("div")
	dialogText.classList.add("glitch-text")

	dialog.append(dialogText)
	document.body.append(dialog)

	// Override show method
	const showFn = dialog.show
	dialog.show = function (text) {
		dialogText.textContent = text
		showFn.call(this)
		this.classList.add("dialog-scale")
	}
	// Override close method
	const closeFn = dialog.close
	dialog.close = function () {
		this.classList.remove("dialog-scale")
		setTimeout(() => closeFn.call(this), 250)
	}
	// add flash method
	dialog.flash = function (text) {
		this.show(text)
		if (this.timeout) {
			clearTimeout(this.timeout)
		}
		this.timeout = setTimeout(() => this.close(), 1700)
	}

	return dialog
}

function enableNonCssFeatures() {
	// hide unused menu
	document.getElementById("main-menu").setAttribute("hidden", "")
	document.getElementById("settings-menu").setAttribute("hidden", "")
	// unhide navbar
	const navbar = document.getElementById("navbar")
	navbar.removeAttribute("hidden")
	// add separator (horizontal rule)
	navbar.insertBefore(
		document.createElement("hr"),
		document.getElementById("language-menu")
	)
}
