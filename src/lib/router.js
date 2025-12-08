class Router {
	#path = undefined

	constructor() {
		this.routes = {}
		//window.onpopstate = () => {this.resolve()}
	}

	get currentPath() {
		return this.#path
	}

	get cachedRoutes() {
		return Object.fromEntries(
			Object.entries(this.routes)
			.filter(([path, route]) => route.cached === true)
		)
	}

	addRoute(path, view) {
		if (this.routes[path] != undefined) {
			throw new Error(`Route "${path}" is already defined`)
		}

		this.routes[path] = new Route(view)
	}

	async resolve(path) {
		this.#path = path
		let route = this.routes[path]
		if (route == undefined) {
			route = this.routes[404]
		}
		return route.loadView()
	}
}

class Route {

	#deferred = undefined

	// TODO: consider having view as concrete class and returning new instance of views
	/**
	 * @param {View|Function} view - Either an instance of View,
	 * or async function returning module exporting a View as the default.
	 */
	constructor(view) {
		this.view = new Promise((resolve, _) => {
			if (typeof view === "function") {
			    this.#deferred = view
				this.resolve = resolve
			} else {
				resolve(view)
			}
		})
	}

	get cached() {
		return ! new Boolean(this.#deferred)
	}

	async loadView() {
		if (this.#deferred) {
			const module = await this.#deferred()
			this.resolve(module.default)
			this.#deferred = undefined
		}
		return this.view
	}
}

export { Router, Route }

export default Router
