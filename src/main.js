import App from "@/app.js"
import Router from "@/lib/router.js"

import initialize from "./app-ui.js"
import { isCssLoaded } from "./utils/misc.js"

import indexView from "@/views/greeting"
import error404View from "@/views/error/404"

var app = undefined

document.addEventListener("DOMContentLoaded", init)
window.addEventListener("load", initComponents)

async function init(event) {

	console.info("App initiliazing...")
	registerServiceWorker()

	console.info("initiliazing router...")
	const webglView = () => import("@/views/webgl")

	const router = new Router()
	router.addRoute("/", indexView)
	router.addRoute("/webgl", webglView)
	router.addRoute(404, error404View)

	console.info('router initialized')

	app = new App(router);
}

async function initComponents(event) {
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
		console.log(`app initiliazed`)
 	} catch (error) {
		console.error(`Error while initiliazing app \n${error}`)
	}
}

const registerServiceWorker = async () => {
	if ("serviceWorker" in navigator) {
		try {
			//const sw = new URL("./sw.js", import.meta.url).pathname
			//console.log(`registering .${sw}`)
			const registration = await navigator.serviceWorker.register("./sw.js", {
				scope: "/",
			});
			if (registration.installing) {
				console.log("Service worker installing");
			} else if (registration.waiting) {
				console.log("Service worker installed");
			} else if (registration.active) {
				console.log("Service worker active");
			}
		} catch (error) {
			console.error(`Registration failed with ${error}`);
		}
	}
}
