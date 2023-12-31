const body = document.body

const schemes = ["light", "dark", "system"]

// TODO remove class lol
class Scheme {
	constructor() {
		this.value = this.getUserScheme()
	}

	get value() {
		return this.getUserScheme()
	}

	set value(scheme) {
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

	getUserScheme() {
		const savedTheme = localStorage.getItem("scheme") || "system"
		return savedTheme
	}

	toggleScheme() {
		var scheme = this.value
		// cycle through next schemes
		var idx = schemes.indexOf(scheme)
		idx++
		if (idx >= schemes.length - 1) {
			idx = 0
		}
		this.value = schemes[idx]
		return this.value
	}
}

export default Scheme
