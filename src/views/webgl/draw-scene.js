import { resizeCanvasToDisplaySize } from "@/utils/canvas.js"
import * as mat4 from "gl-matrix/mat4"

// base angle so the item-box sits tilted rather than face-on; spin turns it
// around the vertical (yaw) from here, drag adds extra tilt (pitch) on top
const BASE_TILT = Math.PI * -0.7

// visual center of the box+rose is y=0.5, not the origin -- rotating about
// this point instead of the origin keeps it anchored in place while spinning
const PIVOT_Y = 0.5

// item-box corners sit sqrt(3) from PIVOT_Y; framing against that (not the
// 1.0 half-width) keeps a dragged/spun box from clipping at its corners
const BOUNDING_RADIUS = Math.sqrt(3)

// empty room around that bounding sphere so the box clears every drag angle
const FRAMING_MARGIN = 1.1

// matches cube-geometry.js's FACE_COLORS ([+X, -X, +Y, -Y, +Z, -Z]) to line
// up with the shader's uGlassColors indexing -- tints the rose as if light
// passed through the item-box's glass walls
const GLASS_COLORS = [
	1.0,
	0.0,
	1.0, // +X: magenta (right face)
	0.0,
	1.0,
	1.0, // -X: cyan (left face)
	0.0,
	0.0,
	1.0, // +Y: blue (top face)
	1.0,
	1.0,
	0.0, // -Y: yellow (bottom face)
	1.0,
	0.0,
	0.0, // +Z: red (front face)
	0.0,
	1.0,
	0.0 // -Z: green (back face)
]
// fixed by design, not user-tweakable: settled on these after live-tuning
// via the (now removed) debug sliders
const AMBIENT_STRENGTH = 2
const DIRECTIONAL_STRENGTH = 1.5
const GLASS_STRENGTH = 0.35

// plain-shell edge wireframe: a fixed pale cyan, independent of light/dark
// theme, weaker than the old theme-matched brighten(plainShellColor)
const EDGE_COLOR = [0.9, 0.9, 0.9, 0.01]

// the plain shell's light is fixed rather than orbiting, coming from
// roughly the camera (eye space +Z) with a slight rightward offset
const PLAIN_SHELL_LIGHT_DIRECTION = normalize([0.3, 0, 1])
const PLAIN_SHELL_FILL_DIRECTION = normalize([-0.2, -0.3, -0.6])

function normalize(v) {
	const len = Math.hypot(v[0], v[1], v[2])
	return [v[0] / len, v[1] / len, v[2] / len]
}

// matrices the most recent frame drew with, so the hit-test below measures
// against what's on screen instead of recomputing rotation state
const lastFrame = {
	projectionMatrix: null,
	modelViewMatrix: null
}

// item-box half-extent in object space (generateCube(1.0, PIVOT_Y))
const BOX_HALF = 1

// true when (clientX, clientY) is over the item-box, not the canvas around
// it. Casts a ray from the pointer and slab-tests it against the box's
// object-space bounds -- stays correct at any rotation without a pixel readback.
function isPointerOnBox(canvas, clientX, clientY) {
	const { projectionMatrix, modelViewMatrix } = lastFrame
	// nothing drawn yet -- treat it as a hit so the box is never undraggable
	if (!projectionMatrix || !modelViewMatrix) {
		return true
	}

	const rect = canvas.getBoundingClientRect()
	if (rect.width === 0 || rect.height === 0) {
		return false
	}

	// pointer -> normalized device coords (-1..1, y flipped: CSS grows down)
	const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1
	const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1)

	const inverse = mat4.create()
	mat4.multiply(inverse, projectionMatrix, modelViewMatrix)
	if (!mat4.invert(inverse, inverse)) {
		return true
	}

	// unproject near/far plane points into the box's object space
	const near = unproject(inverse, ndcX, ndcY, -1)
	const far = unproject(inverse, ndcX, ndcY, 1)
	if (!near || !far) {
		return true
	}

	const origin = near
	const direction = [far[0] - near[0], far[1] - near[1], far[2] - near[2]]

	// slab test: clip [tMin, tMax] against each pair of parallel box faces
	const min = [-BOX_HALF, PIVOT_Y - BOX_HALF, -BOX_HALF]
	const max = [BOX_HALF, PIVOT_Y + BOX_HALF, BOX_HALF]
	let tMin = 0
	let tMax = 1

	for (let axis = 0; axis < 3; axis++) {
		const o = origin[axis]
		const dir = direction[axis]
		if (Math.abs(dir) < 1e-8) {
			// parallel to this pair of faces: only hits if already between them
			if (o < min[axis] || o > max[axis]) {
				return false
			}
			continue
		}
		let t1 = (min[axis] - o) / dir
		let t2 = (max[axis] - o) / dir
		if (t1 > t2) {
			;[t1, t2] = [t2, t1]
		}
		tMin = Math.max(tMin, t1)
		tMax = Math.min(tMax, t2)
		if (tMin > tMax) {
			return false
		}
	}

	return true
}

