const body = document.body

const schemes = ["light", "dark", "system"]

function getUserScheme() {
	const savedTheme = localStorage.getItem("scheme") || "system"
	return savedTheme
}

function changeScheme(scheme) {
	if (!schemes.includes(scheme)) {
		throw new Error(`Scheme '${scheme}' is not a valid scheme`)
	}

	body.classList.remove("light", "dark")
	if (scheme != "system") {
		body.classList.add(scheme)
	}
	// Save the scheme preference to localStorage
	localStorage.setItem("scheme", scheme)
}

export { getUserScheme, changeScheme }