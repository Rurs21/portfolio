import { ContentView } from "./view"

class Router {
	constructor() {
		this.routes = {}
		this.appView = document.getElementById('app-view')

		window.onpopstate = () => {this.resolve()}
	}

	get currentPath() {
		return window.location.pathname
	}

	addRoute(path, view) {
		if (this.routes[path] != undefined) {
			throw new Error(`Route "${path}" is already defined`)
		}

		this.routes[path] = new Route(view)
	}

	async resolve(path) {
		if (path) {
			path = historyPush(path)
		}

		try {
			const route = this.#resolveRoute(path)
			this.#changeRoute(route)
			return route
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
		const current = this.appView.firstElementChild

		if (!current || !(current instanceof ContentView)) {
			this.appView.append(route.contentView)
		} else if (current !== route) {
			current.replaceWith(route.contentView)
		}

	}
}

class Route {
	constructor(view) {
		this.contentView = new ContentView(view)
	}
}

export { Router, Route }

export default Router
