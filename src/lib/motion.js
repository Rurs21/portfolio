const motions = ["no-preference", "reduce"]
const mediaQuery = "(prefers-reduced-motion: reduce)"

/**
 * Retrieves the user's preference for motion based on system settings and local storage.
 *
 * @returns {"no-preference" | "reduce"} The user's motion preference, either 'no-preference' or 'reduce'.
 */
function getUserMotionPref() {
	const defaultMotionPref = window.matchMedia(mediaQuery)
		? "no-preference"
		: "reduce"
	const savedMotionPref = localStorage.getItem("motion")

	return savedMotionPref || defaultMotionPref
}


function changeMotionPref(motion) {
	if (!motions.includes(motion)) {
		throw new Error(`Motion preference '${motion}' is not valid`)
	}

	if (motion == "reduce") {
		document.body.classList.add("reduce-motion")
	} else {
		document.body.classList.remove("reduce-motion")
	}

	// Save the scheme preference to localStorage
	localStorage.setItem("motion", motion)
}

export { getUserMotionPref, changeMotionPref }