// NDC + inverse view-projection -> object-space point (perspective divide by w)
function unproject(inverseMatrix, x, y, z) {
	const m = inverseMatrix
	const w = m[3] * x + m[7] * y + m[11] * z + m[15]
	if (Math.abs(w) < 1e-8) {
		return null
	}
	return [
		(m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
		(m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
		(m[2] * x + m[6] * y + m[10] * z + m[14]) / w
	]
}

// eye-space light direction, orbiting around the vertical (Y) axis as lightAngle drifts
function orbitDirection(lightAngle, x, y, z) {
	const c = Math.cos(lightAngle)
	const s = Math.sin(lightAngle)
	return normalize([x * c - z * s, y, x * s + z * c])
}

function drawScene(
	gl,
	programInfo,
	buffers,
	cubeBuffers,
	spin,
	pitchOffset = 0,
	yawOffset = 0,
	bobOffset = 0,
	lightAngle = 0,
	coloredGlass = false,
	plainShellColor = [1, 1, 1, 1]
) {
	// https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
	// make the drawingbuffer match whatever size the browser has stretched the canvas
	if (document.styleSheets.length > 0) {
		resizeCanvasToDisplaySize(gl.canvas)
	}
	// adapt viewport to newSize
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

	gl.clearDepth(1.0)
	gl.enable(gl.DEPTH_TEST)
	gl.depthFunc(gl.LEQUAL) // near things obscure far things

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	const fieldOfView = (45 * Math.PI) / 180
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
	const zNear = 0.1
	const zFar = 100.0
	const projectionMatrix = mat4.create()
	mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

	// pull the camera back until the box fills the frame on any canvas shape.
	// fieldOfView is the vertical angle, so a portrait canvas (aspect < 1) is
	// tighter horizontally than that implies -- scale the angle by aspect to
	// account for it, or the box crops on portrait / floats small on wide
	const halfAngle =
		aspect < 1
			? Math.atan(Math.tan(fieldOfView / 2) * aspect)
			: fieldOfView / 2
	const cameraDistance =
		(BOUNDING_RADIUS / Math.tan(halfAngle)) * FRAMING_MARGIN

	const modelViewMatrix = mat4.create()

	// bobOffset rides on this translate (screen-space, pre-rotation) so idling
	// reads as the box bobbing in place rather than tilting. Also recenters the
	// view on PIVOT_Y, since the camera looks down the y=0 axis by default.
	mat4.translate(modelViewMatrix, modelViewMatrix, [
		-0.0,
		bobOffset - PIVOT_Y,
		-cameraDistance
	])

	// mat4.rotate composes into the current frame, so calls apply in reverse
	// order: spin (called first) ends up innermost, tilt (called second)
	// outermost -- spin turns the object on its own vertical axis, then tilt
	// angles that spinning object toward the camera. Reversing this order
	// would tilt the spin axis itself, wobbling corner-up/corner-down instead
	// of turning cleanly. yawOffset rides the spin axis, pitchOffset the tilt
	// axis. Both rotations are sandwiched in a translate to/from PIVOT_Y so
	// they happen about that point instead of the origin.
	mat4.translate(modelViewMatrix, modelViewMatrix, [0, PIVOT_Y, 0])
	mat4.rotate(modelViewMatrix, modelViewMatrix, spin + yawOffset, [0, 1, 0])
	mat4.rotate(
		modelViewMatrix,
		modelViewMatrix,
		BASE_TILT + pitchOffset,
		[1, 0, 0]
	)
	mat4.translate(modelViewMatrix, modelViewMatrix, [0, -PIVOT_Y, 0])

	// so isPointerOnBox resolves against what's actually on screen
	lastFrame.projectionMatrix = projectionMatrix
	lastFrame.modelViewMatrix = modelViewMatrix

	const normalMatrix = mat4.create()
	mat4.invert(normalMatrix, modelViewMatrix)
	mat4.transpose(normalMatrix, normalMatrix)

	gl.useProgram(programInfo.program)
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.projectionMatrix,
		false,
		projectionMatrix
	)
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.modelViewMatrix,
		false,
		modelViewMatrix
	)
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.normalMatrix,
		false,
		normalMatrix
	)
	gl.uniform3fv(programInfo.uniformLocations.glassColors, GLASS_COLORS)
	// ambient only matters for the plain shell: with the box colored, the
	// ambient only matters for the plain shell -- glass tint already fills
	// in unlit surfaces on the colored box, so ambient would just muddy it
	gl.uniform1f(
		programInfo.uniformLocations.ambientStrength,
		coloredGlass ? 0 : AMBIENT_STRENGTH
	)
	// glass tint softens contrast, so boost directional to keep it legible
	gl.uniform1f(
		programInfo.uniformLocations.directionalStrength,
		DIRECTIONAL_STRENGTH + (coloredGlass ? 0.5 : 0)
	)
	const lightDirection = coloredGlass
		? orbitDirection(lightAngle, 5, 5.2, 10)
		: PLAIN_SHELL_LIGHT_DIRECTION
	const fillDirection = coloredGlass
		? orbitDirection(lightAngle, -3, -2, -4)
		: PLAIN_SHELL_FILL_DIRECTION
	gl.uniform3fv(programInfo.uniformLocations.lightDirection, lightDirection)
	gl.uniform3fv(programInfo.uniformLocations.fillDirection, fillDirection)

	// rose first: opaque, writes depth normally, tinted by glass colors when active
	gl.uniform1f(
		programInfo.uniformLocations.glassStrength,
		coloredGlass ? GLASS_STRENGTH : 0
	)
	gl.uniform1i(programInfo.uniformLocations.isGlassSurface, 0)
	gl.disable(gl.BLEND)
	drawObject(gl, programInfo, buffers)

	// item-box shell second, translucent: no depth-write (or its far side
	// hides behind its near side) but still depth-tests against the rose
	gl.uniform1f(programInfo.uniformLocations.glassStrength, 0)
	gl.uniform1i(programInfo.uniformLocations.isGlassSurface, 1)
	gl.enable(gl.BLEND)
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
	gl.depthMask(false)
	if (coloredGlass) {
		drawObject(gl, programInfo, cubeBuffers)
	} else {
		// flat, low-alpha panes; edges get a fixed pale-cyan tint (not tied to
		// the plain shell's light/dark theme color) on top of the fresnel rim
		drawObject(gl, programInfo, cubeBuffers, plainShellColor)
		drawEdges(gl, programInfo, cubeBuffers, EDGE_COLOR)
	}
	gl.depthMask(true)
	gl.disable(gl.BLEND)
}

