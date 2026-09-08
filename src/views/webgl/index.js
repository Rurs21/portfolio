import vertexShaderSource from "./shaders/shader.vert?raw"
import fragmentShaderSource from "./shaders/shader.frag?raw"
import { initBuffers } from "./init-buffers.js"
import { drawScene } from "./draw-scene.js"

import { View } from "@/lib/view"
import { getUserMotionPref } from "@/lib/motion"
import { observeCanvasResize } from "@/utils/canvas"
import pageWebgl from "./index.html?raw"

// per-mount state: the canvas/context are reused across route visits, so
// this can't live at module scope without leaking the previous mount's loop
let session = null

function webgl() {
	const canvas = document.querySelector("#glcanvas")
	const gl = canvas.getContext("webgl")

	if (gl === null) {
		showError("Unable to initialize WebGL. Your browser or machine may not support it.")
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
			normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix")
		}
	}

	const buffers = initBuffers(gl)

	session = { gl, canvas, programInfo, buffers, frame: 0, listeners: [] }

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

	let cubeRotation = 0.0
	let then = 0

	if (getUserMotionPref() === "reduce") {
		// no loop at all: draw a single static frame
		const redraw = () => drawScene(gl, programInfo, buffers, cubeRotation)
		redraw()
		window.addEventListener("resize", redraw)
		session.onResize = redraw
		return
	}

	function render(now) {
		now *= 0.001 // convert to seconds
		const deltaTime = now - then
		then = now

		drawScene(gl, programInfo, buffers, cubeRotation)
		cubeRotation += deltaTime

		session.frame = requestAnimationFrame(render)
	}

	session.frame = requestAnimationFrame(render)
}

// stops the loop and frees GL objects; without it every route visit leaks
// a running render loop plus the shader program and buffers
function teardown() {
	if (!session) {
		return
	}

	stopLoop()

	const { gl, canvas, programInfo, buffers, listeners, onResize } = session

	for (const [type, handler] of listeners) {
		canvas.removeEventListener(type, handler)
	}
	if (onResize) {
		window.removeEventListener("resize", onResize)
	}

	gl.deleteBuffer(buffers.position)
	gl.deleteBuffer(buffers.normal)
	gl.deleteBuffer(buffers.color)
	gl.deleteBuffer(buffers.indices)
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
		showError(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`)
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
		showError(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
		gl.deleteShader(shader)
		return null
	}

	return shader
}

const webglView = new View(pageWebgl, webgl, teardown)

export default webglView
