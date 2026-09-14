varying lowp vec4 vColor;
varying lowp vec3 vGlassTint;
varying highp vec3 vViewDir;
varying highp vec3 vNormalEye;
varying lowp float vPetalU;
varying lowp float vAxisDistance;

// true only for the item-box shell draw call, so the fresnel glass look
// doesn't also apply to the rose (and the rose's translucency doesn't
// apply to the box)
uniform bool uIsGlassSurface;

// light intensities, 0 = off
uniform lowp float uAmbientStrength;
uniform lowp float uDirectionalStrength;

// computed CPU-side, normalized, in eye space: orbits over time when the
// glass effect is active, fixed from roughly the camera otherwise
uniform highp vec3 uLightDirection;
uniform highp vec3 uFillDirection;

// petal light-transmission: how bright, and how tightly the glow focuses
// around looking straight into the light through the petal
uniform lowp vec3 uTransmissionColor;
uniform lowp float uTransmissionStrength;
uniform lowp float uTransmissionPower;
// petals closer than this to the bloom's axis don't transmit (see below)
uniform lowp float uTransmissionCoreRadius;

// glass-only floor on lighting: side panels catch little of
// PLAIN_SHELL_LIGHT_DIRECTION, and fresnel below makes those same edge-on
// faces more opaque, so an unlit floor this low reads as visibly dark/gray
// panels. Raising it here (not uAmbientStrength) keeps the rose's own
// shading untouched, since the two share that uniform.
const lowp float GLASS_LIGHTING_FLOOR = 0.9;

// rim glow color: saturated cyan, like light skimming a glass edge, rather
// than the shell's own tint -- grazing-angle glass reflects ambient/sky
// light, not its diffuse color, so a neutral tint reads as reflection
// instead of "more of the same paint". Kept saturated (not pale) so it
// still reads against a white rim in dark mode, where vColor.rgb is
// already (1,1,1) and a near-white tint would be invisible
const lowp vec3 RIM_TINT_COLOR = vec3(0.25, 0.85, 1.0);

// Diffuse lighting shared by both materials: ambient + key + fill, per-pixel
// so the petals' 8x6 vertex grid stops showing as flat facets across each
// curved surface.
highp vec3 diffuseLighting(highp vec3 normal) {
	highp vec3 ambientLight = vec3(0.4, 0.4, 0.4) * uAmbientStrength;
	highp vec3 directionalLightColor = vec3(1.0) * uDirectionalStrength;
	// weaker fill light from roughly the opposite side, so surfaces facing
	// away from the main light stay dim but readable instead of flat black
	highp vec3 fillLightColor = vec3(1.0) * uDirectionalStrength * 0.35;

	highp float directional = max(dot(normal, uLightDirection), 0.0);
	highp float fill = max(dot(normal, uFillDirection), 0.0);
	highp vec3 lighting = ambientLight
		+ (directionalLightColor * directional)
		+ (fillLightColor * fill);

	// ambient(0.8) + directional(1.5) + fill sums past 1.0, so lit petals used
	// to clip to white. Per-vertex shading hid that by averaging it across
	// each facet; per-pixel concentrates it into a blown-out pip at the
	// bloom's core. Compress only the overshoot above 1.0 and leave the
	// midtones alone -- rolling off the whole range (x/(1+x)) also crushes the
	// shading that's already correct, and the rose goes flat and dusty.
	return min(lighting, 1.0) + max(lighting - 1.0, 0.0) * 0.15;
}

// Material A -- the item-box shell. Fresnel glass: near-invisible face-on,
// opaque and cyan-rimmed at grazing angles. Writes its lighting floor and
// alpha through the inout params; returns the rim color to add.
lowp vec3 glassSurface(
	highp vec3 normal,
	highp vec3 viewDir,
	inout highp vec3 lighting,
	inout lowp float alpha
) {
	lighting = max(lighting, vec3(GLASS_LIGHTING_FLOOR));

	// real glass panes go opaque at grazing angles, which is what reads as
	// "glass" instead of a flat tinted panel.
	// abs(), not max(dot, 0): back faces aren't culled, so a naive clamp
	// reads every backface as maximally grazing (dot < 0 -> 0 -> fresnel
	// saturates to 1) and paints the whole box opaque from any angle
	highp float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.5);
	alpha = mix(vColor.a, 1.0, fresnel);
	return RIM_TINT_COLOR * fresnel * 0.7;
}

// Material B -- the rose petals. Fake subsurface scattering: thin petals
// scatter light hitting their far side through toward the viewer, so a
// backlit petal glows from within. Returns the transmitted color to add.
lowp vec3 petalSurface(highp vec3 normal, highp vec3 viewDir) {
	// peaks when you look straight into the light through the petal -- hence
	// dot against -uLightDirection, the direction light travels onward from it
	lowp float backlight = pow(
		max(dot(viewDir, -uLightDirection), 0.0),
		uTransmissionPower
	);

	// abs(), not max(dot, 0): a petal is an open surface with one normal
	// per vertex and no back-face culling, so the side facing away from
	// the light renders with an inward-pointing normal. Clamping would
	// zero the glow on exactly the backlit petals this exists for.
	lowp float facing = abs(dot(normal, uLightDirection));

	// petal tissue thins toward the tip, so that's where light gets
	// through. Weighted to the tip only, not to both thin ends: every
	// petal's base converges on the bloom's core, and since the rose
	// draws unblended each overlapping base would add its own glow there
	// and stack the center to white.
	lowp float thinness = vPetalU * vPetalU;

	// the innermost petals are scaled right down (innerScale) and stand
	// upright, so their *tips* all meet on the axis -- exactly where
	// tip-weighting would pile every one of their glows onto the same few
	// pixels and burn the core out to white. Fade the effect in with
	// distance from the axis so only petals with real span glow.
	lowp float openness = smoothstep(
		0.0,
		uTransmissionCoreRadius,
		vAxisDistance
	);

	return uTransmissionColor
		* backlight
		* facing
		* thinness
		* openness
		* uTransmissionStrength;
}

void main(void) {
	highp vec3 normal = normalize(vNormalEye);
	highp vec3 viewDir = normalize(-vViewDir);

	highp vec3 lighting = diffuseLighting(normal);
	lowp float alpha = vColor.a;

	// the two materials are otherwise unrelated: glass contributes a rim,
	// petals a transmitted glow, and neither uses the other's term
	lowp vec3 rim = vec3(0.0);
	lowp vec3 transmission = vec3(0.0);
	if (uIsGlassSurface) {
		rim = glassSurface(normal, viewDir, lighting, alpha);
	} else {
		transmission = petalSurface(normal, viewDir);
	}

	gl_FragColor = vec4(
		vColor.rgb * lighting + vGlassTint + rim + transmission,
		alpha
	);
}
