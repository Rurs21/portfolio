import vertexShaderSource from "./shaders/shader.vert?raw"
import fragmentShaderSource from "./shaders/shader.frag?raw"
import { generateRose } from "./rose-geometry.js"
import { generateCube } from "./cube-geometry.js"
import { initBuffers } from "./init-buffers.js"
import { drawScene } from "./draw-scene.js"
import { createProgramInfo, showError } from "./gl-setup.js"
import { setupTumbleDrag, stepIdlePhysics } from "./tumble-input.js"
import { setupGlassToggle } from "./glass-toggle.js"
import { defaultParams, setupRoseControls } from "./rose-controls.js"
import { updateSpiralDiagram } from "./spiral-diagram.js"

import { changeContentLanguage, getUserLanguage } from "@/i18n/l10n.js"
import { View } from "@/lib/view"
import { observeCanvasResize } from "@/utils/canvas"
import pageWebgl from "./index.html?raw"

// per-mount state: the canvas/context are reused across route visits, so
// this can't live at module scope without leaking the previous mount's loop
let session = null

// radians/second the directional light drifts around the object -- a full
// revolution takes ~10s at this speed
const LIGHT_ORBIT_SPEED = 0.63

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

function webgl() {
	const canvas = document.querySelector("#glcanvas")
	const gl = canvas.getContext("webgl")

	if (gl === null) {
		showError(
			"Unable to initialize WebGL. Your browser or machine may not support it."
		)
		return
	}

	const programInfo = createProgramInfo(
		gl,
		vertexShaderSource,
		fragmentShaderSource
	)
	if (programInfo === null) {
		return
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
	setupRoseControls(session)
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
	setupGlassToggle(session, canvas)
	setupTumbleDrag(session, canvas)

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
			stepIdlePhysics(session, deltaTime)
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

const webglView = new View(pageWebgl, webgl, teardown)

export default webglView
