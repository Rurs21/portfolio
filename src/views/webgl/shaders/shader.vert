attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

// item-box face colors (+X, -X, +Y, -Y, +Z, -Z), tinting the rose like
// stained glass based on which face(s) its surface points toward
uniform lowp vec3 uGlassColors[6];
uniform lowp float uGlassStrength;

// user-tweakable light intensities, 0 = off
uniform lowp float uAmbientStrength;
uniform lowp float uDirectionalStrength;

// computed CPU-side, normalized, in eye space: orbits over time when the
// glass effect is active, fixed from roughly the camera otherwise
uniform highp vec3 uLightDirection;
uniform highp vec3 uFillDirection;

varying lowp vec4 vColor;
varying highp vec3 vLighting;
varying lowp vec3 vGlassTint;
varying highp vec3 vViewDir;
varying highp vec3 vNormalEye;

void main(void) {
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
	vColor = aVertexColor;

	// eye-space position doubles as the direction from the camera to this
	// vertex (camera sits at the eye-space origin), used for fresnel below
	highp vec4 positionEye = uModelViewMatrix * aVertexPosition;
	vViewDir = positionEye.xyz;

	// Apply lighting effect
	highp vec3 ambientLight = vec3(0.4, 0.4, 0.4) * uAmbientStrength;
	highp vec3 directionalLightColor = vec3(1, 1, 1) * uDirectionalStrength;
	// weaker fill light from roughly the opposite side, so surfaces facing
	// away from the main light stay dim but readable instead of flat black
	highp vec3 fillLightColor = vec3(1, 1, 1) * uDirectionalStrength * 0.35;

	// w = 0.0: a direction must not pick up the matrix translation
	highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 0.0);
	highp vec3 n = normalize(transformedNormal.xyz);
	vNormalEye = n;

	highp float directional = max(dot(transformedNormal.xyz, uLightDirection), 0.0);
	highp float fill = max(dot(transformedNormal.xyz, uFillDirection), 0.0);
	vLighting = ambientLight + (directionalLightColor * directional) + (fillLightColor * fill);

	// blend face colors the normal points toward, weighted by how directly --
	// a cheap stand-in for light transmitting through translucent glass
	lowp vec3 tint = vec3(0.0);
	tint += uGlassColors[0] * max(n.x, 0.0);
	tint += uGlassColors[1] * max(-n.x, 0.0);
	tint += uGlassColors[2] * max(n.y, 0.0);
	tint += uGlassColors[3] * max(-n.y, 0.0);
	tint += uGlassColors[4] * max(n.z, 0.0);
	tint += uGlassColors[5] * max(-n.z, 0.0);
	vGlassTint = tint * uGlassStrength;
}