// constantColor, when given, overrides the per-vertex color buffer with one
// flat color -- used for the plain shell so its faces skip FACE_COLORS
function drawObject(gl, programInfo, buffers, constantColor = null) {
	setPositionAttribute(gl, buffers, programInfo)
	if (constantColor) {
		gl.disableVertexAttribArray(programInfo.attribLocations.vertexColor)
		gl.vertexAttrib4f(
			programInfo.attribLocations.vertexColor,
			constantColor[0],
			constantColor[1],
			constantColor[2],
			constantColor[3]
		)
	} else {
		setColorAttribute(gl, buffers, programInfo)
	}
	setNormalAttribute(gl, buffers, programInfo)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

	const vertexCount = buffers.count
	const type = gl.UNSIGNED_SHORT
	const offset = 0
	gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
}

// draws just the cube's 12 edges as flat-colored lines, faces skipped
function drawEdges(gl, programInfo, buffers, color) {
	setPositionAttribute(gl, buffers, programInfo)
	setNormalAttribute(gl, buffers, programInfo)

	gl.disableVertexAttribArray(programInfo.attribLocations.vertexColor)
	gl.vertexAttrib4f(
		programInfo.attribLocations.vertexColor,
		color[0],
		color[1],
		color[2],
		color[3]
	)

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.edgeIndices)
	gl.drawElements(gl.LINES, buffers.edgeCount, gl.UNSIGNED_SHORT, 0)
}

// binds the position buffer to the vertexPosition attribute
function setPositionAttribute(gl, buffers, programInfo) {
	const numComponents = 3
	const type = gl.FLOAT
	const normalize = false
	const stride = 0
	const offset = 0
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
	gl.vertexAttribPointer(
		programInfo.attribLocations.vertexPosition,
		numComponents,
		type,
		normalize,
		stride,
		offset
	)
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
}

// binds the color buffer to the vertexColor attribute
function setColorAttribute(gl, buffers, programInfo) {
	const numComponents = 4
	const type = gl.FLOAT
	const normalize = false
	const stride = 0
	const offset = 0
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
	gl.vertexAttribPointer(
		programInfo.attribLocations.vertexColor,
		numComponents,
		type,
		normalize,
		stride,
		offset
	)
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)
}

// binds the normal buffer to the vertexNormal attribute
function setNormalAttribute(gl, buffers, programInfo) {
	const numComponents = 3
	const type = gl.FLOAT
	const normalize = false
	const stride = 0
	const offset = 0
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal)
	gl.vertexAttribPointer(
		programInfo.attribLocations.vertexNormal,
		numComponents,
		type,
		normalize,
		stride,
		offset
	)
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal)
}

export { drawScene, isPointerOnBox }
