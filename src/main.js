import App from "./lib/app.js"
import Router from "./lib/router.js"

import { greeting } from "./index.js"
import { main } from "./webgl/"

import initialize from "./initialize.js"
import { isCssLoaded } from "./utils/misc.js"

import page404 from "/404/index.html"
import pageWebgl from "/webgl/index.html"

var app = undefined

document.addEventListener("DOMContentLoaded", init)
window.addEventListener("load", initComponents)

function init(event) {
	app = new App()
	app.router = initRouter()
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

function initRouter() {
	const router = new Router()
	router.addRoute("/", greeting, document)
	router.addRoute(404, undefined, page404)
	router.addRoute("/webgl", main, pageWebgl)
	router.resolveRoute()
	return router
}