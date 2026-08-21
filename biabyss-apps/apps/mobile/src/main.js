// @ts-check

import { RULE_SET } from './domain/rules/ruleSet.js'
import { BiabyssRenderer } from './game/rendering/BiabyssRenderer.js'
import { sampleJoystick } from './input/joystick.js'
import { Simulation } from './simulation/Simulation.js'
import './styles.css'

/** @template {HTMLElement} T @param {string} selector */
function requiredElement(selector) {
  const element = document.querySelector(selector)
  if (!(element instanceof HTMLElement)) throw new Error(`Required element not found: ${selector}`)
  return /** @type {T} */ (element)
}

const host = requiredElement('#game-surface')
const startPanel = requiredElement('#start-panel')
const startButton = /** @type {HTMLButtonElement} */ (requiredElement('#start-button'))
const startButtonLabel = requiredElement('#start-button span')
const panelTitle = requiredElement('#panel-title')
const panelCopy = requiredElement('#panel-copy')
const massValue = requiredElement('#mass-value')
const absorbedValue = requiredElement('#absorbed-value')
const positionValue = requiredElement('#position-value')
const fieldCursor = requiredElement('#field-cursor')
const statusLight = requiredElement('#status-light')
const statusCopy = requiredElement('#status-copy')
const liveRegion = requiredElement('#live-region')
const diagnosticsOutput = /** @type {HTMLOutputElement} */ (requiredElement('#diagnostics'))
/** @type {string[]} */
const runtimeIssues = []

window.addEventListener('error', (event) => {
  runtimeIssues.push(event.message || 'unknown window error')
})
window.addEventListener('unhandledrejection', () => {
  runtimeIssues.push('unhandled promise rejection')
})

const simulation = new Simulation(window.innerWidth, window.innerHeight)
const presentation = new BiabyssRenderer(host, simulation)
const fixedStepSeconds = 1 / RULE_SET.simulationHz
let previousFrame = performance.now()
let accumulator = 0
let animationFrame = 0
let hudClock = 0
let previousPhase = simulation.phase
/** @type {{pointerId: number, centerX: number, centerY: number} | null} */
let activePointer = null

function resize() {
  const bounds = host.getBoundingClientRect()
  presentation.resize(bounds.width, bounds.height)
}

const resizeObserver = new ResizeObserver(resize)
resizeObserver.observe(host)
resize()

/** @param {PointerEvent} event */
function updatePointer(event) {
  if (simulation.phase !== 'running' || activePointer?.pointerId !== event.pointerId) return
  const bounds = presentation.renderer.domElement.getBoundingClientRect()
  const pointerX = event.clientX - bounds.left
  const pointerY = event.clientY - bounds.top
  const sample = sampleJoystick(
    pointerX - activePointer.centerX,
    pointerY - activePointer.centerY,
    RULE_SET.player.joystickRadiusCssPx,
  )
  const targetDistance = Math.max(presentation.viewportWidth, presentation.viewportHeight)
  simulation.setInput(
    simulation.player.x + sample.directionX * targetDistance,
    simulation.player.y - sample.directionY * targetDistance,
    true,
    sample.strength,
  )
  presentation.setJoystick({
    active: true,
    centerX: activePointer.centerX,
    centerY: activePointer.centerY,
    knobX: sample.knobX,
    knobY: sample.knobY,
    strength: sample.strength,
  })
}

/** @param {PointerEvent} event */
function beginPointer(event) {
  if (simulation.phase !== 'running' || activePointer || event.button !== 0) return
  const bounds = presentation.renderer.domElement.getBoundingClientRect()
  activePointer = {
    pointerId: event.pointerId,
    centerX: event.clientX - bounds.left,
    centerY: event.clientY - bounds.top,
  }
  presentation.renderer.domElement.setPointerCapture(event.pointerId)
  updatePointer(event)
}

/** @param {number} [pointerId] */
function releasePointer(pointerId) {
  if (!activePointer || (pointerId !== undefined && activePointer.pointerId !== pointerId)) return
  const capturedPointerId = activePointer.pointerId
  activePointer = null
  simulation.releaseInput()
  presentation.hideJoystick()
  if (presentation.renderer.domElement.hasPointerCapture(capturedPointerId)) {
    presentation.renderer.domElement.releasePointerCapture(capturedPointerId)
  }
}

presentation.renderer.domElement.addEventListener('pointerdown', beginPointer)
presentation.renderer.domElement.addEventListener('pointermove', updatePointer)
presentation.renderer.domElement.addEventListener('pointerup', (event) => releasePointer(event.pointerId))
presentation.renderer.domElement.addEventListener('pointercancel', (event) => releasePointer(event.pointerId))
presentation.renderer.domElement.addEventListener('lostpointercapture', (event) => releasePointer(event.pointerId))
window.addEventListener('blur', () => releasePointer())

