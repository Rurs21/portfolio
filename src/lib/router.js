import { RouteView } from "./view"

class Router {
	constructor() {
		this.routes = {}
		this.firstResolve = false
		window.onpopstate = () => {this.resolve()}
	}

	addRoute(path, view) {
		if (this.routes[path] != undefined) {
			throw new Error(`Route "${path}" is already defined`)
		}

		const routeview = new RouteView(view)
		this.routes[path] = routeview

		if (path === "/") {
			const content = document.querySelector("main")
			content.prepend(routeview)
		}

		return routeview
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
		const current = document.querySelector(RouteView.tagNameValue)

		if (current !== route) {
			if (!this.firstResolve) {
				this.firstResolve = true
				current.replaceWith(route)
			} else {
				current.classList.add("fade-out")
				setTimeout(() => {
					current.replaceWith(route)
					current.classList.remove("fade-out")
				}, 250)
			}
		}
	}
}

export default Router
