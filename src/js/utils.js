/**
 * Utils functions
 */

export function calculatePathLength(coordinates) {
	if (coordinates.length < 2) {
	  return 0; // A path with fewer than two points has zero length
	}

	let pathLength = 0;

	for (let i = 1; i < coordinates.length; i++) {
	  const [x1, y1] = coordinates[i - 1];
	  const [x2, y2] = coordinates[i];
	  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
	  pathLength += distance;
	}

	return pathLength;
}

function findMinMaxCoordinates(coordinates) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const [x, y] of coordinates) {
	  minX = Math.min(minX, x);
	  minY = Math.min(minY, y);
	  maxX = Math.max(maxX, x);
	  maxY = Math.max(maxY, y);
	}

	return { minX, minY, maxX, maxY };
}

export function calculateWidthAndHeight(coordinates) {
	const { minX, minY, maxX, maxY } = findMinMaxCoordinates(coordinates);
	const width = maxX - minX;
	const height = maxY - minY;
	return { width, height };
}

export function isCssLoaded(callback) {
	const styleSheets = document.styleSheets;
	if (styleSheets.length > 0) {
		callback(true);
		return;
	}
	callback(false);
}

export function fetchInlineSVG() {
	// if inline data, simply convert URI into svg and replace
	var svgImages = document.querySelectorAll('img[src^="data:image/svg"]');
	svgImages.forEach(imgElement => {
		const svgData = decodeURIComponent(imgElement.src.slice(imgElement.src.indexOf(',') + 1));
		imgElement.outerHTML = svgData;
	})
	// else fetch the svg
	var svgImages = document.querySelectorAll('img[src$=".svg"]');
	var replaceSVG = function(imgElement) {
		var src = imgElement.getAttribute('src');
		return fetch(src)
			.then(response => response.text())
			.then(data =>imgElement.outerHTML = data);
	}
	const fetchPromises = Array.from(svgImages, element => replaceSVG(element));
	Promise.all(fetchPromises)
		.then(() => {
			document.getElementById("links").classList.add("icon")
		})
		.catch(error => {
			console.error(error);
		});
}