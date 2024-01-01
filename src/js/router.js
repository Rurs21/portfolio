const parser = new DOMParser()
const descriptionSelector = 'meta[name="description"]'

class Router {
	constructor() {
		this.routes = {}
		this.templates = {}
		this.onresolveroute = undefined

		const indexRoute = this.addRoute("/", () => {})
		indexRoute.cacheDocument(document)

		window.onpopstate = () => {this.resolveRoute()}
	}

	addRoute(path, callback) {
		if (this.routes[path] == undefined) {
			this.routes[path] = new Route(null, null, null, callback)
		} else {
			this.routes[path].callback = callback
		}
		return this.routes[path]
	}

	async resolveRoute(path) {
		if (path) {
			try {
				let url = new URL(path, document.baseURI)
				window.history.pushState({}, "", url.href)
				path = url.pathname
			} catch (e) {
				throw new Error(`Given route '${path}' is not a valid URL`)
			}
		}

		try {
			path = path || window.location.pathname || "/"
			const route = this.routes[path]
			if (route !== undefined) {
				if (route.content == null) {
					const html = await this.fetchDocument(path)
					route.cacheDocument(html)
				}
				this.changeRoute(route)
			} else {
				throw new Error(`Route ${path} not found`)
			}
			if (this.onresolveroute) {
				this.onresolveroute()
			}
		} catch (e) {
			console.error(e)
		}
	}

	changeRoute(route) {
		const current = document.querySelector("main")
		if (current !== route.content) {
			current.classList.add("fade-out")
			setTimeout(() => {
				route.render()
				route.callback()
				current.classList.remove("fade-out")
			}, 250)
		} else {
			route.callback()
		}
	}

	async fetchDocument(location) {
		location = "pages" + location + ".html"
		// TODO handle errors (better lol)
		const response = await fetch(location)
		if (!response.ok) {
			throw new Error(`Error fetching page: ${response.status} ${response.statusText}` , {
				cause: { code: response.status, location: location}
			})
		}
		const html = await response.text()

		var doc = parser.parseFromString(html, "text/html")

		return doc
	}
}

class Route {
	constructor(title, description, content, callback) {
		this.title = title
		this.description = description
		this.content = content
		this.callback = callback
	}

	cacheDocument(doc) {
		const content = doc.body.querySelector("main")
		if (content == null) {
			throw new Error(`No <main> content with given document : ${doc}`)
		}
		this.title = doc.title
		this.description = doc.querySelector(descriptionSelector).content
		this.content = content
		return this
	}

	render() {
		document.title = this.title
		document.head
			.querySelector(descriptionSelector)
			.setAttribute("content", this.description)
		document.body
			.querySelector("main")
			.replaceWith(this.content)
	}
}

export default Router
