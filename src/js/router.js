let routes = {}
let templates = {}

const parser = new DOMParser()

// add an event listener to the window that watches for url changes
window.onpopstate = resolveRoute

// call the urlLocationHandler function to handle the initial url
window.route = router

document.addEventListener("click", async (event) => {
	const { target } = event
	if (!target.matches("nav a")) {
		return
	}
	event.preventDefault()
	router()
})

export function route(path, template) {
	if (typeof template === "function") {
		return (routes[path] = template)
	} else if (typeof template === "string") {
		return (routes[path] = templates[template])
	} else {
		return
	}
}

export function template(name, templateFunction) {
	return (templates[name] = templateFunction)
}

async function resolveRoute(route) {
	let url = route || window.location.pathname || "/"
	try {
		if (routes[url] !== undefined) {
			await fetchTemplate(url).then((html) => {
				routes[url]()
			})
		}
	} catch (e) {
		throw new Error(`Route ${url} not found`)
	}
}

export function router(event) {
	event = event || window.event
	if (event) {
		event.preventDefault()
		window.history.pushState({}, "", event.target.href)
	}
	resolveRoute()
}

async function fetchTemplate(location) {
	const response = await fetch(location + ".html")
	const html = await response.text()

	var doc = parser.parseFromString(html, "text/html")
	var description = doc.querySelector('meta[name="description"]').content

	document.title = doc.title
	document
		.querySelector('meta[name="description"]')
		.setAttribute("content", description)

	document.querySelector("main").innerHTML = doc.body.querySelector("main").innerHTML

	return doc
}
