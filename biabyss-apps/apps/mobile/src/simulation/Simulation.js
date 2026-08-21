// @ts-check

import { canAbsorb, radiusForMass } from '../domain/rules/mass.js'
import { RULE_SET } from '../domain/rules/ruleSet.js'
import { SeededRandom, stratifiedPositions } from './random.js'

/** @typedef {'idle' | 'running' | 'paused' | 'game-over'} RunPhase */

/**
 * @typedef {object} CellState
 * @property {string} id
 * @property {'player' | 'npc'} kind
 * @property {number} x
 * @property {number} y
 * @property {number} previousX
 * @property {number} previousY
 * @property {number} vx
 * @property {number} vy
 * @property {number} mass
 * @property {number} phase
 * @property {number} heading
 * @property {number} morph
 * @property {number} hue
 */

/**
 * @typedef {object} NutrientState
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {number} mass
 * @property {number} phase
 * @property {number} hue
 */

/**
 * @typedef {object} SimulationEvent
 * @property {'nutrient-absorbed' | 'cell-absorbed' | 'player-consumed'} type
 * @property {number} x
 * @property {number} y
 * @property {number} hue
 */

const TAU = Math.PI * 2

export class Simulation {
  /** @param {number} viewportWidth @param {number} viewportHeight @param {number} [seed] */
  constructor(viewportWidth, viewportHeight, seed = 0x0b1a7b55) {
    this.seed = seed
    this.random = new SeededRandom(seed)
    /** @type {RunPhase} */
    this.phase = 'idle'
    this.tick = 0
    this.elapsed = 0
    this.absorbed = 0
    this.score = 0
    this.viewportWidth = Math.max(320, viewportWidth)
    this.viewportHeight = Math.max(320, viewportHeight)
    this.worldWidth = this.viewportWidth * RULE_SET.world.viewportSpanMultiplier
    this.worldHeight = this.viewportHeight * RULE_SET.world.viewportSpanMultiplier
    this.invulnerableUntil = RULE_SET.player.startProtectionMs / 1000
    this.input = { x: this.worldWidth / 2, y: this.worldHeight / 2, strength: 0, active: false }
    /** @type {SimulationEvent[]} */
    this.events = []
    /** @type {CellState[]} */
    this.cells = []
    /** @type {NutrientState[]} */
    this.nutrients = []
    /** @type {CellState} */
    this.player = this.createPlayer()
    this.buildField()
  }

  /** @returns {CellState} */
  createPlayer() {
    const x = this.worldWidth / 2
    const y = this.worldHeight / 2
    return {
      id: 'cell-player',
      kind: 'player',
      x,
      y,
      previousX: x,
      previousY: y,
      vx: 0,
      vy: 0,
      mass: RULE_SET.player.initialMass,
      phase: this.random.between(0, TAU),
      heading: 0,
      morph: 5,
      hue: 0.49,
    }
  }

  buildField() {
    this.cells = [this.player]
    const npcPositions = stratifiedPositions(
      RULE_SET.npc.count,
      this.worldWidth,
      this.worldHeight,
      this.random,
    )

    for (let index = 0; index < npcPositions.length; index += 1) {
      const position = this.ensureSafePosition(npcPositions[index])
      this.cells.push(this.createNpc(index, position.x, position.y))
    }

    const nutrientPositions = stratifiedPositions(
      RULE_SET.nutrient.targetCount,
      this.worldWidth,
      this.worldHeight,
      this.random,
    )
    this.nutrients = nutrientPositions.map((position, index) => ({
      id: `nutrient-${index}`,
      x: position.x,
      y: position.y,
      mass: this.random.between(RULE_SET.nutrient.massMin, RULE_SET.nutrient.massMax),
      phase: this.random.between(0, TAU),
      hue: index % 4 === 0 ? 0.74 : this.random.between(0.45, 0.57),
    }))
  }

  /** @param {{x: number, y: number}} position */
  ensureSafePosition(position) {
    const dx = position.x - this.player.x
    const dy = position.y - this.player.y
    const distance = Math.hypot(dx, dy)
    if (distance >= RULE_SET.npc.safeSpawnDistance) return position

    const angle = distance > 0 ? Math.atan2(dy, dx) : this.random.between(0, TAU)
    return {
      x: this.clamp(
        this.player.x + Math.cos(angle) * RULE_SET.npc.safeSpawnDistance,
        80,
        this.worldWidth - 80,
      ),
      y: this.clamp(
        this.player.y + Math.sin(angle) * RULE_SET.npc.safeSpawnDistance,
        80,
        this.worldHeight - 80,
      ),
    }
  }

