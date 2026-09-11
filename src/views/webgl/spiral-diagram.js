import {
	computePetalPlacements,
	computeSpiralCurve,
	withFullParams
} from "./rose-geometry.js"

// half the SVG viewBox side; the diagram always fills the same visual space
// regardless of the outerRadius slider, which only scales the 3D bloom
const DIAGRAM_RADIUS = 90
const SVG_NS = "http://www.w3.org/2000/svg"

// matches rose-geometry.js's BASE_COLOR (outer) -> TIP_COLOR (inner) lerp
function petalGradientColor(t) {
	const base = [0.55, 0.02, 0.09]
	const tip = [0.98, 0.55, 0.62]
	const [r, g, b] = base.map((c, i) => c + (tip[i] - c) * t)
	return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}

// top-down view of the same spiral/petal placements the 3D mesh uses --
// draws the curve as a path and each petal as a dot, colored to match the bloom
function updateSpiralDiagram(params) {
	const path = document.querySelector("#rose-spiral-path")
	const pointsGroup = document.querySelector("#rose-spiral-points")
	const petalCountValue = document.querySelector("#rose-petal-count-value")
	if (!path || !pointsGroup) {
		return
	}

	const fullParams = withFullParams(params)
	const { spiralWindings, outerRadius } = fullParams

	// placements' radius is already outerRadius-scaled; dividing that back out
	// first puts it in the same units as the raw curve before scaling to DIAGRAM_RADIUS
	const curvePoints = computeSpiralCurve(spiralWindings)
	const maxCurveRadius = Math.max(
		...curvePoints.map(([x, y]) => Math.hypot(x, y))
	)
	const scale = DIAGRAM_RADIUS / maxCurveRadius

	const pathData = curvePoints
		.map(([x, y], i) => {
			const px = x * scale
			const py = y * scale
			return `${i === 0 ? "M" : "L"}${px.toFixed(2)},${py.toFixed(2)}`
		})
		.join(" ")
	path.setAttribute("d", pathData)

	pointsGroup.replaceChildren()
	const placements = computePetalPlacements(fullParams)
	if (petalCountValue) {
		petalCountValue.textContent = String(placements.length)
	}
	for (const { radius, angle, height } of placements) {
		const displayRadius = (radius / outerRadius) * maxCurveRadius * scale
		const x = Math.cos(angle) * displayRadius
		const y = Math.sin(angle) * displayRadius

		const circle = document.createElementNS(SVG_NS, "circle")
		circle.setAttribute("cx", x.toFixed(2))
		circle.setAttribute("cy", y.toFixed(2))
		circle.setAttribute("r", "3")
		// height doubles as the same outer->inner gradient cue the 3D petals use
		const t = Math.min(1, height / (fullParams.length * 0.6))
		circle.setAttribute("fill", petalGradientColor(t))
		pointsGroup.appendChild(circle)
	}
}

export { updateSpiralDiagram }
