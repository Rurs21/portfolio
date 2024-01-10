const parser = new DOMParser()
const descriptionSelector = 'meta[name="description"]'

class Router {
	constructor() {
		this.routes = {}
		this.firstResolve = false

		window.onpopstate = () => {this.resolve()}
	}

	addRoute(path, callback, document) {
		if (this.routes[path] == undefined) {
			this.routes[path] = new Route(callback)
		} else {
			this.routes[path].callback = callback
		}
		if (document) {
			if(path == "/") {
				this.routes[path].cacheIndexDocument(document)
			} else {
				this.routes[path].cacheDocument(document)
			}
		}
		return this.routes[path]
	}

	async resolve(path) {
		if (path) {
			path = historyPush(path)
		}

		const route = this.#resolveRoute(path)

		try {
			if (route.content == null) {
				const html = await this.fetchDocument(path)
				route.cacheDocument(html)
			}
			this.#changeRoute(route)
		} catch (e) {
			console.error(e)
		}

		function historyPush(path) {
			try {
				let url = new URL(path, document.baseURI)
				window.history.pushState({}, "", url.href)
				return url.pathname
			} catch (e) {
				throw new Error(`Given route '${path}' is not a valid URL`)
			}
		}
	}

	#resolveRoute(path) {
		path = path || window.location.pathname || "/"
		const route = this.routes[path]
		if (route == undefined) {
			return this.routes[404]
		}
		return route
	}

	#changeRoute(route) {
		const current = document.querySelector("main")
		if (current.childNodes === route.content.childNodes) {
			route.callback()
		} else if (!this.firstResolve) {
			this.firstResolve = true
			route.render()
			route.callback()
		} else {
			current.classList.add("fade-out")
			setTimeout(() => {
				route.render()
				route.callback()
				current.classList.remove("fade-out")
			}, 250)
		}
	}

	async fetchDocument(location) {
		location = location + "/index.html"
		// TODO handle errors (better lol)
		const response = await fetch(location)
		if (!response.ok) {
			throw new Error(`Error fetching page: ${response.status} ${response.statusText}` , {
				cause: { code: response.status, location: location}
			})
		}
		const html = await response.text()
		const doc = parser.parseFromString(html, "text/html")
		return doc
	}
}

class Route {
	constructor(callback, title, description, content) {
		this.title = title
		this.description = description
		this.content = content
		this.callback = callback
	}

	cacheDocument(doc) {
		if (!(doc instanceof Document)) {
			doc = parser.parseFromString(doc, "text/html")
		}
		if (doc.body == null) {
			throw new Error(`No <body> content with given document`)
		}

		this.title = doc.title
		this.description = doc.querySelector(descriptionSelector).content
		this.content = document.createElement("main")
		this.content.append(...doc.body.childNodes)
		return this
	}

	cacheIndexDocument(doc) {
		const content = doc.querySelector("#index")

		this.title = doc.title
		this.description = doc.querySelector(descriptionSelector).content
		this.content = content
		return this
	}

	render() {
		console.log("render?")
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
