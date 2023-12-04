/**
 * Trying to keep it vanilla and simple 🍦
 * 
 * Rurs21
 */
import { archimedeanFlower } from "./js/flower.js"
import { calculatePathLength, calculateWidthAndHeight } from "./js/utils.js"

window.onload = function() {
	setupTheme();
	setupNavBar();

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

function setupNavBar() {
	const revealButton = document.getElementById("open-navbar");
	const hideButton = document.getElementById("close-navbar");
	const navbar = document.getElementById("navbar");
	const topOverlay = document.getElementById("top-overlay");

	var toggleFunction = function() {
		navbar.classList.toggle("close");
	};

	revealButton.addEventListener("click", toggleFunction);
	hideButton.addEventListener("click", toggleFunction);

	navbar.classList.remove("hidden");
	topOverlay.classList.remove("hidden");
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

	let animateElem = document.createElementNS(svgNS, "animate");
	animateElem.setAttribute("attributeName", "fill");
	animateElem.setAttribute("from", "transparent");
	animateElem.setAttribute("to", "#960018");
	animateElem.setAttribute("dur", "2s");
	animateElem.setAttribute("begin", "4s");
	animateElem.setAttribute("fill", "freeze");
	pathElem.appendChild(animateElem);

	// Add the path to the SVG and the SVG to the container
	svgElem.appendChild(pathElem);
	document.getElementById("rose").appendChild(svgElem);
}

function setupTheme() {
	// Get the theme-toggle button and body element
	const themeToggle = document.getElementById('theme-toggle');
	const body = document.body;

	const changeTheme = function(theme) {
		if (theme == 'dark') {
			body.classList.add('dark');
			themeToggle.textContent = '☾'; // ☾ ☽ 🌜 ⏾ ⚉
		} else {
			body.classList.remove('dark');
			themeToggle.textContent = '✦'; // ✦ ☉ ✹ ✵ ☼ ☀ 🌣 🜚︎
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

  