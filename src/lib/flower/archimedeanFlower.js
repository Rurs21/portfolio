import { decayingLobes, sampleSpiral } from "./archimedeanSpiral.js"

/**
 * Archimedean Flower
 *
 * A flower-like curve in polar coordinates:
 *
 *   r(θ) = (a + bθ) · [ 1 + c · e^(−kθ) · sin(dynamicN(θ) · θ) ]
 *
 * The spiral and the decaying-lobe modulation both come from
 * archimedeanSpiral.js. What's specific to this curve is that the lobe rate
 * ramps rather than staying fixed:
 *
 *   dynamicN(θ) = (n / θmax) · θ
 *
 * so it sweeps 0 → n across the curve. Lobes start slow and tighten as the
 * spiral winds out, which is what gives the drawn rose its coiled center.
 *
 * Parameters: a = starting radius, b = spiral growth per radian, c = lobe
 * depth, n = lobe rate reached at θmax, k = how fast lobes fade.
 *
 * NOTE: this function reproduces src/assets/svg/rose.svg -- the site's
 * background rose -- exactly, given (4, 4, 0.17, 5, 0.0257, 0.17, 10π).
 * Changing the formula or the closing point below changes that artwork.
 * Anything wanting different flower math should build its own curve on
 * archimedeanSpiral.js instead of retuning this.
 */
export function archimedeanFlower(a, b, c, n, k, thetaIncrement, thetaMax) {
	const rampingLobes = (theta) => (n / thetaMax) * theta
	const points = sampleSpiral(
		a,
		b,
		thetaIncrement,
		thetaMax,
		decayingLobes(c, k, rampingLobes)
	)

	if (points.length > 2) {
		points.push(points[closestToLastIndex(points)])
	}

	return points
}

// Index of the point nearest the final sample, ignoring the last two. Used
// to close the drawn outline: the curve is stroked as an open path, so
// repeating whichever earlier point the end passes closest to joins it back
// onto itself.
function closestToLastIndex(points) {
	const [lastX, lastY] = points[points.length - 1]
	let closestDistance = Infinity
	let closestIndex = -1

	for (let i = 0; i < points.length - 2; i++) {
		const distance = Math.hypot(points[i][0] - lastX, points[i][1] - lastY)
		if (distance < closestDistance) {
			closestDistance = distance
			closestIndex = i
		}
	}

	return closestIndex
}
