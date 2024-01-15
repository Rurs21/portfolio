import { archimedeanFlower } from "./archimedeanFlower.js"
import { createCoordinatesSVG, defineSVG } from "@/utils/svg.js"

function rose(strokeColor = "#E4345A", strokeWidth = 1, drawingDuration, id = "rose-svg") {
	// Set up our constants to generate the spiral rose
	const a = 4,
		b = 4,
		c = 0.17,
		n = 5,
		k = 0.0257
	const thetaIncrmt = 0.17
	const thetaMax = 5 * 2 * Math.PI
	//  rose coordinates
	const rosePoints = archimedeanFlower(a, b, c, n, k, thetaIncrmt, thetaMax)

	// svg properties
	const svgElement = createCoordinatesSVG(rosePoints, strokeColor, strokeWidth, drawingDuration)
	const svgId = id,
		svgTitle = "Archimedean's Rose",
		svgDesc = "Rose drawn with the Archimedean spiral equation"
	defineSVG(svgElement, svgId, svgTitle, svgDesc)

	return svgElement
}

export { rose }
