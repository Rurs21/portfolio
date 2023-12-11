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

/**
 * Transforms HTML image elements with SVG sources, including external SVG files (ending in ".svg")
 * and inline SVG sources (starting with "data:image/svg"), into inline SVG elements.
 *
 * @param {NodeList} svgImages - A NodeList containing HTML <img> elements with SVG sources.
 * @returns {Array<Promise>} An array of Promises, each representing the processing of an svg image.
 * @throws {Error} If an element is not an HTML <img> element with an SVG source.
 */
export function setImagesToSVG(svgImages) {
	var fetchSVG = function(imgElement) {
		var src = imgElement.getAttribute('src');
		return fetch(src)
			.then(response => {
				const contentType = response.headers.get("Content-Type");
				if (!response.ok || !contentType.includes("svg")) {
					throw new Error(`Failed to fetch SVG: ${response.statusText}`);
				}
				return response.text();
			})
			.then(data =>imgElement.outerHTML = data);
	}
	var decodeBase64ToSVG = function(imgElement) {
		return new Promise((resolve, reject) => {
			try {
				const base64svg = imgElement.src.slice(imgElement.src.indexOf(',') + 1);
				const svgData = decodeURIComponent(base64svg);
				imgElement.outerHTML = svgData;
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}
	return Array.from(svgImages, imgElement => {
		if (imgElement instanceof HTMLImageElement) {
			if (imgElement.src.endsWith(".svg")) {
				return fetchSVG(imgElement)
			} else if (imgElement.src.startsWith("data:image/svg")) {
				return decodeBase64ToSVG(imgElement)
			}
		}
		return Promise.reject(new Error("Not an HTML image element with an SVG source."));
	});
}