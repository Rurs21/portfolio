import Menu from "./js/menu.js"
import { isCssLoaded } from "./js/utils/misc.js"
import { checkUserLanguage, changeLanguage } from "./i18n/l10n.js"
import { archimedeanFlower } from "./js/archimedeanFlower.js"
import { loadInlineSVG, createCoordinatesSVG, defineSVG } from "./js/utils/svg.js"
import { main } from "./js/graphic.js"
import { Router } from "./js/router.js"

/**
 * TODO:
 * - fix greeting with language & route change
 * - add transition animation with route
 */
const app = {};

window.onload = async function () {
	setupLanguage()
	if (isCssLoaded(document)) {
		app.menus = setupMenu()
		await loadIcons(document)
		setupTheme()
		app.router = setUpRouter()
		drawRose()
	} else {
		enableNonCssFunctions()
	}
}

function setupLanguage() {
	const userLanguage = checkUserLanguage()
	changeLanguage(userLanguage)

	const languageSelect = document.getElementById("language-select")
	languageSelect.value = userLanguage
	languageSelect.addEventListener("change", function () {
		changeLanguage(this.value)
		app.menus["main-menu"].close()
	})
}

function setupTheme() {
	// Cache references
	const body = document.body
	const themeToggle = document.getElementById("theme-toggle")
	const lightIcon = document.getElementById("light-theme-icon")
	const darkIcon = document.getElementById("dark-theme-icon")

	const changeTheme = function (theme) {
		if (theme == "dark") {
			body.classList.add("dark")
			themeToggle.replaceChild(darkIcon, lightIcon)
		} else {
			body.classList.remove("dark")
			themeToggle.replaceChild(lightIcon, darkIcon)
		}

		// Save the theme preference to localStorage
		localStorage.setItem("theme", theme)
	}

	const toggleTheme = function () {
		const isDark = body.classList.contains("dark")
		isDark ? changeTheme("light") : changeTheme("dark")
	}

	const checkUserTheme = function () {
		const prefersDarkMode = window.matchMedia(
			"(prefers-color-scheme: dark)"
		).matches
		const savedTheme = localStorage.getItem("theme")

		if (savedTheme != null) {
			changeTheme(savedTheme)
		} else if (prefersDarkMode) {
			changeTheme("dark")
		} else {
			changeTheme("light")
		}
	}

	// Add a click event listener to the theme-toggle button
	themeToggle.addEventListener("click", toggleTheme)
	// Add event listener is the prefers color scheme change
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", (event) => {
			const newScheme = event.matches ? "dark" : "light"
			changeTheme(newScheme)
		})

	checkUserTheme()
}

function setupMenu() {
	const menus = {};
	// Sub menu language
	const languageButton = document.getElementById("language-button")
	const languageMenu = new Menu(
		document.getElementById("language-menu"),
		languageButton
	)
	// Sub menu settings
	const settingsButton = document.getElementById("settings-button")
	const settingsMenu = new Menu(
		document.getElementById("settings-menu"),
		settingsButton
	)
	// Sub menu navigation
	const navigationButton = document.getElementById("navigation-button")
	const navigationMenu = new Menu(
		document.getElementById("navigation-menu"),
		navigationButton
	)
	// Main menu
	const menuButton = document.getElementById("menu-button")
	const closeButton = document.getElementById("close-menu-button")
	const mainMenu = new Menu(
		document.getElementById("main-menu"),
		menuButton,
		closeButton
	)
	mainMenu.addSubMenu(settingsMenu)
	mainMenu.addSubMenu(navigationMenu)
	settingsMenu.addSubMenu(languageMenu)

	// Reveal overlay & navbar when menu all setup
	document.getElementById("top-overlay").removeAttribute("hidden")
	document.getElementById("navbar").removeAttribute("hidden")

	menus[mainMenu.getId()] = mainMenu
	menus[settingsMenu.getId()] = settingsMenu
	menus[navigationMenu.getId()] = navigationMenu
	menus[languageMenu.getId()] = languageMenu
	return menus
}

function setUpRouter() {
	const router = new Router()
	router.addTemplate("home", function () {
		greeting()
	})
	router.addTemplate("webgl", function () {
		main()
	})
	router.addRoute("/","home")
	router.addRoute("/webgl","webgl")

	for (const navlink of document.querySelectorAll("#navigation-menu a")) {
		navlink.onclick = (event) => {
			event = event || window.event
			if (event) {
				event.preventDefault()
				if (event.target.href != window.location.href) {
					window.history.pushState({}, "", event.target.href)
					router.resolveRoute(window.location.pathname)
					app.menus["main-menu"].close()
				}
			}
		}
	}

	router.cacheRouteContent("/",document)
	if(window.location.pathname != "/") {
		router.resolveRoute()
	}
	return router
}

async function loadIcons(element) {
	try {
		const svgElements = await loadInlineSVG(element)
		for (const svgElem of svgElements) {
			svgElem.removeAttribute("width")
			svgElem.removeAttribute("height")
			if (svgElem.parentElement.matches("#links a")) {
				const link = svgElem.parentElement
				link.classList.remove("icon")
				link.classList.add("square-icon")
			}
		}
		return svgElements;
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

	let currentIndex = 0
	var typeOutTitle = function () {
		if (currentIndex < title.length) {
			titleElement.textContent += title[currentIndex]
			currentIndex++
			setTimeout(typeOutTitle, 50) // Typing speed: 50ms per character
		} else {
			setTimeout(() => cursorElement.remove(), 1500)
		}
	}

	setTimeout(typeOutTitle, 2100)
}

function drawRose() {
	// Set up our constants to generate the spiral rose
	const a = 0,
		b = 4,
		c = 0.17,
		n = 5,
		k = 0.0257
	const thetaIncrmt = 0.17
	const thetaMax = 9.9777 * Math.PI
	//  rose coordinates
	const rosePoints = archimedeanFlower(a, b, c, n, k, thetaIncrmt, thetaMax)

	// svg properties
	const svgElement = createCoordinatesSVG(rosePoints, "#E4345A", 2.7, "4.5s")
	const svgId = "rose-svg",
		svgTitle = "Archimedean's Rose",
		svgDesc = "Rose drawn with the Archimedean spiral equation"
	defineSVG(svgElement, svgId, svgTitle, svgDesc)

	const roseElement = document.getElementById("rose")
	roseElement.classList.add("start", "unfilled")
	roseElement.appendChild(svgElement)
	setTimeout(() => roseElement.classList.remove("unfilled"), 3750)
	setTimeout(() => roseElement.classList.remove("start"), 6000)
}

function enableNonCssFunctions() {
	document.getElementById("main-menu").setAttribute("hidden", "")
	document.getElementById("settings-menu").setAttribute("hidden", "")
	document.getElementById("navigation-menu").setAttribute("hidden", "")
	document.getElementById("navbar").removeAttribute("hidden")
}
