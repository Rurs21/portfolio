import Menu from "./js/menu.js"
import { Router } from "./js/router.js"
import { Scheme } from "./js/theme.js"
import rose from "./js/rose.js"
import { isCssLoaded, onRemove } from "./js/utils/misc.js"
import { checkUserLanguage, changeLanguage, changeContentLanguage } from "./i18n/l10n.js"
import { loadInlineSVG } from "./js/utils/svg.js"
import { main } from "./js/graphic.js"

const app = {}

document.addEventListener("DOMContentLoaded", init)

async function init(event) {
	document.querySelector("noscript").remove()

	initLanguage()
	if (isCssLoaded(document)) {
		drawRose()
		app.menus = initMenu()
		await loadIcons(document)
		app.scheme = initScheme()
	} else {
		enableNonCssFeatures()
	}
	app.router = initRouter()
	app.navigationLinks = initNavigation()
}

function initLanguage() {
	const userLanguage = checkUserLanguage()
	changeLanguage(userLanguage)

	const languageSelect = document.getElementById("language-select")
	languageSelect.value = userLanguage
	languageSelect.addEventListener("change", function () {
		try {
			changeLanguage(this.value)
			app.menus["main-menu"].close()
			const routes = app.router.routes
			for (const path in routes) {
				if (routes[path].content != null) {
					changeContentLanguage(this.value, routes[path].content)
				}
			}
		} catch (error) {
			console.error(`Error while changing language: ${error}`)
		}
	})
}

function initScheme() {
	const schemeToggler = document.getElementById("scheme-toggle")
	const icons = {
		light: document.getElementById("light-scheme-icon"),
		dark: document.getElementById("dark-scheme-icon"),
		system: document.getElementById("system-scheme-icon")
	}

	return new Scheme(schemeToggler, icons)
}

function initMenu() {
	const menus = {}

	const menuIds = [
		"main-menu",
		"language-menu",
		"settings-menu",
		"navigation-menu"
	]
	for (const id of menuIds) {
		menus[id] = new Menu(
			document.getElementById(id),
			...document.querySelectorAll(`button[aria-controls="${id}"]`)
		)
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

function initRouter() {
	const router = new Router()
	router.addRoute("/", greeting)
	router.addRoute("/webgl", main)

	if (window.location.pathname != "/") {
		router.resolveRoute()
	} else {
		greeting()
	}

	return router
}

function initNavigation() {
	const navigationLinks = document.querySelectorAll("#navigation-menu a")

	for (const navlink of navigationLinks) {
		navlink.onclick = (event) => {
			event = event || window.event
			// handle event target is the child <img> or <svg> instead of the <a>
			let href = event.target.href || event.target.parentElement.href
			if (href) {
				event.preventDefault()
				if (href != window.location.href) {
					app.router.resolveRoute(href)
					app.menus["main-menu"].close()
				}
			}
		}
	}

	var setActiveLink = () => {
		const relativeLinks = 'a[href^="./"], a[href^="/"]'
		const linksToCurrentPage = document.querySelectorAll(relativeLinks)
		for (const link of linksToCurrentPage) {
			if (link.href == window.location.href) {
				link.setAttribute("aria-disabled", true)
				link.removeAttribute("href")
			} else {
				link.setAttribute("aria-disabled", false)
			}
		}
	}

	var href = window.location.href
	const urlObserver = new MutationObserver((mutations) => {
		// if location changed
		if (href !== window.location.href) {
			let url = new URL(href)
			href = window.location.href
			const placeHolderLink = "a:not([href])"
			const previouslyActives = document.querySelectorAll(placeHolderLink)
			for (const link of previouslyActives) {
				link.href = url.pathname
			}
			setActiveLink()
		}
	})
	urlObserver.observe(document.getElementById("content"), { childList: true })

	setActiveLink()

	return navigationLinks
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

function greeting() {
	const titleElement = document.getElementById("job-title")
	const title = titleElement.innerText

	const cursorElement = document.createElement("span")
	cursorElement.classList.add("cursor")
	cursorElement.style.animation = "blink 1s infinite"

	titleElement.innerHTML = ""
	titleElement.append(cursorElement)

	var done = false
	let currentIndex = 0
	var typeOutTitle = function () {
		if (done) {
			return
		}
		if (currentIndex < title.length) {
			titleElement.textContent += title[currentIndex]
			currentIndex++
			setTimeout(typeOutTitle, 50) // Typing speed: 50ms per character
		} else {
			done = true
			setTimeout(() => cursorElement.remove(), 1500)
		}
	}

	onRemove(document.querySelector("main"), () => {
		if (!done) {
			done = true
			titleElement.innerText = title
		}
	})

	setTimeout(typeOutTitle, 2100)
}

function drawRose() {
	const svgRose = rose("#E4345A", 2.7, "4.5s")

	const roseElement = document.getElementById("rose")
	roseElement.classList.add("start", "unfilled")
	roseElement.appendChild(svgRose)
	setTimeout(() => roseElement.classList.remove("unfilled"), 3750)
	setTimeout(() => roseElement.classList.remove("start"), 6000)
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
