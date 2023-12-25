export default class Menu {
	#animationDuration = 250

	constructor(menuElement, ...controlButtons) {
		this.menu = menuElement
		this.buttons = controlButtons
		this.subMenus = []

		this.buttons.forEach((button) => {
			button.setAttribute("aria-controls", menuElement.id)
			button.setAttribute("aria-expanded", !this.isClosed())
			button.addEventListener("click", () => {
				button.disabled = true
				setTimeout(
					() => (button.disabled = false),
					this.#animationDuration
				)
				this.toggle()
			})
		})
	}

	getId() {
		return this.menu.id
	}

	addSubMenu(subMenu) {
		this.subMenus.push(subMenu)
		// close other sub menu
		for (const subButton of subMenu.buttons) {
			subButton.addEventListener("click", () => {
				for (const otherSubMenu of this.subMenus) {
					if (otherSubMenu !== subMenu && !otherSubMenu.isClosed()) {
						otherSubMenu.close()
					}
				}
			})
		}
	}

	isClosed() {
		const menuClasses = this.menu.classList
		return menuClasses.contains("hidden") && menuClasses.contains("close")
	}

	open() {
		this.menu.classList.remove("hidden", "close")
	}

	close() {
		this.closeSubMenus()
		this.menu.classList.add("close")
		setTimeout(() => this.menu.classList.add("hidden"),this.#animationDuration)
	}

	toggle() {
		var isExpended = !this.isClosed()
		if (isExpended) {
			this.close()
		} else {
			this.open()
		}
		this.buttons.forEach((button) => (button.ariaExpanded = !isExpended))
	}

	closeSubMenus() {
		this.subMenus.forEach((subMenu) => {
			if (!subMenu.isClosed()) {
				subMenu.toggle()
				subMenu.closeSubMenus()
			}
		})
	}
}
