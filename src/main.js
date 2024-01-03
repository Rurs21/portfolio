import App from "./js/app.js"
import Router from "./js/router.js"

import { greeting } from "./js/index/"
import { main } from "./js/webgl/"

import initialize from "./js/initialize.js"
import { isCssLoaded } from "./js/utils/misc.js"

var app

document.addEventListener("DOMContentLoaded", init)

function init(event) {
	app = new App()
	app.router = initRouter()

	if (isCssLoaded(event.target)) {
		initialize(app)
			.visual()
			.menu()
			.navigation()
			.icons().then((init) => {
				init.controls.language()
				init.controls.scheme()
			})
	} else {
		initialize(app)
			.nonCssFeatures()
			.navigation()
			.controls.language()
	}
}

function initRouter() {
	const router = new Router()
	router.addRoute("/", greeting).cacheDocument(document)
	router.addRoute("/webgl", main)

	router.resolveRoute()
	return router
}
