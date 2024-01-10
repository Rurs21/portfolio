import RouterView from "./routerview"

const parser = new DOMParser()
const descriptionSelector = 'meta[name="description"]'

class Router {
	constructor() {
		this.routes = {}
		this.firstResolve = false

		window.onpopstate = () => {this.resolve()}
	}

	addRoute(path, doc, callback) {
		this.routes[path] = new Route(doc, callback)
		return this.routes[path]
	}

	async resolve(path) {
		if (path) {
			path = historyPush(path)
		}

		const route = this.#resolveRoute(path)

		try {
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
		const current = document.querySelector("router-view")
		if (current !== route.content) {
			if (!this.firstResolve) {
				this.firstResolve = true
				current.replaceWith(route.content)
			} else {
				current.classList.add("fade-out")
				setTimeout(() => {
					current.replaceWith(route.content)
					current.classList.remove("fade-out")
				}, 250)
			}
		}
	}
}

class Route {
	constructor(html, callback) {
		var doc = html
		if (!(html instanceof Document)) {
			doc = this.#parseHtml(html)
		}
		this.title = doc.title
		this.description = doc.querySelector(descriptionSelector).content
		this.content = new RouterView(this, callback)

		if (html instanceof Document && html === document) {
			const mainContent = document.querySelector("main")
			doc = html
			this.content.append(...mainContent.childNodes)
			mainContent.appendChild(this.content)
		} else {
			this.content.append(...doc.body.childNodes)
		}


	}

	#parseHtml(html) {
		if (!(html instanceof Document)) {
			html = parser.parseFromString(html, "text/html")
		}
		if (html.body == null) {
			throw new Error(`No <body> content with given document`)
		}
		return html
	}
}

export default Router
