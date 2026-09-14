import { generateRose } from "./rose-geometry.js"
import { updateBuffers } from "./init-buffers.js"
import { updateSpiralDiagram } from "./spiral-diagram.js"

const defaultParams = {
	spiralWindings: 2,
	bloomOpenness: 0.63,
	outerRadius: 0.86
}

const paramRanges = {
	spiralWindings: { min: 1, max: 25, step: 1 },
	bloomOpenness: { min: 0, max: 1, step: 0.01 },
	outerRadius: { min: 0.5, max: 1.7, step: 0.01 }
}

function onParamsChange(session, name, value) {
	session.params[name] = value
	const geometry = generateRose(session.params)
	updateBuffers(session.gl, session.buffers, geometry)
	updateSpiralDiagram(session.params)
}

// wires each param's number/range/stepper controls to regenerate geometry on change
function setupRoseControls(session) {
	for (const name of Object.keys(defaultParams)) {
		const range = document.querySelector(`#rose-${name}-range`)
		const number = document.querySelector(`#rose-${name}-number`)
		const decrement = document.querySelector(`#rose-${name}-decrement`)
		const increment = document.querySelector(`#rose-${name}-increment`)
		if (!number) {
			continue
		}

		const { min, max, step } = paramRanges[name]
		for (const input of [range, number]) {
			if (!input) {
				continue
			}
			input.min = min
			input.max = max
			input.step = step
			input.value = defaultParams[name]
		}

		const setValue = (value) => {
			const clamped = Math.min(max, Math.max(min, value))
			if (range) {
				range.value = clamped
			}
			number.value = clamped
			onParamsChange(session, name, clamped)
		}

		const onInput = (event) => {
			setValue(Number(event.target.value))
		}

		for (const input of [range, number]) {
			if (!input) {
				continue
			}
			input.addEventListener("input", onInput)
			session.listeners.push([input, "input", onInput])
		}

		if (decrement) {
			const onDecrement = () => setValue(Number(number.value) - step)
			decrement.addEventListener("click", onDecrement)
			session.listeners.push([decrement, "click", onDecrement])
		}
		if (increment) {
			const onIncrement = () => setValue(Number(number.value) + step)
			increment.addEventListener("click", onIncrement)
			session.listeners.push([increment, "click", onIncrement])
		}
	}
}

export { defaultParams, setupRoseControls }
