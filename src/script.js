/**
 * Trying to keep it vanilla and simple 🍦
 * 
 * Rurs21
 */


document.addEventListener("DOMContentLoaded", function() {
    drawRose();
	setupTheme();
});

function generateSpiral(a, b, c, n, k, thetaIncrement, thetaMax) {
	let points = [];
	let maxPetals = n;
	
	for (let theta = 0; theta < thetaMax; theta += thetaIncrement) {
		let dynamicN = (maxPetals / thetaMax) * theta;  // Gradually increase the number of petals

		let r = (a + b * theta) * (1 + Math.exp(-k * theta) * c * Math.sin(dynamicN * theta));
		let x = r * Math.cos(theta);
		let y = r * Math.sin(theta);
		points.push([x, y]);
	}

	if(points.length > 2) {
		// Find the closest point to the last point, excluding the penultimate one
		let lastPoint = points[points.length - 1];
		let closestDistance = Infinity;
		let closestPointIndex = -1;

		for (let i = 0; i < points.length - 2; i++) {  // exclude the last and penultimate points
			let distance = Math.sqrt(Math.pow(points[i][0] - lastPoint[0], 2) + Math.pow(points[i][1] - lastPoint[1], 2));
			if (distance < closestDistance) {
				closestDistance = distance;
				closestPointIndex = i;
			}
		}

		// Append the closest point found to the list
		points.push(points[closestPointIndex]);
	}  

	return points;
}


function drawRose() {
	// Set up our constants and generate the spiral
	const a = 0, b = 4, c = 0.17, n = 5, k = 0.0257;
	const thetaIncrement = 0.17;
	const thetaMax = 9.9777 * Math.PI;
	const spiralPoints = generateSpiral(a, b, c, n, k, thetaIncrement, thetaMax);

	// Create the SVG and the path for the spiral
	const svgNS = "http://www.w3.org/2000/svg";
	let svgElem = document.createElementNS(svgNS, "svg");
	svgElem.setAttribute("width", "400");
	svgElem.setAttribute("height", "400");

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

	let animateElem = document.createElementNS(svgNS, "animate");
	animateElem.setAttribute("attributeName", "stroke-dashoffset");
	animateElem.setAttribute("from", pathLength);
	animateElem.setAttribute("to", "0");
	animateElem.setAttribute("dur", "15s");  // Duration of animation
	animateElem.setAttribute("fill", "freeze");
	pathElem.appendChild(animateElem);

	// Add the path to the SVG and the SVG to the container
	svgElem.appendChild(pathElem);
	document.getElementById("svgContainer").appendChild(svgElem);

	/* ROTATE
	let bbox = pathElem.getBBox();
	let centerX = (bbox.x + bbox.width / 2);
	let centerY = (bbox.y + bbox.height / 2);
	pathElem.setAttribute("transform", `rotate(77, ${centerX}, ${centerY})`);
	*/
}

function setupTheme() {
	// Get the theme-toggle button and body element
	const themeToggle = document.getElementById('theme-toggle');
	const body = document.body;

	// Function to toggle the theme
	const toggleTheme = function() {
		body.classList.toggle('dark');
		// Save the theme preference to localStorage
		const isDarkMode = body.classList.contains('dark');
		localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

		// Toggle the button icon based on the theme
		themeToggle.textContent = isDarkMode ? '☾' : '✹';
	}

	// Add a click event listener to the theme-toggle button
	themeToggle.addEventListener('click', toggleTheme);

	// Check for the user's theme preference in localStorage
	const savedTheme = localStorage.getItem('theme');
	if (savedTheme === 'dark') {
		body.classList.add('dark');

		themeToggle.textContent = '☾';
	}
}