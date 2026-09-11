// surfaces a failure in the page instead of a blocking alert()
function showError(message) {
	console.error(message)

	const element = document.querySelector("#webgl-error")
	if (element) {
		element.hidden = false
	}
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

function createProgramInfo(gl, vertexShaderSource, fragmentShaderSource) {
	const shaderProgram = initShaderProgram(
		gl,
		vertexShaderSource,
		fragmentShaderSource
	)
	if (shaderProgram === null) {
		return null
	}

	return {
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
}

export { createProgramInfo, showError }
