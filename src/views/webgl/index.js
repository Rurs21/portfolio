import vertexShaderSource from "./shaders/shader.vert?raw"
import fragmentShaderSource from "./shaders/shader.frag?raw"
import {
	generateRose,
	computePetalPlacements,
	computeSpiralCurve,
	withFullParams
} from "./rose-geometry.js"
import { generateCube } from "./cube-geometry.js"
import { initBuffers, updateBuffers } from "./init-buffers.js"
import { drawScene, isPointerOnBox } from "./draw-scene.js"

import { changeContentLanguage, getUserLanguage } from "@/i18n/l10n.js"
import { View } from "@/lib/view"
import { observeCanvasResize } from "@/utils/canvas"
import pageWebgl from "./index.html?raw"

const defaultParams = {
	spiralWindings: 2,
	bloomOpenness: 0.63,
	outerRadius: 0.86
}

const paramRanges = {
	spiralWindings: { min: 1, max: 25, step: 1 },
	bloomOpenness: { min: 0, max: 1, step: 0.01 },
	outerRadius: { min: 0.5, max: 1.7, step: 0.01 }
}

// per-mount state: the canvas/context are reused across route visits, so
// this can't live at module scope without leaking the previous mount's loop
let session = null

function webgl() {
	const canvas = document.querySelector("#glcanvas")
	const gl = canvas.getContext("webgl")

	if (gl === null) {
		showError(
			"Unable to initialize WebGL. Your browser or machine may not support it."
		)
		return
	}

	const shaderProgram = initShaderProgram(
		gl,
		vertexShaderSource,
		fragmentShaderSource
	)
	if (shaderProgram === null) {
		return
	}

	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(
				shaderProgram,
				"aVertexPosition"
			),
			vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
			vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(
				shaderProgram,
				"uProjectionMatrix"
			),
			modelViewMatrix: gl.getUniformLocation(
				shaderProgram,
				"uModelViewMatrix"
			),
			normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
			glassColors: gl.getUniformLocation(shaderProgram, "uGlassColors"),
			glassStrength: gl.getUniformLocation(
				shaderProgram,
				"uGlassStrength"
			),
			ambientStrength: gl.getUniformLocation(
				shaderProgram,
				"uAmbientStrength"
			),
			directionalStrength: gl.getUniformLocation(
				shaderProgram,
				"uDirectionalStrength"
			),
			lightDirection: gl.getUniformLocation(
				shaderProgram,
				"uLightDirection"
			),
			fillDirection: gl.getUniformLocation(
				shaderProgram,
				"uFillDirection"
			)
		}
	}

	const params = { ...defaultParams }
	const geometry = generateRose(params)
	const buffers = initBuffers(gl, geometry)
	const cubeBuffers = initBuffers(gl, generateCube(1.0))

	session = {
		gl,
		canvas,
		programInfo,
		buffers,
		cubeBuffers,
		params,
		frame: 0,
		listeners: []
	}

	const onContextLost = (event) => {
		// required, or the context can never be restored
		event.preventDefault()
		stopLoop()
		console.warn("webgl context lost")
	}
	const onContextRestored = () => {
		console.warn("webgl context restored")
	}

	canvas.addEventListener("webglcontextlost", onContextLost)
	canvas.addEventListener("webglcontextrestored", onContextRestored)
	session.listeners.push(["webglcontextlost", onContextLost])
	session.listeners.push(["webglcontextrestored", onContextRestored])

	observeCanvasResize(canvas)
	setupControls()
	setupMathMode()
	updateSpiralDiagram(params)
	session.coloredGlass = false
	session.pitchOffset = 0
	session.pitchVelocity = 0
	session.yawOffset = 0
	session.yawVelocity = 0
	session.wobbleTime = 0
	session.idleBob = 0
	session.lightAngle = 0
	setupGlassToggle(canvas)
	setupTumbleDrag(canvas)

	const spin = 0.0
	let then = 0

	function render(now) {
		now *= 0.001 // convert to seconds
		const deltaTime = now - then
		then = now

		// drifts regardless of drag/idle state -- the light keeps slowly
		// orbiting even while the box itself is being pushed around. only
		// while the colored-glass effect is active: the plain shell uses a
		// fixed camera-ish light instead
		if (session.coloredGlass) {
			session.lightAngle += deltaTime * LIGHT_ORBIT_SPEED
		}

		if (!session.dragging) {
			;[session.pitchOffset, session.pitchVelocity] = freeSpinStep(
				session.pitchOffset,
				session.pitchVelocity,
				deltaTime
			)
			;[session.yawOffset, session.yawVelocity] = freeSpinStep(
				session.yawOffset,
				session.yawVelocity,
				deltaTime
			)

			// once any push has bled off (both near-idle), fold in a gentle
			// idle wobble so the box never sits perfectly still -- its
			// amplitude fades in/out based on how much spin is still left, so
			// it doesn't fight a push that's still visibly decelerating
			session.wobbleTime += deltaTime
			const settleAmount = Math.min(
				1,
				(Math.abs(session.pitchVelocity) +
					Math.abs(session.yawVelocity)) /
					IDLE_SETTLE_SPEED
			)
			const wobbleStrength = 1 - settleAmount
			// (1 - cos)/2 stays within [0, 1] and starts at 0, so the box
			// bobs entirely upward from its resting height rather than
			// dipping below it first
			session.idleBob =
				((1 - Math.cos(session.wobbleTime * IDLE_WOBBLE_SPEED)) / 2) *
				IDLE_WOBBLE_AMPLITUDE *
				wobbleStrength
		}

		drawScene(
			gl,
			programInfo,
			session.buffers,
			session.cubeBuffers,
			spin,
			session.pitchOffset,
			session.yawOffset,
			session.idleBob,
			session.lightAngle,
			session.coloredGlass,
			getPlainShellColor()
		)

		session.frame = requestAnimationFrame(render)
	}

	session.frame = requestAnimationFrame(render)
}

