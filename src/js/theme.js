const body = document.body

var themeToggle = undefined
const icons = {
	light: undefined,
	dark: undefined,
	system: undefined
}

function changeTheme(theme) {
	if (!["dark","light","system"].includes(theme)) {
		throw new Error(`Theme '${theme}' is not a valid theme`)
	}

	if (theme == "dark" || theme == "light") {
		body.classList.add(theme)
		if (theme == "light") {
			body.classList.remove("dark")
			themeToggle.replaceChildren(icons.light)

		} else if (theme == "dark") {
			body.classList.remove("light")
			themeToggle.replaceChildren(icons.dark)
		}
	} else {
		body.classList.remove("light","dark")
		themeToggle.replaceChildren(icons.system)
	}
	// Save the theme preference to localStorage
	localStorage.setItem("theme", theme)

	const themeColor = getComputedStyle(document.body).getPropertyValue("--rose-fill")
	document.head.querySelector('meta[name="theme-color"]').content = themeColor
}

function checkUserTheme() {
	const savedTheme = localStorage.getItem("theme") || "system"
	return savedTheme
}

function setupTheme() {
	// TODO setup outside the module
	themeToggle = document.getElementById("theme-toggle")
	icons.light = document.getElementById("light-theme-icon")
	icons.dark = document.getElementById("dark-theme-icon")
	icons.system = document.getElementById("system-theme-icon")

	const themes = ['light','dark','system']
	var idx = themes.indexOf(checkUserTheme())
	// Cache references
	const toggleTheme = function () {
		changeTheme(themes[idx++])
		// just dark & light theme toggle
		if (idx >= (themes.length - 1)) {
			idx = 0;
		}
	}
	toggleTheme()

	// Add a click event listener to the theme-toggle button
	themeToggle.addEventListener("click", toggleTheme)
}

export { setupTheme, checkUserTheme, changeTheme }