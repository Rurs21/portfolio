// translucent multicolor cube wrapping the rose, like an item box: same
// face-color layout as the original tutorial cube, just alpha'd down and
// sized to enclose the bloom
const ALPHA = 0.2

const FACE_COLORS = [
	[1.0, 0.0, 0.0, ALPHA], // front: red
	[0.0, 1.0, 0.0, ALPHA], // back: green
	[0.0, 0.0, 1.0, ALPHA], // top: blue
	[1.0, 0.0, 1.0, ALPHA], // bottom: magenta
	[1.0, 1.0, 0.0, ALPHA], // right: yellow
	[0.0, 1.0, 1.0, ALPHA] // left: cyan
]

function generateCube(size = 1.8, centerY = 0.5) {
	const s = size

	const positions = [
		// front
		-s,
		-s + centerY,
		s,
		s,
		-s + centerY,
		s,
		s,
		s + centerY,
		s,
		-s,
		s + centerY,
		s,
		// back
		-s,
		-s + centerY,
		-s,
		-s,
		s + centerY,
		-s,
		s,
		s + centerY,
		-s,
		s,
		-s + centerY,
		-s,
		// top
		-s,
		s + centerY,
		-s,
		-s,
		s + centerY,
		s,
		s,
		s + centerY,
		s,
		s,
		s + centerY,
		-s,
		// bottom
		-s,
		-s + centerY,
		-s,
		s,
		-s + centerY,
		-s,
		s,
		-s + centerY,
		s,
		-s,
		-s + centerY,
		s,
		// right
		s,
		-s + centerY,
		-s,
		s,
		s + centerY,
		-s,
		s,
		s + centerY,
		s,
		s,
		-s + centerY,
		s,
		// left
		-s,
		-s + centerY,
		-s,
		-s,
		-s + centerY,
		s,
		-s,
		s + centerY,
		s,
		-s,
		s + centerY,
		-s
	]

	const normals = [
		0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
		-1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
		-1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
		-1, 0, 0
	]

	let colors = []
	for (const c of FACE_COLORS) {
		colors = colors.concat(c, c, c, c)
	}

	const indices = []
	const edgeIndices = []
	for (let face = 0; face < 6; face++) {
		const base = face * 4
		indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
		// one line-loop per face; shared edges get drawn twice, harmless for wireframe
		edgeIndices.push(
			base,
			base + 1,
			base + 1,
			base + 2,
			base + 2,
			base + 3,
			base + 3,
			base
		)
	}

	return {
		positions: new Float32Array(positions),
		normals: new Float32Array(normals),
		colors: new Float32Array(colors),
		indices: new Uint16Array(indices),
		edgeIndices: new Uint16Array(edgeIndices)
	}
}

export { generateCube }