// a push just decelerates (friction) instead of springing back to any fixed
// pose -- the box keeps turning in whatever direction it was pushed and
// slowly stops there, rather than snapping back to face-front, so it can
// actually be "inspected" from any angle it's spun to
const SPIN_FRICTION = 1.4
function freeSpinStep(offset, velocity, deltaTime) {
	const nextVelocity = velocity * Math.max(0, 1 - SPIN_FRICTION * deltaTime)
	const nextOffset = offset + nextVelocity * deltaTime
	if (Math.abs(nextVelocity) < 0.001) {
		return [nextOffset, 0]
	}
	return [nextOffset, nextVelocity]
}

// idle wobble: the whole box actually bobs up and down (not just tilts) once
// it's settled from any push, so it never sits perfectly static. amplitude
// is a world-space distance (item-box is ~1 unit across, so 0.15 reads as a
// clear bounce without floating out of frame)
const IDLE_WOBBLE_SPEED = 1.1
const IDLE_WOBBLE_AMPLITUDE = 0.15
const IDLE_SETTLE_SPEED = 0.15

// radians/second the directional light drifts around the object -- a full
// revolution takes ~10s at this speed
const LIGHT_ORBIT_SPEED = 0.63

// drag in any direction (mouse or touch) to push the item-box: vertical
// movement pushes it in pitch, horizontal movement pushes it in yaw, on top
// of its fixed base angle. While dragging it tracks the pointer directly;
// releasing hands off the last few frames' motion as angular velocity, so it
// keeps spinning in that direction and gradually decelerates (friction, in
// the render loop above) back to its idle wobble instead of snapping back to
// a resting pose.
function setupTumbleDrag(canvas) {
	session.dragging = false
	let lastX = 0
	let lastY = 0
	let lastMoveTime = 0

	const getX = (event) =>
		event.touches ? event.touches[0].clientX : event.clientX
	const getY = (event) =>
		event.touches ? event.touches[0].clientY : event.clientY

	const onDragStart = (event) => {
		const x = getX(event)
		const y = getY(event)
		// only the box itself grabs: a press on the empty canvas around it
		// should still scroll/select the page normally rather than silently
		// tumbling something the pointer isn't actually on
		if (!isPointerOnBox(canvas, x, y)) {
			return
		}
		// claim the gesture up front so the browser doesn't start scrolling
		// the page from this touch before the first touchmove arrives
		if (event.touches) {
			event.preventDefault()
		}
		session.dragging = true
		session.pitchVelocity = 0
		session.yawVelocity = 0
		lastX = x
		lastY = y
		lastMoveTime = performance.now()
	}
	const onDragMove = (event) => {
		if (!session.dragging) {
			return
		}
		// only swallow the touch once a drag has actually started (i.e. it
		// began on the box). Touches that started on the empty canvas never
		// set dragging, so they fall through and scroll the page as normal --
		// which is why the canvas uses touch-action: pan-y rather than none.
		if (event.touches) {
			event.preventDefault()
		}
		const x = getX(event)
		const y = getY(event)
		const now = performance.now()
		// seconds since the last move, floored so a near-duplicate event
		// (or the very first move) can't divide by ~0 and spike velocity
		const dt = Math.max((now - lastMoveTime) / 1000, 1 / 120)
		const dPitch = (y - lastY) * 0.005
		const dYaw = (x - lastX) * 0.005
		session.pitchOffset += dPitch
		session.yawOffset += dYaw
		// release velocity (units/second), carried into onDragEnd so letting
		// go continues the motion at the speed the pointer was moving
		session.pitchVelocity = dPitch / dt
		session.yawVelocity = dYaw / dt
		lastX = x
		lastY = y
		lastMoveTime = now
	}
	const onDragEnd = () => {
		session.dragging = false
	}

	// the box is the only draggable part of the canvas, and nothing about a
	// flat rectangle says so -- switch the cursor over it so the grabbable
	// area is discoverable instead of guesswork
	const onHover = (event) => {
		if (session.dragging) {
			return
		}
		canvas.style.cursor = isPointerOnBox(
			canvas,
			event.clientX,
			event.clientY
		)
			? "grab"
			: ""
	}

	canvas.addEventListener("mousedown", onDragStart)
	canvas.addEventListener("mousemove", onHover)
	window.addEventListener("mousemove", onDragMove)
	window.addEventListener("mouseup", onDragEnd)
	// not passive: a touch that starts on the box has to be able to
	// preventDefault, or the browser may claim the gesture as a scroll before
	// the first touchmove lands
	canvas.addEventListener("touchstart", onDragStart, { passive: false })
	window.addEventListener("touchmove", onDragMove, { passive: false })
	window.addEventListener("touchend", onDragEnd)

	session.listeners.push([canvas, "mousedown", onDragStart])
	session.listeners.push([canvas, "mousemove", onHover])
	session.listeners.push([window, "mousemove", onDragMove])
	session.listeners.push([window, "mouseup", onDragEnd])
	session.listeners.push([canvas, "touchstart", onDragStart])
	session.listeners.push([window, "touchmove", onDragMove])
	session.listeners.push([window, "touchend", onDragEnd])
}

