attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;

// position along the petal: 0 at the base, 1 at the tip. Constant 0 for the
// item-box, which has no petals (see drawObject).
attribute float aVertexPetalU;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

// item-box face colors (+X, -X, +Y, -Y, +Z, -Z), tinting the rose like
// stained glass based on which face(s) its surface points toward
uniform lowp vec3 uGlassColors[6];
uniform lowp float uGlassStrength;

varying lowp vec4 vColor;
varying lowp vec3 vGlassTint;
varying highp vec3 vViewDir;
varying highp vec3 vNormalEye;
varying lowp float vPetalU;
// distance from the bloom's vertical axis, in object space
varying lowp float vAxisDistance;

void main(void) {
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
	vColor = aVertexColor;
	vPetalU = aVertexPetalU;
	vAxisDistance = length(aVertexPosition.xz);

	// eye-space position doubles as the direction from the camera to this
	// vertex (camera sits at the eye-space origin), used for fresnel and for
	// the transmission term's view dependence
	highp vec4 positionEye = uModelViewMatrix * aVertexPosition;
	vViewDir = positionEye.xyz;

	// w = 0.0: a direction must not pick up the matrix translation
	highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 0.0);
	vNormalEye = normalize(transformedNormal.xyz);

	// blend face colors the normal points toward, weighted by how directly --
	// a cheap stand-in for light transmitting through translucent glass.
	// Stays per-vertex: it varies with the normal, not with anything the
	// fragment stage refines, so interpolating the result is free and exact
	// enough on the box's flat faces.
	lowp vec3 n = vNormalEye;
	lowp vec3 tint = vec3(0.0);
	tint += uGlassColors[0] * max(n.x, 0.0);
	tint += uGlassColors[1] * max(-n.x, 0.0);
	tint += uGlassColors[2] * max(n.y, 0.0);
	tint += uGlassColors[3] * max(-n.y, 0.0);
	tint += uGlassColors[4] * max(n.z, 0.0);
	tint += uGlassColors[5] * max(-n.z, 0.0);
	vGlassTint = tint * uGlassStrength;
}
