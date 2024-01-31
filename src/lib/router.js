class Router {
	#path = undefined

	constructor() {
		this.routes = {}
		//window.onpopstate = () => {this.resolve()}
	}

	get currentPath() {
		return this.#path
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
		this.#path = path
		return route
	}
}

class Route {
	constructor(view) {
		this.view = view
	}
}

export { Router, Route }

export default Router