// white on a dark background, black on a light one, so the plain shell
// stays visible regardless of theme; falls back to the OS preference in
// "system" mode. Low alpha -- barely-there panes, not a solid box
const PLAIN_SHELL_ALPHA = 0.12
function getPlainShellColor() {
	if (document.body.classList.contains("dark")) {
		return [1, 1, 1, PLAIN_SHELL_ALPHA]
	}
	if (document.body.classList.contains("light")) {
		return [0, 0, 0, PLAIN_SHELL_ALPHA]
	}
	const prefersDark = window.matchMedia(
		"(prefers-color-scheme: dark)"
	).matches
	return prefersDark
		? [1, 1, 1, PLAIN_SHELL_ALPHA]
		: [0, 0, 0, PLAIN_SHELL_ALPHA]
}

// toggles the colored-glass effect: a double-click/tap on the box itself
// (an easter egg, not the primary control -- there's no visible button for
// it), or Enter/Space while the canvas has focus so it's still reachable
// without a pointer
function setupGlassToggle(canvas) {
	const toggle = () => {
		session.coloredGlass = !session.coloredGlass
	}

	const onDoubleClick = (event) => {
		if (!isPointerOnBox(canvas, event.clientX, event.clientY)) {
			return
		}
		toggle()
	}

	let lastTapTime = 0
	let lastTapX = 0
	let lastTapY = 0
	const DOUBLE_TAP_MS = 400
	const DOUBLE_TAP_DISTANCE = 30
	const onTouchEnd = (event) => {
		const touch = event.changedTouches[0]
		if (!touch || !isPointerOnBox(canvas, touch.clientX, touch.clientY)) {
			return
		}
		const now = performance.now()
		const dx = touch.clientX - lastTapX
		const dy = touch.clientY - lastTapY
		if (
			now - lastTapTime < DOUBLE_TAP_MS &&
			Math.hypot(dx, dy) < DOUBLE_TAP_DISTANCE
		) {
			toggle()
			lastTapTime = 0
			return
		}
		lastTapTime = now
		lastTapX = touch.clientX
		lastTapY = touch.clientY
	}

	const onKeyDown = (event) => {
		if (event.key !== "Enter" && event.key !== " ") {
			return
		}
		event.preventDefault()
		toggle()
	}

	canvas.addEventListener("dblclick", onDoubleClick)
	canvas.addEventListener("touchend", onTouchEnd)
	canvas.addEventListener("keydown", onKeyDown)
	session.listeners.push([canvas, "dblclick", onDoubleClick])
	session.listeners.push([canvas, "touchend", onTouchEnd])
	session.listeners.push([canvas, "keydown", onKeyDown])
}

