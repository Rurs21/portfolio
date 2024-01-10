const descriptionSelector = 'meta[name="description"]'
const docDescription = document.head.querySelector(descriptionSelector)


class RouterView extends HTMLElement {
	static observedAttributes = ["color", "size"]

	constructor(route, connectedCallback) {
		super()

		this.callbacks = {}

		this.route = route
		this.callbacks["connected"] = connectedCallback
	}

	connectedCallback() {
		console.log("Custom element added to page.")

		document.title = this.route.title
		docDescription.setAttribute("content", this.route.description)
		if (this.callbacks["connected"]) {
			this.callbacks["connected"]()
		}
	}

	disconnectedCallback() {
		console.log("Custom element removed from page.")
	}

	adoptedCallback() {
		console.log("Custom element moved to new page.")
	}

	attributeChangedCallback(name, oldValue, newValue) {
		console.log(`Attribute ${name} has changed.`)
	}
}

customElements.define("router-view", RouterView)

export default RouterView
