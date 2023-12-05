/**
 * Trying to keep it vanilla and simple 🍦
 * 
 * Rurs21
 */
import { archimedeanFlower } from "./js/flower.js"
import { calculatePathLength, calculateWidthAndHeight } from "./js/utils.js"

window.onload = function() {
	setupTheme();
	setupMenu();

	greeting();
	drawRose();
}

function greeting() {
	const outputElement = document.querySelector('.output');
	const cursorElement = document.querySelector('.cursor');
	const title = "Software developer";
	let currentIndex = 0;

	cursorElement.style.animation = 'blink 1s infinite';


	var typeOutTitle = function() {
		if (currentIndex < title.length) {
			outputElement.textContent += title[currentIndex];
			currentIndex++;
			setTimeout(typeOutTitle, 50); // Typing speed: 100ms per character
		} else {
			setTimeout(() => cursorElement.remove(), 1500);
		}
	}

	setTimeout(typeOutTitle, 2100);
}

function setupMenu() {
	// buttons
	const revealButton = document.getElementById("menu-button");
	const hideButton = document.getElementById("close-menu-button");
	const languageButton = document.getElementById("language-button");
	const languageSelect = document.getElementById("language-select");

	// menus & overlay
	const navbar = document.getElementById("navbar");
	const mainMenu = document.getElementById("main-menu");
	const topOverlay = document.getElementById("top-overlay");
	const languageMenu= document.getElementById("language-menu");

	var toggleMenu = function() {
		mainMenu.classList.toggle("close");
		var isExpended = !mainMenu.classList.contains("close"); 
		revealButton.ariaExpanded = isExpended;
		hideButton.ariaExpanded = isExpended;
	};

	var toggleLanguage = function() {
		languageMenu.classList.toggle("close");
		var isExpended = !languageMenu.classList.contains("close");
		languageButton.ariaExpanded = isExpended;
		hideButton.disabled = isExpended;
	}

	revealButton.addEventListener("click", toggleMenu);
	hideButton.addEventListener("click", toggleMenu);
	languageButton.addEventListener("click", toggleLanguage);
	languageSelect.addEventListener("change", toggleLanguage);

	navbar.removeAttribute("hidden")
	topOverlay.removeAttribute("hidden");
}

function drawRose() {
	const roseElement = document.getElementById("rose");
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

	// Add the path to the SVG and the SVG to the container
	svgElem.appendChild(pathElem);
	roseElement.appendChild(svgElem);

	setTimeout(()=> roseElement.classList.remove("unfilled"), 3750);
	setTimeout(()=> roseElement.classList.remove("start"), 6000);
}

function setupTheme() {
	// Get the body & theme-toggle button element
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

  