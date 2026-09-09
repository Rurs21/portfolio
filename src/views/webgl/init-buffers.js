function initBuffers(gl, geometry) {
	const position = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, position)
	gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.DYNAMIC_DRAW)

	const normal = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, normal)
	gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.DYNAMIC_DRAW)

	const color = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, color)
	gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.DYNAMIC_DRAW)

	const indices = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.DYNAMIC_DRAW)

	const buffers = {
		position,
		normal,
		color,
		indices,
		count: geometry.indices.length
	}

	if (geometry.edgeIndices) {
		const edgeIndices = gl.createBuffer()
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgeIndices)
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			geometry.edgeIndices,
			gl.STATIC_DRAW
		)
		buffers.edgeIndices = edgeIndices
		buffers.edgeCount = geometry.edgeIndices.length
	}

	return buffers
}

function updateBuffers(gl, buffers, geometry) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
	gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.DYNAMIC_DRAW)

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal)
	gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.DYNAMIC_DRAW)

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
	gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.DYNAMIC_DRAW)

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.DYNAMIC_DRAW)

	buffers.count = geometry.indices.length
}

export { initBuffers, updateBuffers }
