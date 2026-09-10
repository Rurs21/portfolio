import { sampleSpiral } from "@/lib/flower/archimedeanSpiral.js"

const BASE_COLOR = [0.55, 0.02, 0.09]
const TIP_COLOR = [0.98, 0.55, 0.62]

function lerp(a, b, t) {
	return a + (b - a) * t
}

function lerp3(a, b, t) {
	return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

function subtract(a, b) {
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function cross(a, b) {
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]
	]
}

function normalize(v) {
	const len = Math.hypot(v[0], v[1], v[2])
	if (len < 1e-8) {
		return [0, 1, 0]
	}
	return [v[0] / len, v[1] / len, v[2] / len]
}

// A point on one petal's surface. u: 0 (base) to 1 (tip). v: -1 to 1 across the width.
function petalPoint(u, v, params) {
	const { cup, curl, maxWidth, length } = params

	// widest at the middle, pinched to nothing at base and tip
	const halfWidth = Math.sin(Math.PI * u) * maxWidth * 0.5

	// bend the flat strip into an arc so the petal cups; radius = halfWidth/cupAngle
	// keeps arc length constant as cupping increases toward the tip (u^1.5)
	const cupAngle = cup * Math.pow(u, 1.5)
	let y = halfWidth * v
	let z = 0
	if (cupAngle > 1e-6) {
		const arcRadius = halfWidth / cupAngle
		y = Math.sin(cupAngle * v) * arcRadius
		z = arcRadius - Math.cos(cupAngle * v) * arcRadius
	}

	// length, plus a quadratic lean so the petal curves instead of sticking out straight
	const x = u * length + curl * u * u * length * 0.5

	return [x, y, z]
}

// builds one petal's vertex grid + triangle indices, appending into shared arrays
function buildPetal(params, transform, colorInner, colorOuter, out) {
	const { lengthSegments, widthSegments } = params
	const baseIndex = out.positions.length / 3

	for (let i = 0; i <= lengthSegments; i++) {
		const u = i / lengthSegments
		for (let j = 0; j <= widthSegments; j++) {
			const v = (j / widthSegments) * 2 - 1

			const p = petalPoint(u, v, params)
			const pu = petalPoint(Math.min(u + 0.01, 1), v, params)
			const pv = petalPoint(u, Math.min(v + 0.01, 1), params)

			const tangentU = subtract(pu, p)
			const tangentV = subtract(pv, p)
			let normal = normalize(cross(tangentU, tangentV))

			const world = transform(p)
			const normalWorld = transform(
				[p[0] + normal[0], p[1] + normal[1], p[2] + normal[2]],
				true
			)
			const n = normalize(subtract(normalWorld, world))

			out.positions.push(world[0], world[1], world[2])
			out.normals.push(n[0], n[1], n[2])

			const color = lerp3(colorInner, colorOuter, u)
			out.colors.push(color[0], color[1], color[2], 1.0)
		}
	}

	const rowLength = widthSegments + 1
	for (let i = 0; i < lengthSegments; i++) {
		for (let j = 0; j < widthSegments; j++) {
			const a = baseIndex + i * rowLength + j
			const b = a + 1
			const c = a + rowLength
			const d = c + 1

			out.indices.push(a, c, b, b, c, d)
		}
	}
}

// places a petal at `radius` from the axis, base pinned there, tilted about that
// base (tilt=0 flat & open, tilt=pi/2 curled up over the center) and spun by `angle`.
// local space: x = length, y = width, z = cup depth. Width must stay tangential
// (not become world-Y) so petals fan out angularly instead of standing up as walls.
function makeTransform(radius, height, angle, tilt, scale) {
	const cosT = Math.cos(tilt)
	const sinT = Math.sin(tilt)
	const cosA = Math.cos(angle)
	const sinA = Math.sin(angle)

	return (p, directionOnly = false) => {
		const sx = p[0] * scale
		const sy = p[1] * scale
		const sz = p[2] * scale

		// fold length+cup into the vertical plane along the radial direction
		const radial = radius - sx * sinT + sz * cosT
		const py = sx * cosT + sz * sinT

		// radial direction is (cosA, sinA); tangential (width) is perpendicular: (-sinA, cosA)
		const rx = radial * cosA - sy * sinA
		const rz = radial * sinA + sy * cosA

		if (directionOnly) {
			return [rx - radius * cosA, py, rz - radius * sinA]
		}

		return [rx, py + height, rz]
	}
}

