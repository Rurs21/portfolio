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

export function isCssLoaded(cssUrl, callback) {
	const styleSheets = document.styleSheets;
	for (let i = 0; i < styleSheets.length; i++) {
		const styleSheet = new URL(styleSheets[i].href).pathname;
		if (styleSheet === cssUrl) {
			callback(true);
			return;
		}
	}
	callback(false);
}