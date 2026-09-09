import { decayingLobes, sampleSpiral } from "@/lib/flower/archimedeanSpiral.js"

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

// A point on one petal's surface.
//   u = 0 at the base, 1 at the tip
//   v = -1 to 1 across the width
function petalPoint(u, v, params) {
	const { cup, curl, maxWidth, length } = params

	// widest at the middle, pinched to nothing at base and tip
	const halfWidth = Math.sin(Math.PI * u) * maxWidth * 0.5

	// Bend that flat strip sideways into an arc so the petal cups. The arc
	// spans `cupAngle` radians; picking its radius as halfWidth/cupAngle
	// keeps the arc length equal to halfWidth, so the petal doesn't get
	// narrower as it cups harder. Cupping ramps up toward the tip (u^1.5).
	const cupAngle = cup * Math.pow(u, 1.5)
	let y = halfWidth * v
	let z = 0
	if (cupAngle > 1e-6) {
		const arcRadius = halfWidth / cupAngle
		y = Math.sin(cupAngle * v) * arcRadius
		z = arcRadius - Math.cos(cupAngle * v) * arcRadius
	}

	// length, plus a quadratic lean so the petal curves rather than sticking
	// out as a straight spike
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

// place a petal at `radius` from the central axis, base pinned there, then
// fold it about that base point: tilt=0 lays it flat & outward (open outer
// petal), tilt=pi/2 curls its tip up and back in over the center (closed
// inner petal/bud), then spin the whole thing around Y by `angle`.
// local space: x = along petal length (base->tip), y = across petal width,
// z = cup depth. Width (y) must end up tangential (perpendicular to the
// radial direction, in the horizontal plane) so petals fan out angularly
// and overlap their neighbors -- it must NOT become world-Y (height).
function makeTransform(radius, height, angle, tilt, scale) {
	const cosT = Math.cos(tilt)
	const sinT = Math.sin(tilt)
	const cosA = Math.cos(angle)
	const sinA = Math.sin(angle)

	return (p, directionOnly = false) => {
		const sx = p[0] * scale
		const sy = p[1] * scale
		const sz = p[2] * scale

		// fold length+cup within the vertical plane containing the radial
		// direction: base at radial distance `radius`, tip rises in height
		// and pulls in toward the axis as tilt grows; cup depth (sz) also
		// rides along the radial direction so cupping reads as bowl curvature
		const radial = radius - sx * sinT + sz * cosT
		const py = sx * cosT + sz * sinT

		// radial direction is (cosA, sinA) in the X-Z plane; tangential
		// (petal width) direction is perpendicular to it: (-sinA, cosA)
		const rx = radial * cosA - sy * sinA
		const rz = radial * sinA + sy * cosA

		if (directionOnly) {
			return [rx - radius * cosA, py, rz - radius * sinA]
		}

		return [rx, py + height, rz]
	}
}

// The spiral the petals sit on:
//
//   r(theta) = (1 + theta) * (1 + c * e^(-k*theta) * sin(n*theta))
//
// The spiral and the decaying-lobe modulation are shared with the site's
// background rose (see @/lib/flower/archimedeanSpiral.js). What differs
// here is the lobe rate: it stays fixed at n rather than ramping, because
// this curve's theta range is tied to n (thetaMax = 2*PI*n) and a ramping
// rate would cancel against that -- (n/thetaMax)*theta reduces to
// theta/(2*PI) whatever n is, leaving spiralWindings with no effect on
// lobing at all.
//
// Only spiralWindings (n) is user-facing: it sets both how many turns the
// spiral makes and how many lobes ride on each turn. The rest stay fixed
// because computePetalPlacements normalizes radius so the outermost petal
// always lands on outerRadius, which makes changing them invisible.
const CURVE_C = 0.3 // lobe depth
const CURVE_K = 0.15 // how fast lobes fade outward
const SAMPLES_PER_WINDING = 8

// Golden angle, ~137.5deg. Real plants rotate by this much between
// successive leaves/petals/seeds (phyllotaxis). Because it's irrational
// relative to a full turn, no two petals ever line up into a straight
// spoke -- they interleave and pack tightly instead.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

// The raw spiral points, exposed separately so the top-down SVG diagram can
// draw the curve itself and not just the petals sitting on it.
function computeSpiralCurve(spiralWindings) {
	return sampleSpiral(
		1,
		1,
		(Math.PI * 2) / SAMPLES_PER_WINDING,
		Math.PI * 2 * spiralWindings,
		decayingLobes(CURVE_C, CURVE_K, () => spiralWindings)
	)
}

// per-petal placement (radius + angle from the central axis, plus the t
// gradient position and derived height/tilt/scale) for the given params --
// the single source of truth for where each petal goes, shared by the 3D
// mesh builder (generateWhorls) and the top-down SVG diagram
function computePetalPlacements(params) {
	const { spiralWindings, bloomOpenness, outerRadius, innerScale } = params

	const bloomHeight = params.length * 0.6
	const maxTilt = Math.PI * 0.47
	const minTilt = Math.PI * 0.03
	const openTilt = lerp(maxTilt, minTilt, bloomOpenness)

	const points = computeSpiralCurve(spiralWindings)

	// The spiral grows outward, but a bloom is the other way round: big flat
	// petals on the outside, small upright ones converging at the center. So
	// walk the points in reverse -- the spiral's outermost sample becomes
	// petal 0 (outer), its innermost becomes the last (center).
	const pointCount = points.length
	// Divide out the curve's own largest radius so outerRadius alone decides
	// bloom size, and the outermost petal lands on it exactly.
	const maxCurveRadius = Math.max(...points.map(([x, y]) => Math.hypot(x, y)))
	// Rotate the whole arrangement by a windings-dependent amount. Without
	// it petal 0 would always sit at angle 0 -- and since its radius is
	// pinned to outerRadius too, it would be the one petal that never moves
	// when you change the spiral windings.
	const windingsOffset = spiralWindings * GOLDEN_ANGLE

	const placements = []
	for (let i = 0; i < pointCount; i++) {
		const [x, y] = points[pointCount - 1 - i]
		// 0 at the outer edge, 1 at the center
		const t = pointCount > 1 ? i / (pointCount - 1) : 0

		// Radius comes from the spiral; angle comes from phyllotaxis. Each
		// petal is turned a further ~137.5deg from the last, so they
		// interleave instead of stacking into spokes.
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

// fills in the fixed-by-design shape constants around the user-facing
// params (spiralWindings/bloomOpenness/outerRadius) -- shared by
// generateRose and anything else (the top-down SVG diagram) that needs
// computePetalPlacements' full param set without duplicating these defaults
function withFullParams(params) {
	return {
		lengthSegments: 8,
		widthSegments: 6,
		length: 1.0,
		maxWidth: 0.85,
		// fixed by design, not user-tweakable: this combination reads best
		cup: 1,
		curl: 1,
		innerScale: 0.15,
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
