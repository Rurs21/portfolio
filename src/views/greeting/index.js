import { ContentView, View } from "@/lib/view"
import { onRemove } from "@/utils/events"

const indexContent = document.createElement("template")
indexContent.classList.add("hello-world")
indexContent.content.append(...document.querySelector("main").children)

const greetingView = new View(indexContent, greeting)

function greeting() {
	try {
		typeOutTitle()
	} catch (error) {
		console.error(`Greeting error:\n${error}`)
	}
}

function typeOutTitle() {
	const titleElement = document.getElementById("job-title")
	titleElement.style.visibility = "hidden"

	const textElement = document.createElement("span")
	const cursorElement = document.createElement("span")
	cursorElement.classList.add("cursor")

	var title = titleElement.textContent
	var done = false

	setTimeout(() => {
		if (!done) {
			title = titleElement.textContent
			titleElement.innerHTML = ""
			titleElement.removeAttribute("style")
			titleElement.append(textElement)
			titleElement.append(cursorElement)
			setTimeout(typeOut, 1500)
		}
	}, 100)

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

	onRemove(document.querySelector(ContentView.tagNameValue), () => {
		if (!done) {
			done = true
			titleElement.innerText = title
		}
	})

}

export default greetingView
