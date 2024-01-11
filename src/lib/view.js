import { toValidId } from "@/utils/misc"

const parser = new DOMParser()
const descriptionSelector = 'meta[name="description"]'

class View {
	constructor(html, connectedCallback, disconnectedCallback) {
		var doc = html
		if (!(html instanceof Document)) {
			doc = parser.parseFromString(html, "text/html")
		}
		if (doc.body == null) {
			throw new Error(`No <body> content with given document`)
		}
		this.title = doc.title
		this.description = doc.querySelector(descriptionSelector).content
		this.content = doc.body.childNodes
		this.connectedCallback = connectedCallback
	}

	setPageInfo() {
		document.title = this.title
		document.head
			.querySelector(descriptionSelector)
			.setAttribute("content", this.description)
	}
}

const tagName = "route-view"

class RouteView extends HTMLElement {
	static tagNameValue = tagName

	constructor(view) {
		super()
		this.view = view
		this.id = toValidId(this.view.title)
		this.append(...view.content)
	}

	connectedCallback() {
		this.view.setPageInfo()
		if (this.view.connectedCallback) {
			this.view.connectedCallback()
		}
	}

	disconnectedCallback() {
		if (this.view.disconnectedCallback) {
			this.view.disconnectedCallback()
		}
	}
}

customElements.define(tagName, RouteView)

export { View, RouteView }
