attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

// the six item-box face colors (+X, -X, +Y, -Y, +Z, -Z), so the rose can
// pick up a stained-glass-style colored tint from whichever face(s) its
// surface faces, like light passing through the box's colored walls
uniform lowp vec3 uGlassColors[6];
uniform lowp float uGlassStrength;

// user-tweakable light intensities, 0 = off
uniform lowp float uAmbientStrength;
uniform lowp float uDirectionalStrength;

// computed on the CPU side, already normalized and in eye space: orbiting
// slowly over time outside wireframe mode, fixed from roughly the camera
// direction (slight right) in wireframe mode
uniform highp vec3 uLightDirection;
uniform highp vec3 uFillDirection;

varying lowp vec4 vColor;
varying highp vec3 vLighting;
varying lowp vec3 vGlassTint;

void main(void) {
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
	vColor = aVertexColor;

	// Apply lighting effect
	highp vec3 ambientLight = vec3(0.4, 0.4, 0.4) * uAmbientStrength;
	highp vec3 directionalLightColor = vec3(1, 1, 1) * uDirectionalStrength;
	// weaker fill light from roughly the opposite side, so surfaces facing
	// away from the main light (outer petals splaying back/down) don't drop
	// to flat ambient -- keeps them dim but still readable
	highp vec3 fillLightColor = vec3(1, 1, 1) * uDirectionalStrength * 0.35;

	// w = 0.0: a direction must not pick up the matrix translation
	highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 0.0);
	highp vec3 n = normalize(transformedNormal.xyz);

	highp float directional = max(dot(transformedNormal.xyz, uLightDirection), 0.0);
	highp float fill = max(dot(transformedNormal.xyz, uFillDirection), 0.0);
	vLighting = ambientLight + (directionalLightColor * directional) + (fillLightColor * fill);

	// blend the two/three face colors the surface normal points toward most,
	// weighted by how directly it faces each one (a cheap stand-in for
	// colored light actually transmitting through translucent glass walls)
	lowp vec3 tint = vec3(0.0);
	tint += uGlassColors[0] * max(n.x, 0.0);
	tint += uGlassColors[1] * max(-n.x, 0.0);
	tint += uGlassColors[2] * max(n.y, 0.0);
	tint += uGlassColors[3] * max(-n.y, 0.0);
	tint += uGlassColors[4] * max(n.z, 0.0);
	tint += uGlassColors[5] * max(-n.z, 0.0);
	vGlassTint = tint * uGlassStrength;
}

