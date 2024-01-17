function randomizeTextChar(element, duration = 5000, interval = 100, restore = false) {

	const textCache = restore ? cacheTextNodes(element) : undefined

	var probability = 1
	const denominator = 100

	let id = setInterval(
		() => replaceTextWithRandomCharacters(element),
		interval
	)

	setTimeout(() => {
		clearInterval(id)
		restoreTextNodes(element, textCache)
	}, duration)

	function replaceTextWithRandomCharacters(element) {
		if (!element) return

		if (!element.matches(".glitch-text")) {
			element.classList.add("glitch-text")
			setTimeout(() => {
				element.classList.remove("glitch-text")
			}, duration)
		}

		for (let node of element.childNodes) {
			if (isTextNodeWithContent(node)) {
				let newText = ""
				for (let char of node.nodeValue) {
					const rand = Math.floor(Math.random() * denominator)
					if (/\s/.test(char) || rand > probability) {
						newText += char
					} else {
						newText += getRandomCharacter()
					}
				}
				node.nodeValue = newText
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				replaceTextWithRandomCharacters(node) // Recursive call for child elements
			}
		}
	}
}

function getRandomCharacter() {
	// Defining Unicode ranges for different character sets
	const ranges = [
		[0x0020, 0x007e], // Basic Latin (standard ASCII)
		//[0x00a0, 0x00ff], // Latin-1 Supplement (includes accented French characters)
		//[0x0100, 0x017f], // Latin Extended-A (includes additional accented characters and ligatures)
		[0x4e00, 0x9fff], // CJK Unified Ideographs (common Chinese characters)
		[0x3040, 0x30ff], // Japanese Hiragana and Katakana
		[0x0400, 0x04ff] // Cyrillic (common for Russian)
	]

	// Selecting a random range
	const range = ranges[Math.floor(Math.random() * ranges.length)]

	// Selecting a random character code within the range
	const codePoint =
		Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]

	// Converting the code point to a character
	return String.fromCodePoint(codePoint)
}

function cacheTextNodes(element) {
	let cache = []
	let index = 0

	function traverse(node) {
		if (isTextNodeWithContent(node)) {
			cache.push({ index: index, text: node.nodeValue })
			index++
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			for (let child of node.childNodes) {
				traverse(child)
			}
		}
	}

	traverse(element)
	return cache
}

function restoreTextNodes(element, cache) {
	if (!element || !cache) return

	let index = 0

	function traverse(node) {
		if (isTextNodeWithContent(node)) {
			if (cache[index] && cache[index].index === index) {
				node.nodeValue = cache[index].text
				index++
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			for (let child of node.childNodes) {
				traverse(child)
			}
		}
	}

	traverse(element)
}

function isTextNodeWithContent(node) {
	return node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0
}

export { randomizeTextChar }
