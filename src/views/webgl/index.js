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
			),
			isGlassSurface: gl.getUniformLocation(
				shaderProgram,
				"uIsGlassSurface"
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

		// light keeps drifting regardless of drag/idle; only while the
		// glass effect is active, since the plain shell uses a fixed light
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

			// idle wobble fades in as spin bleeds off, so it never fights a push
			session.wobbleTime += deltaTime
			const settleAmount = Math.min(
				1,
				(Math.abs(session.pitchVelocity) +
					Math.abs(session.yawVelocity)) /
					IDLE_SETTLE_SPEED
			)
			const wobbleStrength = 1 - settleAmount
			// (1-cos)/2 starts at 0, so the box bobs upward, not down first
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

// a push decelerates (friction) and stops there, instead of springing back
// to a fixed pose -- lets the box be inspected from any angle it's spun to
const SPIN_FRICTION = 1.4
function freeSpinStep(offset, velocity, deltaTime) {
	const nextVelocity = velocity * Math.max(0, 1 - SPIN_FRICTION * deltaTime)
	const nextOffset = offset + nextVelocity * deltaTime
	if (Math.abs(nextVelocity) < 0.001) {
		return [nextOffset, 0]
	}
	return [nextOffset, nextVelocity]
}

// idle wobble: the box bobs up and down (not just tilts) once settled.
// amplitude is world-space distance (box is ~1 unit across)
const IDLE_WOBBLE_SPEED = 1.1
const IDLE_WOBBLE_AMPLITUDE = 0.15
const IDLE_SETTLE_SPEED = 0.15

// radians/second the directional light drifts around the object -- a full
// revolution takes ~10s at this speed
const LIGHT_ORBIT_SPEED = 0.63

// drag (mouse or touch) to push the box: vertical movement pushes pitch,
// horizontal pushes yaw. Releasing hands off the last motion as angular
// velocity, which decelerates via friction in the render loop above.
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
		// only the box grabs; a press elsewhere still scrolls/selects normally
		if (!isPointerOnBox(canvas, x, y)) {
			return
		}
		// claim the gesture before the first touchmove, or the browser scrolls
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
		// only swallowed once a drag actually started on the box; touches that
		// started elsewhere fall through to scroll (canvas is touch-action: pan-y)
		if (event.touches) {
			event.preventDefault()
		}
		const x = getX(event)
		const y = getY(event)
		const now = performance.now()
		// floored so a near-duplicate event can't divide by ~0 and spike velocity
		const dt = Math.max((now - lastMoveTime) / 1000, 1 / 120)
		const dPitch = (y - lastY) * 0.005
		const dYaw = (x - lastX) * 0.005
		session.pitchOffset += dPitch
		session.yawOffset += dYaw
		// units/second, carried into onDragEnd so release continues the motion
		session.pitchVelocity = dPitch / dt
		session.yawVelocity = dYaw / dt
		lastX = x
		lastY = y
		lastMoveTime = now
	}
	const onDragEnd = () => {
		session.dragging = false
	}

	// switch the cursor over the box so its grabbable area is discoverable
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
	// not passive: needs preventDefault or the browser claims the gesture as a scroll
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

// white on dark, black on light, so the plain shell stays visible; falls
// back to the OS preference in "system" mode. Low: fresnel in the fragment
// shader carries most of the visible opacity toward the box's edges
const PLAIN_SHELL_ALPHA = 0.05
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

// toggles the colored-glass effect: double-click/tap the box (an easter
// egg, no visible button), or Enter/Space while the canvas has focus
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

// wires each param's number/range/stepper controls to regenerate geometry on change
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

// flips the math writeup between plain-English and greentext -- cosmetic only
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
		// label names the mode you're NOT currently in (where the button takes you)
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

// half the SVG viewBox side; the diagram always fills the same visual space
// regardless of the outerRadius slider, which only scales the 3D bloom
const DIAGRAM_RADIUS = 90
const SVG_NS = "http://www.w3.org/2000/svg"

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
