import { View } from "@/lib/view"

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
	if (titleElement.querySelector(".cursor") != undefined) {
		return
	}

	titleElement.style.visibility = "hidden"
	titleElement.classList.add("spacing")

	const textElement = document.createElement("span")
	const cursorElement = document.createElement("span")
	cursorElement.classList.add("cursor")

	var title = titleElement.textContent

	setTimeout(() => {
		title = titleElement.textContent
		titleElement.innerHTML = ""
		titleElement.removeAttribute("style")
		titleElement.append(textElement)
		titleElement.append(cursorElement)
		setTimeout(typeOut, 1500)
	}, 100)

	let currentIndex = 0
	function typeOut() {
		if (currentIndex < title.length) {
			textElement.textContent += title[currentIndex]
			currentIndex++
			setTimeout(typeOut, 50) // Typing speed: 50ms per character
		} else {
			textElement.replaceWith(textElement.textContent)
			setTimeout(() => {
				cursorElement.remove()
				setTimeout(() => titleElement.classList.remove("spacing"), 250)
			}, 1500)
		}
	}
}

export default greetingView
