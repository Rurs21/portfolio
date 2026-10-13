// The vertex attributes every mesh here supplies, in one place so the buffer
// upload (init-buffers.js) and the per-draw binding (draw-scene.js) can't
// drift apart -- both used to repeat this list as near-identical copy-paste.
//
// geometry: key in the object generateRose/generateCube returns
// buffer:   key in the buffers object initBuffers builds
// location: key in programInfo.attribLocations
// size:     components per vertex
// optional: geometry that omits it still draws (see petalU in draw-scene.js)
const VERTEX_ATTRIBUTES = [
	{
		geometry: "positions",
		buffer: "position",
		location: "vertexPosition",
		size: 3
	},
	{
		geometry: "normals",
		buffer: "normal",
		location: "vertexNormal",
		size: 3
	},
	{ geometry: "colors", buffer: "color", location: "vertexColor", size: 4 },
	{
		geometry: "petalU",
		buffer: "petalU",
		location: "vertexPetalU",
		size: 1,
		optional: true
	}
]

export { VERTEX_ATTRIBUTES }
