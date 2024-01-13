import { toValidId } from "@/utils/misc"

const parser = new DOMParser()
const descriptionSelector = 'meta[name="description"]'

class View {
	constructor(html, connectedCallback, disconnectedCallback) {
		var doc = html
		var template

		if (!(html instanceof Document) && typeof html === "string") {
			doc = parser.parseFromString(html, "text/html")
			template = doc.body.querySelector("template")
		} else if (html instanceof HTMLTemplateElement) {
			doc = document
			template = html
		}

		this.title = doc.title
		this.description = doc.querySelector(descriptionSelector).content
		this.template = template
		//this.content = template.content.children
		this.connectedCallback = connectedCallback
	}

	setPageInfo() {
		document.title = this.title
		document.head
			.querySelector(descriptionSelector)
			.setAttribute("content", this.description)
	}
}

const tagName = "content-view"

class ContentView extends HTMLElement {
	static tagNameValue = tagName

	constructor(view) {
		super()
		if (view) {
			this.view = view
			this.id = view.template.id || toValidId(view.title)
			this.classList = view.template.classList
			this.append(...view.template.content.children)
		}
	}

	connectedCallback() {
		if (this.view) {
			this.view.setPageInfo
		}
		if (this.view && this.view.connectedCallback) {
			this.view.connectedCallback()
		}
	}

	disconnectedCallback() {
		if (this.view && this.view.disconnectedCallback) {
			this.view.disconnectedCallback()
		}
	}
}

customElements.define(tagName, ContentView)

export { View, ContentView }