// Plain Archimedean spiral: r(theta) = 1 + theta. No lobing modulation --
// computePetalPlacements normalizes radius to outerRadius anyway, which
// flattened out a decaying-lobe wobble (see @/lib/flower/archimedeanSpiral.js)
// when tried, so it's not worth the extra parameters.
const SAMPLES_PER_WINDING = 8

// ~137.5deg, phyllotaxis. Irrational relative to a full turn, so petals
// never line up into spokes -- they interleave instead.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

// exposed separately so the top-down SVG diagram can draw the curve itself
function computeSpiralCurve(spiralWindings) {
	return sampleSpiral(
		1,
		1,
		(Math.PI * 2) / SAMPLES_PER_WINDING,
		Math.PI * 2 * spiralWindings,
		() => 1
	)
}

// per-petal placement (radius, angle, height, tilt, scale); shared by the
// 3D mesh builder (generateWhorls) and the top-down SVG diagram
function computePetalPlacements(params) {
	const { spiralWindings, bloomOpenness, outerRadius, innerScale } = params

	const bloomHeight = params.length * 0.6
	const maxTilt = Math.PI * 0.47
	const minTilt = Math.PI * 0.03
	const openTilt = lerp(maxTilt, minTilt, bloomOpenness)

	const points = computeSpiralCurve(spiralWindings)

	// walk the spiral in reverse: outermost sample -> petal 0 (outer, flat),
	// innermost -> last petal (center, upright)
	const pointCount = points.length
	// normalize by the curve's own max radius so outerRadius alone sets bloom size
	const maxCurveRadius = Math.max(...points.map(([x, y]) => Math.hypot(x, y)))
	// rotates the arrangement as windings change, so the outer petal moves too
	const windingsOffset = spiralWindings * GOLDEN_ANGLE

	const placements = []
	for (let i = 0; i < pointCount; i++) {
		const [x, y] = points[pointCount - 1 - i]
		// 0 at the outer edge, 1 at the center
		const t = pointCount > 1 ? i / (pointCount - 1) : 0

		// radius from the spiral, angle from phyllotaxis -- unrelated rules
		const radius = (Math.hypot(x, y) / maxCurveRadius) * outerRadius
		const angle = i * GOLDEN_ANGLE + windingsOffset

		// outer petals lie open and flat, inner ones stand up over the center
		const height = lerp(0, bloomHeight, t)
		const tilt = lerp(openTilt, maxTilt, t * t)
		const scale = lerp(1.0, innerScale, t)

		placements.push({ radius, angle, height, tilt, scale })
	}
	return placements
}

function generateWhorls(params, out) {
	const placements = computePetalPlacements(params)
	for (const { radius, angle, height, tilt, scale } of placements) {
		const transform = makeTransform(radius, height, angle, tilt, scale)
		buildPetal(params, transform, BASE_COLOR, TIP_COLOR, out)
	}
}

// fills in fixed shape constants around the user-facing params
// (spiralWindings/bloomOpenness/outerRadius)
function withFullParams(params) {
	return {
		lengthSegments: 8,
		widthSegments: 6,
		length: 1.0,
		maxWidth: 0.85,
		// fixed by design, not user-tweakable: this combination reads best
		cup: 1,
		curl: 1,
		// innermost petal's own half-width has to stay well under its radius
		// from the axis (~0.067 at default outerRadius), or petals across the
		// center clip into each other -- 0.15 was too close to that limit
		innerScale: 0.08,
		...params
	}
}

function generateRose(params) {
	const fullParams = withFullParams(params)

	const out = { positions: [], normals: [], colors: [], indices: [] }

	generateWhorls(fullParams, out)

	return {
		positions: new Float32Array(out.positions),
		normals: new Float32Array(out.normals),
		colors: new Float32Array(out.colors),
		indices: new Uint16Array(out.indices)
	}
}

export {
	generateRose,
	computePetalPlacements,
	computeSpiralCurve,
	withFullParams
}
