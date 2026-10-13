import { randomizeTextChar } from "./glitchText";
import { isCssLoaded } from "@/utils/misc"

const animation = new function() {

	this.reducedMotion = false

	// Glitch the element out, run the callback (the view swap), glitch it back in.
	// Durations match the glitch-out / glitch-in rules in animation.css.
	this.glitchCut = async function(element, callbackFn) {
		if (this.reducedMotion || !isCssLoaded(document)) {
			return callbackFn()
		}
		const outDur = 180
		const inDur = 220
		element.classList.add("glitch-out")
		await new Promise((resolve) => setTimeout(resolve, outDur))
		try {
			await callbackFn()
		} finally {
			element.classList.replace("glitch-out", "glitch-in")
			setTimeout(() => element.classList.remove("glitch-in"), inDur)
		}
	}

	this.glitchText = function(elements, callbackFn) {
		if (this.reducedMotion || !isCssLoaded(document)) {
			callbackFn()
		} else {
			const animationDur = 1250
			for(const elem of elements) {
				randomizeTextChar(elem, animationDur, 50)
			}
			setTimeout(() => {
				callbackFn()
			}, animationDur)
		}
	}
}

export default animation
