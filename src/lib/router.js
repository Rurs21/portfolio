import { ContentView } from "./view"

class Router {
	constructor() {
		this.routes = {}
		window.onpopstate = () => {this.resolve()}

		this.appView = document.getElementById('app-view')
	}

	addRoute(path, view) {
		if (this.routes[path] != undefined) {
			throw new Error(`Route "${path}" is already defined`)
		}

		this.routes[path] = new ContentView(view)
	}

	async resolve(path) {
		if (path) {
			path = historyPush(path)
		}

		try {
			const route = this.#resolveRoute(path)
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
		const current = this.appView.firstElementChild

		if (!current || !(current instanceof ContentView)) {
			this.appView.append(route)
		} else if (current !== route) {
			this.appView.classList.add("fade-out")
			setTimeout(() => {
				current.replaceWith(route)
				this.appView.classList.remove("fade-out")
			}, 475)
		}

	}
}

export default Router
