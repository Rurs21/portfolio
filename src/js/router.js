const parser = new DOMParser()
const mainContent = document.body.querySelector("main")

class Router {
	constructor() {
		this.routes = {}
		this.templates = {}

		window.onpopstate = this.resolveRoute
	}

	addRoute(path, template) {
		if (typeof template === "function") {
			return (this.routes[path] = { content: null, template: template })
		} else if (typeof template === "string") {
			return (this.routes[path] = {
				content: null,
				template: this.templates[template]
			})
		} else {
			return
		}
	}

	addTemplate(name, templateFunction) {
		return (this.templates[name] = templateFunction)
	}

	async resolveRoute(route) {
		let url = route || window.location.pathname || "/"
		try {
			if (this.routes[url] !== undefined) {
				if (this.routes[url].content !== null) {
					mainContent.innerHTML = this.routes[url].content.innerHTML
					this.routes[url].template()
				} else {
					await this.fetchPage(url).then((html) => {
						this.routes[url].template()
					})
				}
			}
		} catch (e) {
			throw new Error(`Route ${url} not found`)
		}
	}

	async fetchPage(location) {
		const response = await fetch("pages" + location + ".html")
		const html = await response.text()

		var doc = parser.parseFromString(html, "text/html")
		var description = doc.querySelector('meta[name="description"]').content

		document.title = doc.title
		document
			.querySelector('meta[name="description"]')
			.setAttribute("content", description)

		const newContent = doc.body.querySelector("main")

		this.routes[location].content = newContent
		mainContent.innerHTML = newContent.innerHTML

		return doc
	}

	cacheMainContent() {
		const route = window.location.pathname || "/"
		this.routes[route].content = mainContent
	}
}

export { Router }
