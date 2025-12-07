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
		}
		this.#path = path
		return route
	}
}

class Route {

	#view = undefined

	// TODO: consider having view as concrete class and returning new instance of views
	/**
	 * @param {View|string} view - Either an instance of View,
	 * or a string path to a module that exports a View as the default.
	 */
	constructor(view) {
		this.#view = view
	}

	get view() {
		return Route.#resolveView(this.#view)
	}

	static async #resolveView(view) {
		if (typeof view === 'function') {
			const module = await view()
			return module.default
		}
		return view
	}
}

export { Router, Route }

export default Router
