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
		const route = this.routes[path]
		if (route == undefined) {
			return this.routes[404]
		} else if (route.view instanceof Promise) {
			route.view = (await route.view).default
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
