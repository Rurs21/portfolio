varying lowp vec4 vColor;
varying highp vec3 vLighting;
varying lowp vec3 vGlassTint;
varying highp vec3 vViewDir;
varying highp vec3 vNormalEye;

// true only for the item-box shell draw call, so the fresnel glass look
// doesn't also apply to the rose
uniform bool uIsGlassSurface;

// glass-only floor on vLighting: side panels catch little of
// PLAIN_SHELL_LIGHT_DIRECTION, and fresnel below makes those same edge-on
// faces more opaque, so an unlit floor this low reads as visibly dark/gray
// panels. Raising it here (not AMBIENT_STRENGTH) keeps the rose's own
// shading untouched, since the two share that uniform.
const lowp float GLASS_LIGHTING_FLOOR = 0.9;

// rim glow color: saturated cyan, like light skimming a glass edge, rather
// than the shell's own tint -- grazing-angle glass reflects ambient/sky
// light, not its diffuse color, so a neutral tint reads as reflection
// instead of "more of the same paint". Kept saturated (not pale) so it
// still reads against a white rim in dark mode, where vColor.rgb is
// already (1,1,1) and a near-white tint would be invisible
const lowp vec3 RIM_TINT_COLOR = vec3(0.25, 0.85, 1.0);

void main(void) {
	lowp vec3 rim = vec3(0.0);
	lowp float alpha = vColor.a;
	highp vec3 lighting = vLighting;
	if (uIsGlassSurface) {
		lighting = max(vLighting, vec3(GLASS_LIGHTING_FLOOR));
		// fresnel: near-invisible face-on, opaque at grazing angles (surface
		// nearly edge-on to the camera) -- real glass panes work the same
		// way, which is what reads as "glass" instead of a flat tinted panel
		// abs(), not max(dot, 0): back faces aren't culled, so a naive clamp
		// reads every backface as maximally grazing (dot < 0 -> 0 -> fresnel
		// saturates to 1) and paints the whole box opaque from any angle
		highp vec3 viewDir = normalize(-vViewDir);
		highp float fresnel = pow(1.0 - abs(dot(normalize(vNormalEye), viewDir)), 2.5);
		alpha = mix(vColor.a, 1.0, fresnel);
		rim = RIM_TINT_COLOR * fresnel * 0.7;
	}
	gl_FragColor = vec4(vColor.rgb * lighting + vGlassTint + rim, alpha);
}