// wires each param's control(s) -- a number input, an optional paired range
// slider, and optional paired increment/decrement stepper buttons -- to
// regenerate geometry on change
function setupControls() {
	for (const name of Object.keys(defaultParams)) {
		const range = document.querySelector(`#rose-${name}-range`)
		const number = document.querySelector(`#rose-${name}-number`)
		const decrement = document.querySelector(`#rose-${name}-decrement`)
		const increment = document.querySelector(`#rose-${name}-increment`)
		if (!number) {
			continue
		}

		const { min, max, step } = paramRanges[name]
		for (const input of [range, number]) {
			if (!input) {
				continue
			}
			input.min = min
			input.max = max
			input.step = step
			input.value = defaultParams[name]
		}

		const setValue = (value) => {
			const clamped = Math.min(max, Math.max(min, value))
			if (range) {
				range.value = clamped
			}
			number.value = clamped
			onParamsChange(name, clamped)
		}

		const onInput = (event) => {
			setValue(Number(event.target.value))
		}

		for (const input of [range, number]) {
			if (!input) {
				continue
			}
			input.addEventListener("input", onInput)
			session.listeners.push([input, "input", onInput])
		}

		if (decrement) {
			const onDecrement = () => setValue(Number(number.value) - step)
			decrement.addEventListener("click", onDecrement)
			session.listeners.push([decrement, "click", onDecrement])
		}
		if (increment) {
			const onIncrement = () => setValue(Number(number.value) + step)
			increment.addEventListener("click", onIncrement)
			session.listeners.push([increment, "click", onIncrement])
		}
	}
}

// flips the math writeup between the plain-English version and a greentext
// retelling of the same thing. Purely cosmetic -- both describe identical
// geometry, so nothing here touches params or buffers.
function setupMathMode() {
	const button = document.querySelector("#rose-math-mode")
	const plain = document.querySelector("#rose-math-plain")
	const green = document.querySelector("#rose-math-green")
	if (!button || !plain || !green) {
		return
	}

	const onToggle = () => {
		const toGreen = green.hidden
		green.hidden = !toGreen
		plain.hidden = toGreen
		button.setAttribute("aria-pressed", String(toGreen))
		// the label advertises where the button takes you, so it names the
		// mode you are NOT currently in
		button.dataset.translate = toGreen
			? "rose-math-mode-plain"
			: "rose-math-mode-green"
		changeContentLanguage(getUserLanguage(), [button])
	}

	button.addEventListener("click", onToggle)
	session.listeners.push([button, "click", onToggle])
}

function onParamsChange(name, value) {
	if (!session) {
		return
	}

	session.params[name] = value
	const geometry = generateRose(session.params)
	updateBuffers(session.gl, session.buffers, geometry)
	updateSpiralDiagram(session.params)
}

// half the SVG's viewBox side (see the viewBox on #rose-spiral-diagram) --
// outerRadius is normalized to this many SVG units so the diagram always
// fills the same visual space regardless of the outerRadius slider, which
// is just an overall scale on the 3D bloom and shouldn't shrink/grow the
// diagram itself
const DIAGRAM_RADIUS = 90
const SVG_NS = "http://www.w3.org/2000/svg"

