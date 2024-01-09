import App from "@/app.js"
import Router from "@/lib/router.js"


import initialize from "./initialize.js"
import { isCssLoaded } from "./utils/misc.js"

import { greeting } from "./greeting.js"
import pageWebgl from "@/pages/webgl/index.html"
import { webgl } from "@/pages/webgl"
import page404 from "@/pages/error/404.html"

var app = undefined

document.addEventListener("DOMContentLoaded", init)
window.addEventListener("load", initComponents)

function init(event) {
	const router = new Router()
	router.addRoute("/", greeting, document)
	router.addRoute(404, undefined, page404)
	router.addRoute("/webgl", webgl, pageWebgl)
	router.resolve()

	app = new App(router)
}

function initComponents(event) {
	try {
		if (isCssLoaded(document)) {
			initialize(app)
				.visual()
				.menu()
				.navigation()
				.controls.language()
				.controls.scheme()
		} else {
			initialize(app)
				.nonCssFeatures()
				.navigation()
				.controls.language()
		}
	} catch (error) {
		console.error(`Error while initiliazing app \n${error}`)
	}
}
