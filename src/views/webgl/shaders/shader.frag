varying lowp vec4 vColor;
varying highp vec3 vLighting;
varying lowp vec3 vGlassTint;

void main(void) {
	gl_FragColor = vec4(vColor.rgb * vLighting + vGlassTint, vColor.a);
}

