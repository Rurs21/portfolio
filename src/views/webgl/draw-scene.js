import { resizeCanvasToDisplaySize } from "@/utils/canvas.js"
import * as mat4 from "gl-matrix/mat4"

// fixed base tilt so the item-box sits at an angle rather than face-on;
// spin then only turns around the vertical axis (yaw) from here, and the
// user's drag adds extra tilt (pitch) on top of this base
const BASE_TILT = Math.PI * -0.7

// the cube (cube-geometry.js's default centerY) and the rose (which only
// grows upward from y=0, never below) are both shifted so the item-box
// visually wraps the bloom -- their combined visual center sits at y=0.5,
// not the origin. Rotating about the origin therefore spins everything
// around a point near the cube's bottom edge instead of its middle, which
// reads as the whole thing orbiting off-anchor. Pivoting the rotation about
// this point instead keeps it visually anchored in place while spinning.
const PIVOT_Y = 0.5

// the item-box is generateCube(1.0, PIVOT_Y): it spans +/-1 in x/z and
// PIVOT_Y +/-1 in y, so every corner sits sqrt(3) away from the pivot it
// tumbles about. Framing against that radius (rather than the 1.0 half-width)
// is what keeps a dragged/spun box from clipping at its corners.
const BOUNDING_RADIUS = Math.sqrt(3)

// how much empty room to leave around that sphere: the box fills ~73% of the
// frame at rest and still clears every drag angle without clipping. That only
// works because the view is centered on PIVOT_Y below -- framing an off-center
// object has to leave slack for the offset itself, which cost both a chunk of
// size and the clip-free guarantee.
const FRAMING_MARGIN = 1.1

// matches cube-geometry.js's FACE_COLORS, in [+X, -X, +Y, -Y, +Z, -Z] order
// to line up with the shader's uGlassColors indexing -- used to tint the
// rose as if colored light were passing through the item-box's glass walls
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

// the plain shell's light is fixed rather than orbiting, coming from
// roughly the camera (eye space +Z) with a slight rightward offset
const PLAIN_SHELL_LIGHT_DIRECTION = normalize([0.3, 0, 1])
const PLAIN_SHELL_FILL_DIRECTION = normalize([-0.2, -0.3, -0.6])

function normalize(v) {
	const len = Math.hypot(v[0], v[1], v[2])
	return [v[0] / len, v[1] / len, v[2] / len]
}

// the matrices the most recent frame actually drew with, kept so the pointer
// hit-test below measures against what's on screen (including whatever the
// current drag/spin has rotated it to) instead of recomputing that state
const lastFrame = {
	projectionMatrix: null,
	modelViewMatrix: null
}

// half-extent of the item-box in object space: generateCube(1.0, PIVOT_Y)
// spans +/-1 on x/z and PIVOT_Y +/-1 on y
const BOX_HALF = 1

