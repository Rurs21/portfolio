const parser = new DOMParser()

class Router {
	constructor() {
		this.routes = {}
		this.templates = {}

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
		let url = route || window.location.pathname || "/"
		try {
			if (this.routes[url] !== undefined) {
				if (this.routes[url].content == null) {
					const html = await this.fetchDocument(url)
					this.cacheRouteContent(url, html)
				}
				this.render(url)
				this.routes[url].template()
			}
		} catch (e) {
			console.log(e)
			throw new Error(`Route ${url} not found`)
		}
	}

	async fetchDocument(location) {
		const response = await fetch("pages" + location + ".html")
		const html = await response.text()

		var doc = parser.parseFromString(html, "text/html")

		return doc
	}

	cacheRouteContent(route, doc) {
		this.routes[route].content = {
			title: doc.title,
			description: doc.querySelector('meta[name="description"]').content,
			main: doc.body.querySelector("main").cloneNode(true)
		}
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
