const body = document.body

const schemes = ['light','dark','system']

class Scheme {

	constructor(schemeToggler, icons) {
		this.toggler = schemeToggler
		this.icons = icons

		this.toggleScheme()
		// Add a click event listener to the scheme-toggle button
		this.toggler.addEventListener("click", () => {this.toggleScheme()})
	}

	getUserScheme() {
		const savedTheme = localStorage.getItem("scheme") || "system"
		return savedTheme
	}

	toggleScheme() {
		var scheme = this.getUserScheme()
		// cycle through next schemes
		var idx = schemes.indexOf(scheme)
		idx++
		if (idx >= (schemes.length - 1)) {
			idx = 0;
		}
		this.changeScheme(schemes[idx])
	}

	changeScheme(scheme) {
		if (!schemes.includes(scheme)) {
			throw new Error(`Scheme '${scheme}' is not a valid scheme`)
		}

		if (scheme == "dark" || scheme == "light") {
			body.classList.add(scheme)
			if (scheme == "light") {
				body.classList.remove("dark")
				this.toggler.replaceChildren(this.icons.light)

			} else if (scheme == "dark") {
				body.classList.remove("light")
				this.toggler.replaceChildren(this.icons.dark)
			}
		} else {
			body.classList.remove("light","dark")
			this.toggler.replaceChildren(this.icons.system)
		}
		// Save the scheme preference to localStorage
		localStorage.setItem("scheme", scheme)
	}
}

export default Scheme
