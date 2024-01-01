import { onRemove } from "../utils/misc.js"

function greeting() {
	const titleElement = document.getElementById("job-title")
	const title = titleElement.innerText

	const cursorElement = document.createElement("span")
	cursorElement.classList.add("cursor")
	cursorElement.style.animation = "blink 1s infinite"

	titleElement.innerHTML = ""
	titleElement.append(cursorElement)

	var done = false
	let currentIndex = 0
	var typeOutTitle = function () {
		if (done) {
			return
		}
		if (currentIndex < title.length) {
			titleElement.textContent += title[currentIndex]
			currentIndex++
			setTimeout(typeOutTitle, 50) // Typing speed: 50ms per character
		} else {
			done = true
			setTimeout(() => cursorElement.remove(), 1500)
		}
	}

	onRemove(document.querySelector("main"), () => {
		if (!done) {
			done = true
			titleElement.innerText = title
		}
	})

	setTimeout(typeOutTitle, 2100)
}

export { greeting }