function activatePrimaryAction() {
  if (simulation.phase === 'paused') simulation.togglePause()
  else simulation.start()
  syncPanel()
}

startButton.addEventListener('click', activatePrimaryAction)

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return
  event.preventDefault()
  if (simulation.phase === 'idle' || simulation.phase === 'game-over') simulation.start()
  else {
    releasePointer()
    simulation.togglePause()
  }
  syncPanel()
})

document.addEventListener('visibilitychange', () => {
  releasePointer()
  if (document.hidden && simulation.phase === 'running') {
    simulation.togglePause()
    accumulator = 0
    syncPanel()
  }
  previousFrame = performance.now()
})

function syncPanel() {
  const phase = simulation.phase
  startPanel.classList.toggle('is-hidden', phase === 'running')
  statusLight.classList.toggle('is-alert', phase === 'game-over')

  if (phase === 'idle') {
    panelTitle.innerHTML = 'ENTER THE<br /><em>LIVING FIELD</em>'
    panelCopy.innerHTML = '현미경 배양액 속에서 한 발씩 수축하며 작은 생명체를 흡수하세요.<br />크기와 진한 윤곽으로 포식자를 구별할 수 있습니다.'
    startButtonLabel.textContent = '표본 관찰 시작'
    statusCopy.textContent = 'SPECIMEN STABLE'
  } else if (phase === 'paused') {
    panelTitle.innerHTML = 'SPECIMEN<br /><em>SUSPENDED</em>'
    panelCopy.textContent = '관찰 시간이 정지되었습니다. 누락된 시간은 시뮬레이션하지 않습니다.'
    startButtonLabel.textContent = '관찰 재개'
    statusCopy.textContent = 'SIMULATION PAUSED'
  } else if (phase === 'game-over') {
    panelTitle.innerHTML = 'CELLULAR<br /><em>COLLAPSE</em>'
    panelCopy.textContent = `${simulation.absorbed}개 표본을 흡수한 뒤 더 큰 세포에 포식되었습니다.`
    startButtonLabel.textContent = '새 표본 배양'
    statusCopy.textContent = 'SPECIMEN LOST'
    liveRegion.textContent = `게임 종료. ${simulation.absorbed}개 생명체를 흡수했습니다.`
  } else {
    statusCopy.textContent = 'LIVE SIGNAL / TRACKING'
  }
}

function updateHud() {
  massValue.textContent = simulation.player.mass.toFixed(1)
  absorbedValue.textContent = String(simulation.absorbed)
  const xPercent = Math.round((simulation.player.x / simulation.worldWidth) * 100)
  const yPercent = Math.round((simulation.player.y / simulation.worldHeight) * 100)
  positionValue.textContent = `${xPercent} / ${yPercent}`
  fieldCursor.style.left = `${xPercent}%`
  fieldCursor.style.top = `${100 - yPercent}%`
  diagnosticsOutput.value = JSON.stringify({
    ...presentation.diagnostics(),
    phase: simulation.phase,
    mass: simulation.player.mass,
    absorbed: simulation.absorbed,
    runtimeIssues,
  })
}

/** @param {number} now */
function frame(now) {
  const frameSeconds = Math.min((now - previousFrame) / 1000, 0.1)
  previousFrame = now
  accumulator += frameSeconds
  let steps = 0

  while (accumulator >= fixedStepSeconds && steps < RULE_SET.maxCatchUpSteps) {
    simulation.step(fixedStepSeconds)
    accumulator -= fixedStepSeconds
    steps += 1
  }
  if (steps === RULE_SET.maxCatchUpSteps) accumulator = 0

  presentation.render(
    now / 1000,
    accumulator / fixedStepSeconds,
    frameSeconds,
    simulation.takeEvents(),
  )
  hudClock += frameSeconds
  if (hudClock >= 0.1) {
    hudClock = 0
    updateHud()
  }
  if (previousPhase !== simulation.phase) {
    previousPhase = simulation.phase
    if (simulation.phase !== 'running') releasePointer()
    syncPanel()
  }
  animationFrame = requestAnimationFrame(frame)
}

syncPanel()
updateHud()
animationFrame = requestAnimationFrame(frame)

if (import.meta.env.DEV) {
  Object.defineProperty(window, '__BIABYSS__', {
    value: {
      simulation,
      renderer: presentation,
      diagnostics: () => presentation.diagnostics(),
    },
    configurable: true,
  })
}

window.addEventListener(
  'beforeunload',
  () => {
    cancelAnimationFrame(animationFrame)
    resizeObserver.disconnect()
    presentation.dispose()
  },
  { once: true },
)