  /** @param {number} index @param {number} x @param {number} y @returns {CellState} */
  createNpc(index, x, y) {
    const heading = this.random.between(0, TAU)
    return {
      id: `cell-npc-${index}`,
      kind: 'npc',
      x,
      y,
      previousX: x,
      previousY: y,
      vx: Math.cos(heading) * this.random.between(5, 18),
      vy: Math.sin(heading) * this.random.between(5, 18),
      mass: this.random.between(RULE_SET.npc.massMin, RULE_SET.npc.massMax),
      phase: this.random.between(0, TAU),
      heading,
      morph: index % 6,
      hue: [0.48, 0.37, 0.78, 0.91, 0.12, 0.56][index % 6],
    }
  }

  start() {
    if (this.phase === 'running') return
    if (this.phase === 'game-over') this.reset(this.seed + 1)
    this.phase = 'running'
    this.input.active = false
  }

  /** @param {number} [seed] */
  reset(seed = this.seed + 1) {
    this.seed = seed
    this.random = new SeededRandom(seed)
    this.phase = 'idle'
    this.tick = 0
    this.elapsed = 0
    this.absorbed = 0
    this.score = 0
    this.invulnerableUntil = RULE_SET.player.startProtectionMs / 1000
    this.events.length = 0
    this.player = this.createPlayer()
    this.input = { x: this.player.x, y: this.player.y, strength: 0, active: false }
    this.buildField()
  }

  togglePause() {
    if (this.phase === 'running') this.phase = 'paused'
    else if (this.phase === 'paused') this.phase = 'running'
  }

  /** @param {number} x @param {number} y @param {boolean} active @param {number} [strength] */
  setInput(x, y, active, strength = 1) {
    this.input.x = this.clamp(x, 0, this.worldWidth)
    this.input.y = this.clamp(y, 0, this.worldHeight)
    this.input.strength = Number.isFinite(strength) ? this.clamp(strength, 0, 1) : 0
    this.input.active = active
  }

  releaseInput() {
    this.input.active = false
    this.input.strength = 0
  }

  /** @param {number} dtSeconds */
  step(dtSeconds) {
    if (this.phase !== 'running') return

    this.tick += 1
    this.elapsed += dtSeconds
    this.events.length = 0
    this.rememberPositions()
    this.movePlayer(dtSeconds)
    this.moveNpcs(dtSeconds)
    this.consumeNutrients()
    this.resolveCellContacts()
    this.score = Math.floor((this.player.mass - RULE_SET.player.initialMass) * 10 + this.elapsed * 2)
  }

  rememberPositions() {
    for (const cell of this.cells) {
      cell.previousX = cell.x
      cell.previousY = cell.y
    }
  }

  /** @param {number} dt */
  movePlayer(dt) {
    const player = this.player
    const dx = this.input.x - player.x
    const dy = this.input.y - player.y
    const distance = Math.hypot(dx, dy)

    if (this.input.active && distance > RULE_SET.player.deadZone) {
      const directionX = dx / distance
      const directionY = dy / distance
      const massFactor = Math.sqrt(RULE_SET.player.initialMass / player.mass)
      const strideWave = Math.sin(
        this.elapsed * RULE_SET.player.wriggleFrequency * TAU + player.phase,
      )
      const stride =
        RULE_SET.player.strideMinimum +
        (1 - RULE_SET.player.strideMinimum) * (0.5 + strideWave * 0.5)
      const inputStrength = this.input.strength
      player.vx +=
        (directionX * RULE_SET.player.acceleration * stride -
          directionY * strideWave * RULE_SET.player.wriggleAmplitude) *
        inputStrength *
        massFactor *
        dt
      player.vy +=
        (directionY * RULE_SET.player.acceleration * stride +
          directionX * strideWave * RULE_SET.player.wriggleAmplitude) *
        inputStrength *
        massFactor *
        dt
    }

    const drag = RULE_SET.player.dragPerSecond ** dt
    player.vx *= drag
    player.vy *= drag
    const inputSpeedFactor = this.input.active ? 0.35 + this.input.strength * 0.65 : 1
    this.limitVelocity(
      player,
      RULE_SET.player.maxSpeed *
        inputSpeedFactor *
        Math.sqrt(RULE_SET.player.initialMass / player.mass),
    )
    this.integrate(player, dt)
  }

