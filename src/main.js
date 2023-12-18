import translations from "./i18n/translations.json"
import { Menu } from "./js/menu.js"
import { isCssLoaded } from "./js/utils/misc.js"
import { archimedeanFlower } from "./js/archimedeanFlower.js"
import { setImagesToSVG, createCoordinatesSVG, defineSVG } from "./js/utils/svg.js"

window.onload = function () {
	setupLanguage()
	isCssLoaded((isLoaded) => {
		if (isLoaded) {
			setUpIcons().then(setupTheme)
			setupMenu()
		} else {
			enableNonCssFunctions()
		}
	})

	greeting()
	drawRose()
}

function setupLanguage() {
	const userLanguage = checkUserLanguage()
	changeLanguage(userLanguage)

	const languageSelect = document.getElementById("language-select")
	languageSelect.value = userLanguage
	languageSelect.addEventListener("change", function () {
		changeLanguage(this.value)
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

		// Set previously selected theme
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
	// Main menu
	const menuButton = document.getElementById("menu-button")
	const closeButton = document.getElementById("close-menu-button")
	const mainMenu = new Menu(
		document.getElementById("main-menu"),
		menuButton,
		closeButton
	)
	mainMenu.addSubMenu(settingsMenu)
	settingsMenu.addSubMenu(languageMenu)

	// Create a MutationObserver for the lang (overkill ?)
	const langObserver = new MutationObserver((mutationsList, observer) => {
		for (const mutation of mutationsList) {
			if (
				mutation.type === "attributes" &&
				mutation.attributeName === "lang"
			) {
				mainMenu.close()
			}
		}
	})
	// Start observing the html tag for that change
	langObserver.observe(document.documentElement, { attributes: true })

	// Reveal overlay & navbar when menu all setup
	document.getElementById("top-overlay").removeAttribute("hidden")
	document.getElementById("navbar").removeAttribute("hidden")
}

function setUpIcons() {
	// selectors
	const imgSelector = 'img[src$=".svg"], img[src^="data:image/svg"]'
	const btnSelector =
		'button > img[src$=".svg"], button > img[src^="data:image/svg"]'
	// icons elements
	const contactIcons = document
		.getElementById("links")
		.querySelectorAll(imgSelector)
	const buttonIcons = document.querySelectorAll(btnSelector)

	return Promise.all([
		// Contact Icons
		setImagesToSVG(contactIcons).then((svgElements) => {
			for (const svgElem of svgElements) {
				svgElem.parentElement.classList.remove("icon")
				svgElem.parentElement.classList.add("square-icon")
			}
		}),
		// Buttons Icons
		setImagesToSVG(buttonIcons).then((svgElements) => {
			for (const svgElem of svgElements) {
				svgElem.removeAttribute("width")
				svgElem.removeAttribute("height")
			}
		})
	]).catch((error) => {
		console.error(error)
	})
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

function checkUserLanguage() {
	const defaultLang = navigator.language.startsWith("fr") ? "fr" : "en"
	const savedLang = localStorage.getItem("language")

	return savedLang || defaultLang
}

function changeLanguage(lang) {
	document.documentElement.lang = lang
	document.querySelectorAll("[data-translate]").forEach((el) => {
		const key = el.getAttribute("data-translate")
		el.textContent = translations[lang][key] || key
	})
	localStorage.setItem("language", lang)
}

function enableNonCssFunctions() {
	document.getElementById("main-menu").setAttribute("hidden", "")
	document.getElementById("settings-menu").setAttribute("hidden", "")
	document.getElementById("navbar").removeAttribute("hidden")
}
