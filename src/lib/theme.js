const schemes = ["light", "dark", "system"]

function getUserScheme() {
	const savedTheme = localStorage.getItem("scheme") || "system"
	return savedTheme
}

function changeScheme(scheme) {
	if (!schemes.includes(scheme)) {
		throw new Error(`Scheme '${scheme}' is not a valid scheme`)
	}

	document.body.classList.remove("light", "dark")
	if (scheme != "system") {
		document.body.classList.add(scheme)
	}
	// Save the scheme preference to localStorage
	localStorage.setItem("scheme", scheme)
}

function schemeToggle(scheme) {

	var idx = schemes.indexOf(scheme)
	if (idx === -1) {
		throw new Error(`Scheme '${scheme}' is not a valid scheme`)
	}
	idx++
	if (idx >= schemes.length) {
		idx = 0;
	}

	return schemes[idx]
}

export { getUserScheme, changeScheme, schemeToggle }
