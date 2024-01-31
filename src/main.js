import App from "@/app.js"
import Router from "@/lib/router.js"

import initialize from "./app-ui.js"
import { isCssLoaded } from "./utils/misc.js"

import indexView from "@/views/greeting"
import webglView from "@/views/webgl"
import eror404View from "@/views/error/404"

var app = undefined

document.addEventListener("DOMContentLoaded", init)
window.addEventListener("load", initComponents)

function init(event) {
	const router = new Router()
	router.addRoute("/", indexView)
	router.addRoute(404, eror404View)
	router.addRoute("/webgl", webglView)

	app = new App(router)
}

function initComponents(event) {
	try {
		if (isCssLoaded(document)) {
			initialize(app)
				.menu()
				.navigation()
				.controls.language()
				.controls.scheme()
				.controls.motion()
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
