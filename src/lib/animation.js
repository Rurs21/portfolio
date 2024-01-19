import { randomizeTextChar } from "./glitchText";
import { isCssLoaded } from "@/utils/misc"

const animation = new function() {

	this.reducedMotion = false

	this.fadeInAndOut = function(element, callbackFn) {
		if (!isCssLoaded(document)) {
			callbackFn()
		} else {
			const animationDur = 375
			element.classList.add("fade-out")
			setTimeout(() => {
				callbackFn()
				element.classList.add("fade-in")
				element.classList.remove("fade-out")
				setTimeout(() => element.classList.remove("fade-in"), animationDur)
			}, animationDur)
		}
	}

	this.glitchText = function(elements, callbackFn) {
		if (this.reducedMotion || !isCssLoaded(document)) {
			callbackFn()
		} else {
			const animationDur = 900
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