  /** @param {number} dt */
  moveNpcs(dt) {
    for (let index = 1; index < this.cells.length; index += 1) {
      const npc = this.cells[index]
      const dx = this.player.x - npc.x
      const dy = this.player.y - npc.y
      const distance = Math.max(1, Math.hypot(dx, dy))
      const aware = distance < RULE_SET.npc.awarenessRadius
      const flees = canAbsorb(this.player.mass, npc.mass)
      const pursues = canAbsorb(npc.mass, this.player.mass)
      const protectedFromThreat = this.elapsed < this.invulnerableUntil && pursues
      const intent = aware ? (flees || protectedFromThreat ? -1 : pursues ? 1 : 0) : 0

      npc.heading += Math.sin(this.elapsed * 0.68 + npc.phase) * dt * 0.72
      const wanderX = Math.cos(npc.heading)
      const wanderY = Math.sin(npc.heading)
      const targetX = dx / distance
      const targetY = dy / distance
      const wriggle = Math.sin(this.elapsed * (1.35 + (index % 5) * 0.11) + npc.phase)
      npc.vx +=
        (wanderX * RULE_SET.npc.acceleration + targetX * intent * RULE_SET.npc.acceleration * 1.35 -
          targetY * wriggle * 9) *
        dt
      npc.vy +=
        (wanderY * RULE_SET.npc.acceleration + targetY * intent * RULE_SET.npc.acceleration * 1.35 +
          targetX * wriggle * 9) *
        dt
      npc.vx *= 0.72 ** dt
      npc.vy *= 0.72 ** dt
      this.limitVelocity(npc, RULE_SET.npc.maxSpeed * Math.sqrt(36 / npc.mass))
      this.integrate(npc, dt)
    }
  }

  consumeNutrients() {
    const playerRadius = radiusForMass(this.player.mass)
    for (const nutrient of this.nutrients) {
      if (Math.hypot(nutrient.x - this.player.x, nutrient.y - this.player.y) > playerRadius + 6) continue

      const gain = nutrient.mass * RULE_SET.mass.nutrientEfficiency
      this.player.mass = Math.min(RULE_SET.mass.maximum, this.player.mass + gain)
      this.absorbed += 1
      this.events.push({ type: 'nutrient-absorbed', x: nutrient.x, y: nutrient.y, hue: nutrient.hue })
      this.respawnNutrient(nutrient)
    }
  }

  resolveCellContacts() {
    if (this.elapsed < this.invulnerableUntil) return

    for (let index = 1; index < this.cells.length; index += 1) {
      const npc = this.cells[index]
      const contact =
        radiusForMass(this.player.mass) + radiusForMass(npc.mass) * RULE_SET.mass.contactDepthRatio
      if (Math.hypot(npc.x - this.player.x, npc.y - this.player.y) > contact) continue

      if (canAbsorb(this.player.mass, npc.mass)) {
        const gain = npc.mass * RULE_SET.mass.cellEfficiency
        this.player.mass = Math.min(RULE_SET.mass.maximum, this.player.mass + gain)
        this.absorbed += 1
        this.events.push({ type: 'cell-absorbed', x: npc.x, y: npc.y, hue: npc.hue })
        this.respawnNpc(npc)
      } else if (canAbsorb(npc.mass, this.player.mass)) {
        this.phase = 'game-over'
        this.events.push({ type: 'player-consumed', x: this.player.x, y: this.player.y, hue: npc.hue })
        return
      }
    }
  }

  /** @param {NutrientState} nutrient */
  respawnNutrient(nutrient) {
    nutrient.x = this.random.between(20, this.worldWidth - 20)
    nutrient.y = this.random.between(20, this.worldHeight - 20)
    nutrient.mass = this.random.between(RULE_SET.nutrient.massMin, RULE_SET.nutrient.massMax)
    nutrient.phase = this.random.between(0, TAU)
  }

  /** @param {CellState} npc */
  respawnNpc(npc) {
    const position = this.ensureSafePosition({
      x: this.random.between(80, this.worldWidth - 80),
      y: this.random.between(80, this.worldHeight - 80),
    })
    npc.x = position.x
    npc.y = position.y
    npc.previousX = position.x
    npc.previousY = position.y
    npc.vx = 0
    npc.vy = 0
    npc.mass = this.random.between(RULE_SET.npc.massMin, RULE_SET.npc.massMax)
    npc.phase = this.random.between(0, TAU)
    npc.morph = Math.floor(this.random.between(0, 6))
  }

  /** @param {CellState} cell @param {number} dt */
  integrate(cell, dt) {
    const radius = radiusForMass(cell.mass)
    cell.x += cell.vx * dt
    cell.y += cell.vy * dt

    if (cell.x < radius || cell.x > this.worldWidth - radius) {
      cell.vx *= -0.72
      cell.x = this.clamp(cell.x, radius, this.worldWidth - radius)
    }
    if (cell.y < radius || cell.y > this.worldHeight - radius) {
      cell.vy *= -0.72
      cell.y = this.clamp(cell.y, radius, this.worldHeight - radius)
    }
  }

  /** @param {CellState} cell @param {number} maximum */
  limitVelocity(cell, maximum) {
    const speed = Math.hypot(cell.vx, cell.vy)
    if (speed <= maximum || speed === 0) return
    cell.vx = (cell.vx / speed) * maximum
    cell.vy = (cell.vy / speed) * maximum
  }

  /** @param {number} value @param {number} minimum @param {number} maximum */
  clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value))
  }
}
