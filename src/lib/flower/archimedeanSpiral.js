/**
 * Archimedean spiral sampling.
 *
 *   r(θ) = (a + bθ) · modulate(θ)
 *
 * (a + bθ) is the spiral proper: radius grows at a steady rate, so
 * successive turns are evenly spaced. `a` is the starting radius, `b` the
 * growth per radian.
 *
 * `modulate` is whatever rides on top of it. Return 1 for a bare spiral, or
 * something oscillating to push the radius in and out and give the curve
 * petal-like lobes. It's a parameter rather than a fixed formula because the
 * two curves built on this file want genuinely different oscillations --
 * see archimedeanFlower.js and the webgl rose.
 *
 * Returns [x, y] pairs, θ running from 0 (inclusive) to thetaMax
 * (exclusive) in steps of thetaIncrement.
 */
export function sampleSpiral(a, b, thetaIncrement, thetaMax, modulate) {
	const points = []

	for (let theta = 0; theta < thetaMax; theta += thetaIncrement) {
		const r = (a + b * theta) * modulate(theta)
		points.push([r * Math.cos(theta), r * Math.sin(theta)])
	}

	return points
}

/**
 * A decaying sinusoidal modulation, the usual way to turn a plain spiral
 * into a flower outline:
 *
 *   1 + c · e^(−kθ) · sin(frequency(θ) · θ)
 *
 * sin bulges and pinches the radius; e^(−kθ) fades that wobble as the
 * spiral winds outward, so lobes read strongest near the center. `c` is
 * lobe depth, `k` how fast they fade.
 *
 * `frequency` is a function of θ, not a constant, so the lobe rate can
 * either stay fixed (`() => n`) or ramp along the curve.
 */
export function decayingLobes(c, k, frequency) {
	return (theta) =>
		1 + c * Math.exp(-k * theta) * Math.sin(frequency(theta) * theta)
}
