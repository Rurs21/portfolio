import { isPointerOnBox } from "./draw-scene.js"

// toggles the colored-glass effect: double-click/tap the box (an easter
// egg, no visible button), or Enter/Space while the canvas has focus
function setupGlassToggle(session, canvas) {
	const toggle = () => {
		session.coloredGlass = !session.coloredGlass
	}

	const onDoubleClick = (event) => {
		if (!isPointerOnBox(canvas, event.clientX, event.clientY)) {
			return
		}
		toggle()
	}

	let lastTapTime = 0
	let lastTapX = 0
	let lastTapY = 0
	const DOUBLE_TAP_MS = 400
	const DOUBLE_TAP_DISTANCE = 30
	const onTouchEnd = (event) => {
		const touch = event.changedTouches[0]
		if (!touch || !isPointerOnBox(canvas, touch.clientX, touch.clientY)) {
			return
		}
		const now = performance.now()
		const dx = touch.clientX - lastTapX
		const dy = touch.clientY - lastTapY
		if (
			now - lastTapTime < DOUBLE_TAP_MS &&
			Math.hypot(dx, dy) < DOUBLE_TAP_DISTANCE
		) {
			toggle()
			lastTapTime = 0
			return
		}
		lastTapTime = now
		lastTapX = touch.clientX
		lastTapY = touch.clientY
	}

	const onKeyDown = (event) => {
		if (event.key !== "Enter" && event.key !== " ") {
			return
		}
		event.preventDefault()
		toggle()
	}

	canvas.addEventListener("dblclick", onDoubleClick)
	canvas.addEventListener("touchend", onTouchEnd)
	canvas.addEventListener("keydown", onKeyDown)
	session.listeners.push([canvas, "dblclick", onDoubleClick])
	session.listeners.push([canvas, "touchend", onTouchEnd])
	session.listeners.push([canvas, "keydown", onKeyDown])
}

export { setupGlassToggle }