// top-down (radius/angle -> x/y) view of the same curve and petal
// placement points computePetalPlacements/generateWhorls use for the 3D
// mesh -- draws the raw spiral as a path and each petal as a dot, colored
// outer(light)->inner(dark) to match the bloom's own color gradient
function updateSpiralDiagram(params) {
	const path = document.querySelector("#rose-spiral-path")
	const pointsGroup = document.querySelector("#rose-spiral-points")
	const petalCountValue = document.querySelector("#rose-petal-count-value")
	if (!path || !pointsGroup) {
		return
	}

	const fullParams = withFullParams(params)
	const { spiralWindings, outerRadius } = fullParams

	// the raw curve's own largest radius maps to DIAGRAM_RADIUS regardless
	// of outerRadius (scale is in raw curve units); computePetalPlacements'
	// radius is already outerRadius-scaled (its own outermost point equals
	// outerRadius exactly), so dividing by outerRadius first puts it back
	// in the same 0..1-ish range as the raw curve before applying
	// DIAGRAM_RADIUS -- both end up in one shared coordinate space
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
		// height (0 = outer/flat, bloomHeight = inner/upright) doubles as
		// the same outer->inner gradient cue the 3D petals use via their
		// own color lerp, so the diagram reads with the same visual logic
		const t = Math.min(1, height / (fullParams.length * 0.6))
		circle.setAttribute("fill", petalGradientColor(t))
		pointsGroup.appendChild(circle)
	}
}

// matches rose-geometry.js's BASE_COLOR (outer) -> TIP_COLOR (inner) lerp
function petalGradientColor(t) {
	const base = [0.55, 0.02, 0.09]
	const tip = [0.98, 0.55, 0.62]
	const [r, g, b] = base.map((c, i) => c + (tip[i] - c) * t)
	return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}

// stops the loop and frees GL objects; without it every route visit leaks
// a running render loop plus the shader program and buffers
function teardown() {
	if (!session) {
		return
	}

	stopLoop()

	const { gl, canvas, programInfo, buffers, cubeBuffers, listeners } = session

	for (const listener of listeners) {
		if (listener.length === 2) {
			const [type, handler] = listener
			canvas.removeEventListener(type, handler)
		} else {
			const [element, type, handler] = listener
			element.removeEventListener(type, handler)
		}
	}

	gl.deleteBuffer(buffers.position)
	gl.deleteBuffer(buffers.normal)
	gl.deleteBuffer(buffers.color)
	gl.deleteBuffer(buffers.indices)
	gl.deleteBuffer(cubeBuffers.position)
	gl.deleteBuffer(cubeBuffers.normal)
	gl.deleteBuffer(cubeBuffers.color)
	gl.deleteBuffer(cubeBuffers.indices)
	gl.deleteBuffer(cubeBuffers.edgeIndices)
	gl.deleteProgram(programInfo.program)

	session = null
}

function stopLoop() {
	if (session && session.frame) {
		cancelAnimationFrame(session.frame)
		session.frame = 0
	}
}

// surfaces a failure in the page instead of a blocking alert()
function showError(message) {
	console.error(message)

	const element = document.querySelector("#webgl-error")
	if (element) {
		element.hidden = false
	}
}

function initShaderProgram(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

	if (vertexShader === null || fragmentShader === null) {
		return null
	}

	const shaderProgram = gl.createProgram()
	gl.attachShader(shaderProgram, vertexShader)
	gl.attachShader(shaderProgram, fragmentShader)
	gl.linkProgram(shaderProgram)

	// linked into the program now, so the standalone objects can be freed
	gl.deleteShader(vertexShader)
	gl.deleteShader(fragmentShader)

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		showError(
			`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`
		)
		gl.deleteProgram(shaderProgram)
		return null
	}

	return shaderProgram
}

function loadShader(gl, type, source) {
	const shader = gl.createShader(type)

	gl.shaderSource(shader, source)
	gl.compileShader(shader)

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		showError(
			`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
		)
		gl.deleteShader(shader)
		return null
	}

	return shader
}

const webglView = new View(pageWebgl, webgl, teardown)

export default webglView
