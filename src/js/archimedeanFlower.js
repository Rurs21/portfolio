/**
 * Archimedean Flower
 * 
 * This script generates a flower-like curve based on a polar coordinate equation inspired by 
 * Archimedean spirals. The equation defines the curve as:
 *
 * r(θ) = (a + bθ) [ 1 + e^-kθ c sin(θ_max/n θ) ]
 *
 * Components:
 * - r(θ): Radial distance from the origin to a point on the curve for a given angle θ.
 *
 * - θ: The polar angle, measured in radians. As θ varies, it causes the curve to be traced out.
 *       Starts from 0 and increases up to θ_max to form the full flower shape.
 *
 * - θ_max: The maximum value for θ. It determines the extent to which the rose is drawn. 
 *          For a complete flower shape, θ_max might be set to a multiple of 2π, but it can be 
 *          adjusted to generate partial flowers or specific curve spans.
 * 
 * - a, b: Constants that determine the initial size (a) and spacing (b) of the spirals.
 *
 * - e^-kθ: Introduces an exponential decay based on θ. 'e' is the base of natural logarithm.
 *          'k' determines the decay rate; larger 'k' leads to faster spiral decay.
 *
 * - c sin(θ_max/n θ): A sinusoidal component that gives the petal-like oscillations.
 *          'c' defines the amplitude or size of the petals.
 *          'n' dictates the number of petals or oscillations.
 *          θ_max/n is a normalization factor for consistent petal count across θ's range.
 *
 * By tweaking the parameters a, b, c, k, n, and θ_max, various flower-like shapes, from simple spirals
 * to complex multi-petaled flowers, can be generated.
 */


export function archimedeanFlower(a, b, c, n, k, thetaIncrement, thetaMax) {
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


