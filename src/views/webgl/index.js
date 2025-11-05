import vertexShaderSource from "./shaders/shader.vert?raw"
import fragmentShaderSource from "./shaders/shader.frag?raw"
import { initBuffers } from "./init-buffers.js"
import { drawScene } from "./draw-scene.js"

import { View } from "@/lib/view"
import pageWebgl from "./index.html"

const webglView = new View(pageWebgl, webgl)

let cubeRotation = 0.0
let deltaTime = 0

function webgl() {
	const canvas = document.querySelector("#glcanvas")
	// reset to auto after route change
	canvas.setAttribute("height", "auto")
	canvas.setAttribute("width", "auto")
	// Initialize the GL context
	const gl = canvas.getContext("webgl")

	// Only continue if WebGL is available and working
	if (gl === null) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.")
		return
	}

	canvas.onwebglcontextlost = (event) => {
		console.log("webgl context lost")
	}

	canvas.onwebglcontextrestored = (event) => {
		console.log("webgl context restore")
	};


	// Set clear color to black, fully opaque
	//gl.clearColor(0.0, 0.0, 0.0, 1.0)
	// Clear the color buffer with specified clear color
	//gl.clear(gl.COLOR_BUFFER_BIT)

	const shaderProgram = initShaderProgram(gl,vertexShaderSource,fragmentShaderSource)

	// Collect all the info needed to use the shader program.
	// Look up which attributes our shader program is using
	// for aVertexPosition, aVertexColor and also
	// look up uniform locations.
	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
			vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
			vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
			normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix")
		}
	}

	const buffers = initBuffers(gl)

	// Draw the scene
	let then = 0

	// To Fix with router
	//observeCanvasResize(canvas)

	// Draw the scene repeatedly
	function render(now) {
		now *= 0.001 // convert to seconds
		deltaTime = now - then
		then = now

		drawScene(gl, programInfo, buffers, cubeRotation)
		cubeRotation += deltaTime

		requestAnimationFrame(render)
	}
	requestAnimationFrame(render)
}

function initShaderProgram(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

	// Create the shader program

	const shaderProgram = gl.createProgram()
	gl.attachShader(shaderProgram, vertexShader)
	gl.attachShader(shaderProgram, fragmentShader)
	gl.linkProgram(shaderProgram)

	// If creating the shader program failed, alert

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`)
		return null
	}

	return shaderProgram
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
	const shader = gl.createShader(type)

	// Send the source to the shader object

	gl.shaderSource(shader, source)

	// Compile the shader program

	gl.compileShader(shader)

	// See if it compiled successfully

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
		gl.deleteShader(shader)
		return null
	}

	return shader
}

export default webglView
