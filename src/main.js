import App from "./js/app.js"
import Menu from "./js/menu.js"
import Router from "./js/router.js"

import { rose }  from "./js/flower"
import { greeting } from "./js/index/"
import { main } from "./js/webgl/"
// utils
import { isCssLoaded, onLinkClick } from "./js/utils/misc.js"
import { loadInlineSVG } from "./js/utils/svg.js"

var app

document.addEventListener("DOMContentLoaded", init)

async function init(event) {
	document.querySelector("noscript").remove()

	app = new App()
	app.router = initRouter()

	if (isCssLoaded(document)) {
		drawRose()
		app.menus = initMenu()
		await loadIcons(document)
		initButtons()
		initNavigation()
	} else {
		enableNonCssFeatures()
	}
}

function initRouter() {
	const router = new Router()
	router.addRoute("/", greeting)
	router.addRoute("/webgl", main)

	router.onresolveroute = initNavigation()

	router.resolveRoute()
	return router
}

function initNavigation() {
	const navigationLinks = document.querySelectorAll("#navigation-menu a")
	for (const navlink of navigationLinks) {
		navlink.onclick = onLinkClick((href) => {
			if (href != window.location.href) {
				app.router.resolveRoute(href)
				app.closeMainMenu()
			}
		})
	}

	const setActiveLink = () => {
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

	return setActiveLink
}

function initButtons() {
	const languageSelect = document.getElementById("language-select")
	languageSelect.value = app.language
	languageSelect.addEventListener("change", function () {
		app.language = this.value
		app.closeMainMenu()
	})

	// Scheme Toggler with icons
	const schemeToggler = document.getElementById("scheme-toggle")
	const icons = {
		light: document.getElementById("light-scheme-icon"),
		dark: document.getElementById("dark-scheme-icon"),
		system: document.getElementById("system-scheme-icon")
	}

	schemeToggler.replaceChildren(icons[app.scheme.value])
	schemeToggler.addEventListener("click", () => {
		const nextScheme = app.scheme.toggleScheme()
		schemeToggler.replaceChildren(icons[nextScheme])
	})
}

function initMenu() {
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
