export class Menu {
	#animationDuration = 300;

	constructor(menuElement, ...controlButtons) {
		this.menu = menuElement;
		this.buttons = controlButtons;
		this.subMenus = [];

		this.buttons.forEach(button => {
			button.setAttribute("aria-controls", menuElement.id);
			button.setAttribute("aria-expanded", !this.isClosed());
			button.addEventListener("click",() => {
				button.disabled = true;
				setTimeout(() => button.disabled = false, this.#animationDuration);
				this.toggle();
			});
		})
	}

	addSubMenu(subMenu) {
		this.subMenus.push(subMenu);
	}

	isClosed() {
		const menuClassList = this.menu.classList;
		return (menuClassList.contains("hidden") && menuClassList.contains("close"));
	}

	open() {
		this.menu.classList.remove("hidden", "close");
	}

	close() {
		this.closeSubMenus();
		this.menu.classList.add("close");
		setTimeout(() => this.menu.classList.add("hidden"), this.#animationDuration);
	}

	toggle() {
		var isExpended = !this.isClosed();
		if (isExpended) {
			this.close();
		} else {
			this.open();
		}
		this.buttons.forEach(button => button.ariaExpanded = !isExpended);
	}

	closeSubMenus() {
		this.subMenus.forEach(subMenu => {
			if (!subMenu.isClosed()) {
				subMenu.toggle();
			}
		});
	}

}
