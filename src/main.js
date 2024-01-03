import App from "./lib/app.js"
import Router from "./lib/router.js"

import { greeting } from "./index.js"
import { main } from "./webgl/"

import initialize from "./initialize.js"
import { isCssLoaded } from "./utils/misc.js"

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
