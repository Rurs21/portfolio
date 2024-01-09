import { onRemove } from "@/utils/misc"

function greeting() {
	typeOutTitle()
}

function typeOutTitle() {
	const titleElement = document.getElementById("job-title")
	titleElement.style.visibility = "hidden"

	const textElement = document.createElement("span")
	const cursorElement = document.createElement("span")
	cursorElement.classList.add("cursor")

	var title

	setTimeout(() => {
		title = titleElement.textContent
		titleElement.innerHTML = ""
		titleElement.removeAttribute("style")
		addCursor()
		setTimeout(typeOut, 1500)
	}, 300)

	function addCursor () {
		titleElement.append(textElement)
		titleElement.append(cursorElement)
	}

	var done = false
	let currentIndex = 0
	function typeOut () {
		if (done) {
			return
		}
		if (currentIndex < title.length) {
			textElement.textContent += title[currentIndex]
			currentIndex++
			setTimeout(typeOut, 50) // Typing speed: 50ms per character
		} else {
			done = true
			textElement.replaceWith(textElement.textContent)
			setTimeout(() => cursorElement.remove(), 1750)
		}
	}

	onRemove(document.querySelector("main"), () => {
		if (!done) {
			done = true
			titleElement.innerText = title
		}
	})
}

export { greeting }