// true when (clientX, clientY) is over the item-box itself rather than the
// empty canvas around it. Casts a ray from the pointer through the scene and
// slab-tests it against the box's object-space bounds, which stays correct at
// any rotation without needing a depth/color readback (the drawing buffer is
// cleared every frame, so reading pixels back isn't reliable here).
function isPointerOnBox(canvas, clientX, clientY) {
	const { projectionMatrix, modelViewMatrix } = lastFrame
	// nothing drawn yet -- treat it as a hit so the box never becomes
	// undraggable if a pointer lands before the first frame
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

	// unproject the near and far plane points, giving the ray through the
	// pointer expressed directly in the box's own object space
	const near = unproject(inverse, ndcX, ndcY, -1)
	const far = unproject(inverse, ndcX, ndcY, 1)
	if (!near || !far) {
		return true
	}

	const origin = near
	const direction = [far[0] - near[0], far[1] - near[1], far[2] - near[2]]

	// slab test, per axis: clip the ray's [tMin, tMax] span against each pair
	// of parallel box faces. They still overlap at the end <=> the ray hits.
	const min = [-BOX_HALF, PIVOT_Y - BOX_HALF, -BOX_HALF]
	const max = [BOX_HALF, PIVOT_Y + BOX_HALF, BOX_HALF]
	let tMin = 0
	let tMax = 1

	for (let axis = 0; axis < 3; axis++) {
		const o = origin[axis]
		const dir = direction[axis]
		if (Math.abs(dir) < 1e-8) {
			// ray runs parallel to this pair of faces: it can only hit if it
			// already starts between them
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

// eye-space light direction, orbiting around the vertical (Y) axis as
// lightAngle drifts -- keeps the same elevation/distance the original
// fixed vector had
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

	//gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
	gl.clearDepth(1.0) // Clear everything
	gl.enable(gl.DEPTH_TEST) // Enable depth testing
	gl.depthFunc(gl.LEQUAL) // Near things obscure far things

	// Clear the canvas before we start drawing on it.

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// Create a perspective matrix, a special matrix that is
	// used to simulate the distortion of perspective in a camera.
	// Our field of view is 45 degrees, with a width/height
	// ratio that matches the display size of the canvas
	// and we only want to see objects between 0.1 units
	// and 100 units away from the camera.

	const fieldOfView = (45 * Math.PI) / 180 // in radians
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
	const zNear = 0.1
	const zFar = 100.0
	const projectionMatrix = mat4.create()

	// note: glmatrix.js always has the first argument
	// as the destination to receive the result.
	mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

	// pull the camera to wherever the box actually fills the frame, instead of
	// a fixed distance tuned for one canvas shape. fieldOfView is the VERTICAL
	// angle, so a canvas narrower than it is tall (aspect < 1) is horizontally
	// tighter than the vertical fit implies -- dividing the effective angle by
	// the aspect there backs the camera off just enough to fit the width too.
	// Without it the box crops on a portrait canvas and floats in dead space
	// on a wide one.
	const halfAngle =
		aspect < 1
			? Math.atan(Math.tan(fieldOfView / 2) * aspect)
			: fieldOfView / 2
	const cameraDistance =
		(BOUNDING_RADIUS / Math.tan(halfAngle)) * FRAMING_MARGIN

	// Set the drawing position to the "identity" point, which is
	// the center of the scene.
	const modelViewMatrix = mat4.create()

	// Now move the drawing position a bit to where we want to
	// start drawing the square.
	// bobOffset rides on this translate (screen-space up/down, in view space
	// before any rotation) rather than on the object's own rotated axes, so
	// idling reads as the whole item-box physically bobbing in place instead
	// of just tilting
	// the box tumbles about PIVOT_Y, but the camera looks down the y=0 axis,
	// so without pulling the view down by that same amount the whole box sits
	// high in the frame -- clipping at the top while leaving dead space at the
	// bottom. Offsetting here centers the pivot (and therefore the box) on the
	// view axis, so the framing above is measured against a centered object.
	mat4.translate(
		modelViewMatrix, // destination matrix
		modelViewMatrix, // matrix to translate
		[-0.0, bobOffset - PIVOT_Y, -cameraDistance]
	) // amount to translate

	// mat4.rotate composes the new rotation into the CURRENT local frame, so
	// calls here apply to vertices in the reverse of call order: the call
	// listed last runs first (innermost, in object space), and the call
	// listed first wraps around that result last (outermost, closer to the
	// camera). We want spin to turn the object around its own untilted
	// vertical axis first (innermost), then the fixed tilt to angle that
	// whole spinning object toward the camera (outermost) -- so spin is
	// called first here, tilt second. Getting this order backwards tilts the
	// spin axis itself, making the object wobble between corner-up and
	// corner-down instead of turning cleanly in place. yawOffset rides on
	// the same axis as spin (dragging left/right just adds extra turn),
	// while pitchOffset rides on the base tilt axis (dragging up/down tips
	// it further forward/back).
	//
	// the two rotate calls need to happen about PIVOT_Y, not the origin (see
	// PIVOT_Y above), so they're sandwiched between a translate up to the
	// pivot and back down. Since these compose in reverse (last call runs
	// first, against the raw object-space vertices), the actual order
	// applied is: shift down by -PIVOT_Y (centering the pivot at the
	// origin), rotate, rotate, then shift back up by +PIVOT_Y.
	mat4.translate(modelViewMatrix, modelViewMatrix, [0, PIVOT_Y, 0])
	mat4.rotate(modelViewMatrix, modelViewMatrix, spin + yawOffset, [0, 1, 0])
	mat4.rotate(
		modelViewMatrix,
		modelViewMatrix,
		BASE_TILT + pitchOffset,
		[1, 0, 0]
	)
	mat4.translate(modelViewMatrix, modelViewMatrix, [0, -PIVOT_Y, 0])

	// keep the exact matrices this frame drew with, so a pointer hit-test
	// (see isPointerOnBox) resolves against what's actually on screen rather
	// than recomputing the camera and rotation state a second time
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
	// glass tint already fills in unlit surfaces, so ambient on top just
	// muddies it; the plain shell has no glass tint, so ambient is what
	// keeps its unlit surfaces from going flat black
	gl.uniform1f(
		programInfo.uniformLocations.ambientStrength,
		coloredGlass ? 0 : AMBIENT_STRENGTH
	)
	// colored surfaces read a bit flat under the default directional
	// strength since the glass tint already softens contrast -- boosting it
	// here keeps the rose's shading legible without touching the plain
	// shell, which is already tuned against ambient instead
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

	// rose first: opaque, writes depth normally, tinted by the glass colors
	// as if light passed through the box walls onto it -- only while the
	// colored-glass effect is active, since the plain shell isn't tinting anything
	gl.uniform1f(
		programInfo.uniformLocations.glassStrength,
		coloredGlass ? GLASS_STRENGTH : 0
	)
	gl.disable(gl.BLEND)
	drawObject(gl, programInfo, buffers)

	// item-box shell second: translucent either way, so it must not
	// depth-write (or the far side of the cube gets hidden behind its own
	// near side) but must still depth-test against the rose so it wraps
	// around it correctly. No glass tint on the cube itself -- it's the
	// light source, not the thing being lit.
	gl.uniform1f(programInfo.uniformLocations.glassStrength, 0)
	gl.enable(gl.BLEND)
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
	gl.depthMask(false)
	if (coloredGlass) {
		// per-face FACE_COLORS from the vertex buffer, unlit (the glass
		// effect reads as colored light, not a lit surface)
		drawObject(gl, programInfo, cubeBuffers)
	} else {
		// flat, low-alpha, no color tint -- barely-there panes with edges
		// that stay a bit brighter (drawEdges below) so the box outline is
		// still legible without the old hard-contrast wire cage
		drawObject(gl, programInfo, cubeBuffers, plainShellColor)
		drawEdges(gl, programInfo, cubeBuffers, brighten(plainShellColor))
	}
	gl.depthMask(true)
	gl.disable(gl.BLEND)
}

// same color, alpha pushed up so edges read a bit brighter than the faint
// faces they outline without going back to a fully opaque wire cage
function brighten(color) {
	return [color[0], color[1], color[2], Math.min(1, color[3] * 2.5)]
}

// constantColor, when given, replaces the per-vertex color buffer with one
// flat color for every vertex (same technique drawEdges uses) -- used for
// the plain shell so its faces don't pull in FACE_COLORS
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

// draws just the cube's 12 edges as flat-colored lines, faces skipped entirely
function drawEdges(gl, programInfo, buffers, color) {
	setPositionAttribute(gl, buffers, programInfo)
	setNormalAttribute(gl, buffers, programInfo)

	// a constant color for every vertex instead of pulling per-vertex from
	// the (unused here) color buffer
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

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(gl, buffers, programInfo) {
	const numComponents = 3 //2 // pull out 2 values per iteration
	const type = gl.FLOAT // the data in the buffer is 32bit floats
	const normalize = false // don't normalize
	const stride = 0 // how many bytes to get from one set of values to the next
	// 0 = use type and numComponents above
	const offset = 0 // how many bytes inside the buffer to start from
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

// Tell WebGL how to pull out the colors from the color buffer
// into the vertexColor attribute.
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

// Tell WebGL how to pull out the normals from
// the normal buffer into the vertexNormal attribute.
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
