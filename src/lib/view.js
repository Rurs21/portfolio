import { toValidId } from "@/utils/misc"

const parser = new DOMParser()

class View {
	constructor(html, connectedCallback, disconnectedCallback) {
		var doc = html

		if (!(html instanceof Document) && typeof html === "string") {
			doc = parser.parseFromString(html, "text/html")
		} else if (html instanceof Document) {
			doc = html
		}

		this.title = doc.title
		this.description = doc.description

		this.id = doc.body.id
		this.classList = doc.body.classList

		this.content = Array.from(doc.body.children)
		this.connectedCallback = connectedCallback
		this.disconnectedCallback = disconnectedCallback
	}

	setPageInfo() {
		document.title = this.title
		document.description = this.description
	}
}

class AppView {

	#view = undefined

	/**
	 *
	 * @param {Element} element
	 */
	constructor(element) {
		this.element = element
	}

	/**
	 * @param {View} view
	 */
	set view(view) {

		this.element.innerHTML = ""

		if (this.#view) {
			this.element.classList.remove(...this.#view.classList)
			if (this.#view.disconnectedCallback) {
				this.#view.disconnectedCallback()
			}
		}

		view.setPageInfo()
		this.element.id = view.id || toValidId(view.title)
		this.element.classList.add(...view.classList)

		this.element.append(...view.content)

		if (view.connectedCallback ) {
			view.connectedCallback()
		}

		this.#view = view
	}
}

export { View, AppView }
