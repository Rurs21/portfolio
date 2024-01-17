import { randomizeTextChar } from "./glitchText";

function fadeInAndOut(element, callbackFn) {
	const animationDur = 475
	element.classList.add("fade-out")
	setTimeout(() => {
		callbackFn()
		element.classList.add("fade-in")
		element.classList.remove("fade-out")
		setTimeout(() => element.classList.remove("fade-in"), animationDur)
	}, animationDur)
}


function glitchText(elements, callbackFn) {
	const animationDur = 1500
	for(const elem of elements) {
		randomizeTextChar(elem, animationDur, 150)
	}
	setTimeout(() => {
		callbackFn()
	}, animationDur)
}

export { fadeInAndOut, glitchText }