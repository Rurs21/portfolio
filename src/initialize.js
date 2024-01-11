import Menu from "@/lib/menu"
import { rose } from "@/lib/flower"
import { loadInlineSVG } from "@/utils/svg"
import { onLinkClick } from "@/utils/events"

export default function initialize(app) {

	if (app == null) {
		throw new ReferenceError("app is undefined")
	}

	document.querySelector("noscript").remove()
	document.querySelector("main").removeAttribute("id")

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
			}
		}

		this.navigation = () => {
			initNavigation(app)
			return this
		}

		this.icons = async () => {
			await loadIcons(document)
			return this
		}

		this.visual = () => {
			drawRose()
			return this
		}

		this.nonCssFeatures = () => {
			enableNonCssFeatures()
			return this
		}
	}

	return new initializer()
}

async function loadIcons(element) {
	try {
		const svgElements = await loadInlineSVG(element)
		for (const svgElem of svgElements) {
			svgElem.removeAttribute("width")
			svgElem.removeAttribute("height")
			if (svgElem.matches("#contact-links a svg")) {
				const link = svgElem.parentElement
				link.classList.remove("icon")
				link.classList.add("square-icon")
			}
		}
		return svgElements
	} catch (error) {
		console.error(`Error while loading icons : ${error}`)
	}
}

function drawRose() {
	const svgRose = rose("#E4345A", 2.7, "3.5s")

	const roseElement = document.getElementById("rose")
	roseElement.classList.add("start", "unfilled")
	roseElement.appendChild(svgRose)
	setTimeout(() => roseElement.classList.remove("unfilled"), 2750)
	setTimeout(() => roseElement.classList.remove("start"), 5000)
}

function setLanguageSelect(app, elementId = "language-select") {
	const languageSelect = document.getElementById(elementId)
	languageSelect.value = app.language
	languageSelect.onchange = function () {
		app.language = this.value
		app.closeMainMenu()
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

function initNavigation(app) {


	setNavigationLinks("#navigation-menu a")
	setActiveLink()
	window.addEventListener('locationchange', function () {
		setActiveLink()
	});

	function setNavigationLinks(selector) {
		const navigationLinks = document.querySelectorAll(selector)
		for (const navlink of navigationLinks) {
			navlink.onclick = onLinkClick((href) => {
				if (href != window.location.href) {
					app.router.resolve(href)
					app.closeMainMenu()
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
