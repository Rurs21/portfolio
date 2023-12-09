import translations from "./i18n/translations.json"
import { Menu } from "./js/Menu.js"
import { archimedeanFlower } from "./js/flower.js"
import { calculatePathLength, calculateWidthAndHeight, isCssLoaded, fetchInlineSVG } from "./js/utils.js"

window.onload = function() {
	setupLanguage();
	isCssLoaded((isLoaded) => {
		if (isLoaded) {
			setupTheme();
			setupMenu();
			fetchInlineSVG();
		} else {
			enableNonCssFunctions();
		}
	});

	greeting();
	drawRose();
}

function setupLanguage() {
	const userLanguage = checkUserLanguage();
	changeLanguage(userLanguage);

	const languageSelect = document.getElementById("language-select");
	languageSelect.value = userLanguage;
	languageSelect.addEventListener("change", function() {
		changeLanguage(this.value);
	});
}

function setupTheme() {
	// Cache references
	const body = document.body;
	const themeToggle = document.getElementById('theme-toggle');
	const themeIcon = document.getElementById('theme-icon');

	const changeTheme = function(theme) {
		if (theme == 'dark') {
			body.classList.add('dark');
			themeIcon.innerHTML = `&#x263E;&#xFE0E;`; // ☾ ☽ 🌜 ⏾ ⚉
			themeIcon.ariaLabel = "Dark Symbol";
		} else {
			body.classList.remove('dark');
			themeIcon.innerHTML = `&#x2726;&#xFE0E;` // ✦ ☉ ✹ ✵ ☼ ☀
			themeIcon.ariaLabel = "Light Symbol";
		}

		// Save the theme preference to localStorage
		localStorage.setItem('theme', theme);
	}

	const toggleTheme = function() {
		const isDark = body.classList.contains('dark');
		isDark ? changeTheme('light') : changeTheme('dark');
	}

	const checkUserTheme = function() {
		const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const savedTheme = localStorage.getItem('theme');

		// Set previously selected theme
		if (savedTheme != null) {
			changeTheme(savedTheme)
		}
		else if (prefersDarkMode) {
			changeTheme('dark')
		}
	}

	// Add a click event listener to the theme-toggle button
	themeToggle.addEventListener('click', toggleTheme);
	// Add event listener is the prefers color scheme change
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
		const newScheme = event.matches ? "dark" : "light";
		changeTheme(newScheme)
	});

	checkUserTheme();
}

function setupMenu() {
	// Sub menu language
	const languageButton = document.getElementById("language-button");
	const languageMenu = new Menu(document.getElementById("language-menu"), languageButton);
	// Main menu
	const menuButton = document.getElementById("menu-button");
	const closeButton = document.getElementById("close-menu-button");
	const mainMenu = new Menu(document.getElementById("main-menu"), menuButton, closeButton);
	mainMenu.addSubMenu(languageMenu);

	// Create a MutationObserver for the lang (overkill ?)
	const langObserver = new MutationObserver((mutationsList, observer) => {
		for (const mutation of mutationsList) {
			if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
				mainMenu.close();
			}
		}
	});
	// Start observing the html tag for that change
	langObserver.observe(document.documentElement, { attributes: true });

	// Reveal overlay & navbar when menu all setup
	document.getElementById("top-overlay").removeAttribute("hidden")
	document.getElementById("navbar").removeAttribute("hidden");
}

function greeting() {
	const titleElement = document.getElementById('job-title');
	const title = titleElement.innerText;

	const cursorElement = document.createElement('span');
	cursorElement.classList.add("cursor");
	cursorElement.style.animation = 'blink 1s infinite';

	titleElement.innerHTML = "";
	titleElement.append(cursorElement);

	let currentIndex = 0;
	var typeOutTitle = function() {
		if (currentIndex < title.length) {
			titleElement.textContent += title[currentIndex];
			currentIndex++;
			setTimeout(typeOutTitle, 50); // Typing speed: 50ms per character
		} else {
			setTimeout(() => cursorElement.remove(), 1500);
		}
	}

	setTimeout(typeOutTitle, 2100);
}

function drawRose() {
	// Set up our constants to generate the spiral rose
	const a = 0, b = 4, c = 0.17, n = 5, k = 0.0257;
	const thetaIncrement = 0.17;
	const thetaMax = 9.9777 * Math.PI;
	//  rose coordinates
	const rosePoints = archimedeanFlower(a, b, c, n, k, thetaIncrement, thetaMax);

	// svg properties
	const strokeWidth = 2.7
	const pathLength = calculatePathLength(rosePoints);
	var { width, height } = calculateWidthAndHeight(rosePoints);
	width+=strokeWidth;
	height+=strokeWidth;

	let halfWidth = Math.ceil(width/2);
	let halfHeight = Math.floor(height/2);

	// Convert points to a path string and set the "d" attribute
	let d = `M ${rosePoints[0][0] + halfWidth} ${halfHeight - rosePoints[0][1]}`;
	rosePoints.slice(1).forEach(point => {
		d += ` L ${point[0] + halfWidth} ${halfHeight - point[1]}`;
	});

	// Create the SVG
	const svgNS = "http://www.w3.org/2000/svg";
	let svgElem = document.createElementNS(svgNS, "svg");
	svgElem.setAttribute("viewBox", `0 0 ${Math.ceil(width) + strokeWidth} ${Math.ceil(height)+ strokeWidth}` );

	let pathElem = document.createElementNS(svgNS, "path");
	pathElem.setAttribute("fill", "none");
	pathElem.setAttribute("stroke", "#E4345A");
	pathElem.setAttribute("stroke-width", strokeWidth);
	pathElem.setAttribute("d", d);

	// Animate the spiral drawing
	pathElem.setAttribute("stroke-dasharray", pathLength);
	pathElem.setAttribute("stroke-dashoffset", pathLength);

	let animateDrawElem = document.createElementNS(svgNS, "animate");
	animateDrawElem.setAttribute("attributeName", "stroke-dashoffset");
	animateDrawElem.setAttribute("from", pathLength);
	animateDrawElem.setAttribute("to", "0");
	animateDrawElem.setAttribute("dur", "4.5s");
	animateDrawElem.setAttribute("fill", "freeze");
	pathElem.appendChild(animateDrawElem);

	// Get svg container and add class for fill animation (css)
	const roseElement = document.getElementById("rose");
	roseElement.classList.add("start", "unfilled");

	// Title element
	const titleElement = document.createElementNS(svgNS, "title");
	titleElement.textContent = "Archimedean's Rose";
	const descElement = document.createElementNS(svgNS, "desc");
	descElement.textContent = "A Scalable Vector Graphic of a rose drawn with the Archimedean spirals equation"

	// Add the path to the SVG and the SVG to the container
	svgElem.appendChild(titleElement);
	svgElem.appendChild(descElement);
	svgElem.appendChild(pathElem);
	roseElement.appendChild(svgElem);

	setTimeout(()=> roseElement.classList.remove("unfilled"), 3750);
	setTimeout(()=> roseElement.classList.remove("start"), 6000);
}

function checkUserLanguage() {
	const defaultLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
	const savedLang = localStorage.getItem('language');

	return savedLang || defaultLang;
}

function changeLanguage(lang) {
	document.documentElement.lang = lang
	document.querySelectorAll("[data-translate]").forEach(el => {
		const key = el.getAttribute("data-translate");
		el.textContent = translations[lang][key] || key;
	});
	localStorage.setItem('language', lang);
}

function enableNonCssFunctions() {
	document.getElementById("main-menu").setAttribute("hidden","");
	document.getElementById("navbar").removeAttribute("hidden")
}
