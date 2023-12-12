/**
 * Geometry Utility Functions
 *
 * This module provides utility functions for performing geometric calculations on sets of coordinates.
 * It includes functions to calculate the length of a path, find the minimum and maximum coordinates,
 * and determine the width and height.
 *
 * Primarily used to creatr SVG (Scalable Vector Graphics)
 *
 * @module geometry
 */

/**
 * Calculates the length of a path defined by an array of coordinates.
 *
 * @param {Array<Array<number>>} coordinates - An array of coordinate pairs.
 * @returns {number} The length of the path.
 * @throws {Error} Throws an error if the input coordinates array is empty.
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

/**
 * Finds the minimum and maximum coordinates from an array of coordinates.
 *
 * @param {Array<Array<number>>} coords - An array of coordinate pairs.
 * @returns {Object} An object containing minX, minY, maxX, and maxY values.
 * @throws {Error} Throws an error if the input coordinates array is empty.
 */
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

/**
 * Calculates the width and height of a bounding box that encompasses a set of coordinates.
 *
 * @param {Array<Array<number>>} coordinates - An array of coordinate pairs.
 * @returns {Object} An object containing the width and height of the bounding box.
 * @throws {Error} Throws an error if the input coordinates array is empty.
 */
export function calculateWidthAndHeight(coordinates) {
	const { minX, minY, maxX, maxY } = findMinMaxCoordinates(coordinates);
	const width = maxX - minX;
	const height = maxY - minY;
	return { width, height };
}