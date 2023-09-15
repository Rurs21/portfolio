/**
 * Trying to keep it vanilla and simple 🍦
 * 
 * Rurs21
 */
import { setupTheme } from "./js/theme.js";
import { archimedeanFlower } from "./js/flower.js"

window.onload = function() {
	drawRose();
	setupTheme();
	greetingTitle();
}

function greetingTitle() {
	const outputElement = document.querySelector('.output');
	const cursorElement = document.querySelector('.cursor');
	const title = "Software developer";
	let currentIndex = 0;

	cursorElement.style.animation = 'blink 1s infinite';


	var typeOutTitle = function() {
		if (currentIndex < title.length) {
			outputElement.textContent += title[currentIndex];
			currentIndex++;
			setTimeout(typeOutTitle, 100); // Typing speed: 100ms per character
		} else {
			cursorElement.style.animation = 'none';
			cursorElement.style.opacity = '0';
		}
	}

	setTimeout(typeOutTitle, 2400);
}

function drawRose() {
	// Set up our constants and generate the spiral
	const a = 0, b = 4, c = 0.17, n = 5, k = 0.0257;
	const thetaIncrement = 0.17;
	const thetaMax = 9.9777 * Math.PI;
	const spiralPoints = archimedeanFlower(a, b, c, n, k, thetaIncrement, thetaMax);

	// Create the SVG and the path for the spiral
	const svgNS = "http://www.w3.org/2000/svg";
	let svgElem = document.createElementNS(svgNS, "svg");
	svgElem.setAttribute("width", `400`);
	svgElem.setAttribute("height", `400`);

	let pathElem = document.createElementNS(svgNS, "path");
	pathElem.setAttribute("fill", "none");
	pathElem.setAttribute("stroke", "#E4345A");
	pathElem.setAttribute("stroke-width", "2.7");


	// Convert points to a path string and set the "d" attribute
	let d = `M ${spiralPoints[0][0] + 200} ${200 - spiralPoints[0][1]}`;
	spiralPoints.slice(1).forEach(point => {
		d += ` L ${point[0] + 200} ${200 - point[1]}`;
	});

	pathElem.setAttribute("d", d);

	// Animate the spiral drawing
	const pathLength = 8000;  // Adjust as needed
	pathElem.setAttribute("stroke-dasharray", pathLength);
	pathElem.setAttribute("stroke-dashoffset", pathLength);

	let animateDrawElem = document.createElementNS(svgNS, "animate");
	animateDrawElem.setAttribute("attributeName", "stroke-dashoffset");
	animateDrawElem.setAttribute("from", pathLength);
	animateDrawElem.setAttribute("to", "0");
	animateDrawElem.setAttribute("dur", "15s");  // Duration of animation
	animateDrawElem.setAttribute("fill", "freeze");
	pathElem.appendChild(animateDrawElem);

	/*
	let animateElem = document.createElementNS(svgNS, "animate");
	animateElem.setAttribute("attributeName", "fill");
	animateElem.setAttribute("from", "transparent");
	animateElem.setAttribute("to", "#960018");
	animateElem.setAttribute("dur", "3s");  // Duration of animation
	animateElem.setAttribute("begin", "5s");
	animateElem.setAttribute("fill", "freeze");
	pathElem.appendChild(animateElem);
	*/

	// Add the path to the SVG and the SVG to the container
	svgElem.appendChild(pathElem);
	document.getElementById("svgContainer").appendChild(svgElem);
}