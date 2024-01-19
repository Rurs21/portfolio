import Menu from "@/lib/menu"
import { rose } from "@/lib/flower"
import { onLinkClick } from "@/utils/events"
import animation from "@/lib/animation"

export default function initialize(app) {

	if (app == null) {
		throw new ReferenceError("app is undefined")
	}

	document.body.classList.remove("no-js")
	document.querySelector("noscript").remove()
	document.querySelector("main").removeAttribute("class")

	function initializer() {
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

		this.visual = () => {
			drawRose(app.motion)
			return this
		}

		this.nonCssFeatures = () => {
			enableNonCssFeatures()
			return this
		}
	}

	return new initializer()
}

function drawRose(motion) {
	var drawingDur = "5s"
	if (motion == "no-preference") {
		drawingDur = "3.5s"
	}

	const svgRose = rose("#E4345A", 7, drawingDur)

	const roseElement = document.getElementById("rose")
	roseElement.innerHTML = ""
	roseElement.classList.add("start", "unfilled")
	roseElement.appendChild(svgRose)
	setTimeout(() => roseElement.classList.remove("unfilled"), 2750)
	setTimeout(() => roseElement.classList.remove("start"), 5000)
}

function setLanguageSelect(app, elementId = "language-select") {
	const languageSelect = document.getElementById(elementId)
	languageSelect.value = app.language
	languageSelect.onchange = function () {
		app.enableMainMenu(false)
		app.closeMainMenu()
		const translateElems = document.querySelectorAll("[data-translate]")
		animation.glitchText(translateElems, () => {
			app.language = this.value
			app.enableMainMenu()
		})
	}
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
		const nextScheme = app.scheme == "dark" ? "light" : "dark"
		schemeToggler.replaceChildren(icons[nextScheme])
		app.scheme = nextScheme
	}
}

function setMotionToggler(app, elementId = "motion-toggle") {
	// Motion Toggler with icons
	const motionToggler = document.getElementById(elementId)
	const icons = {
		"no-preference": document.getElementById("enabled-motion-icon"),
		"reduce": document.getElementById("disabled-motion-icon")
	}
	motionToggler.replaceChildren(icons[app.motion])

	motionToggler.onclick = function () {
		app.motion = app.motion == "reduce" ? "no-preference" : "reduce"
		motionToggler.replaceChildren(icons[app.motion])
	}
}

function initNavigation(app) {
	setNavigationLinks("#navigation-menu a")
	setActiveLink()
	window.addEventListener("locationchange", function () {
		setActiveLink()
	})

	function setNavigationLinks(selector) {
		const navigationLinks = document.querySelectorAll(selector)
		for (const navlink of navigationLinks) {
			navlink.onclick = onLinkClick((href) => {
				if (href != window.location.href) {
					animation.fadeInAndOut(app.router.appView, () => {
						app.resolveRoute(href)
						app.closeMainMenu()
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
