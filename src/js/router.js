const parser = new DOMParser()

class Router {
	constructor() {
		this.routes = {}
		this.templates = {}

		this.addRoute("/", () => {})
		this.cacheRouteContent("/", document)

		window.onpopstate = () => {this.resolveRoute()}
	}

	addRoute(path, template) {
		if (typeof template === "function") {
			return (this.routes[path] = { content: null, template: template })
		} else if (typeof template === "string") {
			return (this.routes[path] = {content: null, template: this.templates[template] })
		} else {
			return
		}
	}

	addTemplate(name, templateFunction) {
		return (this.templates[name] = templateFunction)
	}

	async resolveRoute(route) {
		if (route) {
			try {
				let url = new URL(route, document.baseURI)
				window.history.pushState({}, "", url.href)
				route = url.pathname
			} catch (e) {
				throw new Error(`Given route '${route}' is not a valid URL`)
			}
		}

		try {
			route = window.location.pathname || "/"
			if (this.routes[route] !== undefined) {
				if (this.routes[route].content == null) {
					const html = await this.fetchDocument(route)
					this.cacheRouteContent(route, html)
				}
				this.render(route)
				this.routes[route].template()
			} else {
				throw new Error(`Route ${route} not found`)
			}
		} catch (e) {
			console.error(e)
		}
	}

	async fetchDocument(location) {
		// TODO handle errors
		const response = await fetch("pages" + location + ".html")
		const html = await response.text()

		var doc = parser.parseFromString(html, "text/html")

		return doc
	}

	cacheRouteContent(route, doc) {
		const mainContent = doc.body.querySelector("main").cloneNode(true)
		this.routes[route].content = {
			title: doc.title,
			description: doc.querySelector('meta[name="description"]').content,
			main: mainContent
		}
		return mainContent
	}

	render(path) {
		const route = this.routes[path]
		document.title = route.content.title
		document
			.querySelector('meta[name="description"]')
			.setAttribute("content", route.content.description)
		document.body.querySelector("main").replaceWith(route.content.main)
	}
}

export { Router }
