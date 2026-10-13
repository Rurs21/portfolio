import { VERTEX_ATTRIBUTES } from "./vertex-attributes.js"

// The rose is re-generated whenever a slider moves, so its buffers are
// rewritten; the item-box is built once and never touched. Passing the right
// hint costs nothing and tells the driver the truth about each.
function usageFor(gl, geometry) {
	return geometry.petalU ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW
}

function initBuffers(gl, geometry) {
	const usage = usageFor(gl, geometry)
	const buffers = { count: geometry.indices.length }

	for (const { geometry: source, buffer, optional } of VERTEX_ATTRIBUTES) {
		// petals only: the item-box has no petalU to upload, and its draw call
		// feeds the attribute a constant instead (see bindAttributes)
		if (optional && !geometry[source]) {
			continue
		}
		buffers[buffer] = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers[buffer])
		gl.bufferData(gl.ARRAY_BUFFER, geometry[source], usage)
	}

	buffers.indices = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, usage)

	// the wireframe overlay, cube only
	if (geometry.edgeIndices) {
		buffers.edgeIndices = gl.createBuffer()
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.edgeIndices)
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			geometry.edgeIndices,
			gl.STATIC_DRAW
		)
		buffers.edgeCount = geometry.edgeIndices.length
	}

	return buffers
}

// re-uploads an existing set of buffers in place, for the rose's sliders
function updateBuffers(gl, buffers, geometry) {
	const usage = usageFor(gl, geometry)

	for (const { geometry: source, buffer } of VERTEX_ATTRIBUTES) {
		if (!buffers[buffer] || !geometry[source]) {
			continue
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers[buffer])
		gl.bufferData(gl.ARRAY_BUFFER, geometry[source], usage)
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, usage)

	buffers.count = geometry.indices.length
}

export { initBuffers, updateBuffers }
