import { isPointerOnBox } from "./draw-scene.js"

// a push decelerates (friction) and stops there, instead of springing back
// to a fixed pose -- lets the box be inspected from any angle it's spun to
const SPIN_FRICTION = 1.4
function freeSpinStep(offset, velocity, deltaTime) {
	const nextVelocity = velocity * Math.max(0, 1 - SPIN_FRICTION * deltaTime)
	const nextOffset = offset + nextVelocity * deltaTime
	if (Math.abs(nextVelocity) < 0.001) {
		return [nextOffset, 0]
	}
	return [nextOffset, nextVelocity]
}

// idle wobble: the box bobs up and down (not just tilts) once settled.
// amplitude is world-space distance (box is ~1 unit across)
const IDLE_WOBBLE_SPEED = 1.1
const IDLE_WOBBLE_AMPLITUDE = 0.15
const IDLE_SETTLE_SPEED = 0.15

// advances the free-spin + idle-wobble physics one frame; called from the
// render loop whenever the box isn't being actively dragged
function stepIdlePhysics(session, deltaTime) {
	;[session.pitchOffset, session.pitchVelocity] = freeSpinStep(
		session.pitchOffset,
		session.pitchVelocity,
		deltaTime
	)
	;[session.yawOffset, session.yawVelocity] = freeSpinStep(
		session.yawOffset,
		session.yawVelocity,
		deltaTime
	)

	// idle wobble fades in as spin bleeds off, so it never fights a push
	session.wobbleTime += deltaTime
	const settleAmount = Math.min(
		1,
		(Math.abs(session.pitchVelocity) + Math.abs(session.yawVelocity)) /
			IDLE_SETTLE_SPEED
	)
	const wobbleStrength = 1 - settleAmount
	// (1-cos)/2 starts at 0, so the box bobs upward, not down first
	session.idleBob =
		((1 - Math.cos(session.wobbleTime * IDLE_WOBBLE_SPEED)) / 2) *
		IDLE_WOBBLE_AMPLITUDE *
		wobbleStrength
}

// drag (mouse or touch) to push the box: vertical movement pushes pitch,
// horizontal pushes yaw. Releasing hands off the last motion as angular
// velocity, which decelerates via friction in the render loop above.
function setupTumbleDrag(session, canvas) {
	session.dragging = false
	let lastX = 0
	let lastY = 0
	let lastMoveTime = 0

	const getX = (event) =>
		event.touches ? event.touches[0].clientX : event.clientX
	const getY = (event) =>
		event.touches ? event.touches[0].clientY : event.clientY

	const onDragStart = (event) => {
		const x = getX(event)
		const y = getY(event)
		// only the box grabs; a press elsewhere still scrolls/selects normally
		if (!isPointerOnBox(canvas, x, y)) {
			return
		}
		// claim the gesture before the first touchmove, or the browser scrolls
		if (event.touches) {
			event.preventDefault()
		}
		session.dragging = true
		session.pitchVelocity = 0
		session.yawVelocity = 0
		lastX = x
		lastY = y
		lastMoveTime = performance.now()
	}
	const onDragMove = (event) => {
		if (!session.dragging) {
			return
		}
		// only swallowed once a drag actually started on the box; touches that
		// started elsewhere fall through to scroll (canvas is touch-action: pan-y)
		if (event.touches) {
			event.preventDefault()
		}
		const x = getX(event)
		const y = getY(event)
		const now = performance.now()
		// floored so a near-duplicate event can't divide by ~0 and spike velocity
		const dt = Math.max((now - lastMoveTime) / 1000, 1 / 120)
		const dPitch = (y - lastY) * 0.005
		const dYaw = (x - lastX) * 0.005
		session.pitchOffset += dPitch
		session.yawOffset += dYaw
		// units/second, carried into onDragEnd so release continues the motion
		session.pitchVelocity = dPitch / dt
		session.yawVelocity = dYaw / dt
		lastX = x
		lastY = y
		lastMoveTime = now
	}
	const onDragEnd = () => {
		session.dragging = false
	}

	// switch the cursor over the box so its grabbable area is discoverable
	const onHover = (event) => {
		if (session.dragging) {
			return
		}
		canvas.style.cursor = isPointerOnBox(canvas, event.clientX, event.clientY)
			? "grab"
			: ""
	}

	canvas.addEventListener("mousedown", onDragStart)
	canvas.addEventListener("mousemove", onHover)
	window.addEventListener("mousemove", onDragMove)
	window.addEventListener("mouseup", onDragEnd)
	// not passive: needs preventDefault or the browser claims the gesture as a scroll
	canvas.addEventListener("touchstart", onDragStart, { passive: false })
	window.addEventListener("touchmove", onDragMove, { passive: false })
	window.addEventListener("touchend", onDragEnd)

	session.listeners.push([canvas, "mousedown", onDragStart])
	session.listeners.push([canvas, "mousemove", onHover])
	session.listeners.push([window, "mousemove", onDragMove])
	session.listeners.push([window, "mouseup", onDragEnd])
	session.listeners.push([canvas, "touchstart", onDragStart])
	session.listeners.push([window, "touchmove", onDragMove])
	session.listeners.push([window, "touchend", onDragEnd])
}

export { setupTumbleDrag, stepIdlePhysics }
