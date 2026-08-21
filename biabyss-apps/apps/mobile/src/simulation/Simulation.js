// @ts-check

import {
  contactDistanceForMasses,
  movementFactorForMass,
  predatorPreyForContact,
  radiusForMass,
} from '../domain/rules/mass.js'
import { aggroIntent, selectAggroTarget } from '../domain/rules/npcBehavior.js'
import { nutrientRadius } from '../domain/rules/nutrient.js'
import { advanceGait, sampleGait } from '../domain/rules/gait.js'
import { RULE_SET } from '../domain/rules/ruleSet.js'
import { CellSpatialIndex } from './CellSpatialIndex.js'
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
 * @property {'player' | 'micrococcus' | 'ciliophoran' | 'larvoid' | 'tentacle-amoeba' | 'diplococcus' | 'streptococcus' | 'spirillum' | 'radiolarian'} speciesId
 * @property {number} phase
 * @property {number} heading
 * @property {number} morph
 * @property {number} hue
 * @property {number} previousGaitPhase
 * @property {number} gaitPhase
 * @property {number} gaitCycle
 * @property {string | undefined} absorbedBy
 * @property {number} previousAbsorptionProgress
 * @property {number} absorptionProgress
 * @property {number} previousFeedingProgress
 * @property {number} feedingProgress
 * @property {string | undefined} targetId
 * @property {number} nextDecisionTick
 */

/**
 * @typedef {object} AbsorptionState
 * @property {string} predatorId
 * @property {string} preyId
 * @property {number} elapsedSeconds
 * @property {number} startPreyMass
 * @property {number} transferredMass
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

/**
 * @param {{reachBrakePerSecond: number, driveBrakePerSecond: number, catchBrakePerSecond: number, restBrakePerSecond: number}} config
 * @param {'reach' | 'drive' | 'catch' | 'rest'} segment
 */
function brakeForSegment(config, segment) {
  if (segment === 'reach') return config.reachBrakePerSecond
  if (segment === 'drive') return config.driveBrakePerSecond
  if (segment === 'catch') return config.catchBrakePerSecond
  return config.restBrakePerSecond
}

/** @param {number} current @param {number} target @param {number} maximumDelta */
function turnToward(current, target, maximumDelta) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + Math.max(-maximumDelta, Math.min(maximumDelta, delta))
}

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
    this.cellSpatialIndex = new CellSpatialIndex(RULE_SET.npc.spatialCellSize, this.worldWidth)
    /** @type {CellState[]} */
    this.spatialCandidates = []
    this.invulnerableUntil = RULE_SET.player.startProtectionMs / 1000
    this.input = { x: this.worldWidth / 2, y: this.worldHeight / 2, strength: 0, active: false }
    /** @type {SimulationEvent[]} */
    this.events = []
    /** @type {CellState[]} */
    this.cells = []
    /** @type {Map<string, CellState>} */
    this.cellLookup = new Map()
    /** @type {NutrientState[]} */
    this.nutrients = []
    /** @type {AbsorptionState[]} */
    this.activeAbsorptions = []
    this.busyCellIds = new Set()
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
      speciesId: 'player',
      phase: this.random.between(0, TAU),
      heading: 0,
      morph: 8,
      hue: 0.49,
      previousGaitPhase: 0,
      gaitPhase: 0,
      gaitCycle: 0,
      absorbedBy: undefined,
      previousAbsorptionProgress: 0,
      absorptionProgress: 0,
      previousFeedingProgress: 0,
      feedingProgress: 0,
      targetId: undefined,
      nextDecisionTick: 0,
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
    this.cellLookup = new Map(this.cells.map((cell) => [cell.id, cell]))
    this.cellSpatialIndex.rebuild(this.cells)
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
    const archetype = RULE_SET.npc.archetypes[index % RULE_SET.npc.archetypes.length]
    const heading = this.random.between(0, TAU)
    const gaitPhase = this.random.between(0, 1)
    return {
      id: `cell-npc-${index}`,
      kind: 'npc',
      x,
      y,
      previousX: x,
      previousY: y,
      vx: 0,
      vy: 0,
      mass: this.random.between(archetype.massMin, archetype.massMax),
      speciesId: archetype.id,
      phase: this.random.between(0, TAU),
      heading,
      morph: archetype.morph,
      hue: [0.31, 0.18, 0.13, 0.06, 0.23, 0.28, 0.46, 0.09][
        index % RULE_SET.npc.archetypes.length
      ],
      previousGaitPhase: gaitPhase,
      gaitPhase,
      gaitCycle: index,
      absorbedBy: undefined,
      previousAbsorptionProgress: 0,
      absorptionProgress: 0,
      previousFeedingProgress: 0,
      feedingProgress: 0,
      targetId: undefined,
      nextDecisionTick: index % RULE_SET.npc.decisionIntervalTicks,
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
    this.activeAbsorptions.length = 0
    this.busyCellIds.clear()
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
    this.rememberPositions()
    this.cellSpatialIndex.rebuild(this.cells)
    this.movePlayer(dtSeconds)
    this.moveNpcs(dtSeconds)
    if (this.updateAbsorptions(dtSeconds)) return
    this.cellSpatialIndex.rebuild(this.cells)
    this.consumeNutrients()
    this.resolveCellContacts()
    this.score = Math.floor((this.player.mass - RULE_SET.player.initialMass) * 10 + this.elapsed * 2)
  }

  takeEvents() {
    const events = this.events
    this.events = []
    return events
  }

  rememberPositions() {
    for (const cell of this.cells) {
      cell.previousX = cell.x
      cell.previousY = cell.y
      cell.previousGaitPhase = cell.gaitPhase
      cell.previousAbsorptionProgress = cell.absorptionProgress
      cell.previousFeedingProgress = cell.feedingProgress
    }
  }

  /** @param {number} dt */
  movePlayer(dt) {
    const player = this.player
    if (player.absorbedBy) return
    const dx = this.input.x - player.x
    const dy = this.input.y - player.y
    const distance = Math.hypot(dx, dy)

    const moving = this.input.active && this.input.strength > 0 && distance > RULE_SET.player.deadZone
    if (moving) {
      const directionX = dx / distance
      const directionY = dy / distance
      const massFactor = movementFactorForMass(player.mass, RULE_SET.player.initialMass)
      const inputStrength = this.input.strength
      player.heading = Math.atan2(directionY, directionX)
      this.advanceCellGait(
        player,
        dt,
        RULE_SET.player.gaitFrequency * (0.65 + inputStrength * 0.35),
      )
      const gait = sampleGait(player.gaitPhase)
      const brake = brakeForSegment(RULE_SET.player, gait.segment)
      const damping = Math.exp(-brake * dt)
      const sideSign = player.gaitCycle % 2 === 0 ? 1 : -1
      player.vx =
        player.vx * damping +
        (directionX * RULE_SET.player.burstAcceleration -
          directionY * RULE_SET.player.lateralBurst * sideSign) *
          gait.drive *
          inputStrength *
          massFactor *
          dt
      player.vy =
        player.vy * damping +
        (directionY * RULE_SET.player.burstAcceleration +
          directionX * RULE_SET.player.lateralBurst * sideSign) *
          gait.drive *
          inputStrength *
          massFactor *
          dt
      this.limitVelocity(
        player,
        RULE_SET.player.maxSpeed *
          RULE_SET.gait.movementSpeedMultiplier *
          (0.35 + inputStrength * 0.65) *
          massFactor,
      )
    } else {
      player.gaitPhase = 0
      const damping = Math.exp(-RULE_SET.player.restBrakePerSecond * dt)
      player.vx *= damping
      player.vy *= damping
    }
    this.integrate(player, dt)
  }

  /** @param {number} dt */
  moveNpcs(dt) {
    for (let index = 1; index < this.cells.length; index += 1) {
      const npc = this.cells[index]
      if (npc.absorbedBy) continue
      const archetype = this.archetypeFor(npc)
      let steeringTarget = this.cellById(npc.targetId)
      if (
        steeringTarget &&
        !selectAggroTarget(archetype, npc, [steeringTarget])
      ) {
        npc.targetId = undefined
        steeringTarget = undefined
      }

      if (
        (archetype.aggro === 'pursue-player' || archetype.aggro === 'pursue-cell') &&
        this.tick >= npc.nextDecisionTick
      ) {
        const candidates = /** @type {CellState[]} */ (
          this.cellSpatialIndex.query(
            npc.x,
            npc.y,
            archetype.aggroRadius,
            this.spatialCandidates,
          )
        )
        steeringTarget = /** @type {CellState | undefined} */ (
          selectAggroTarget(archetype, npc, candidates)
        )
        npc.targetId = steeringTarget?.id
        npc.nextDecisionTick = this.tick + RULE_SET.npc.decisionIntervalTicks
      }

      let aggroDirection = 0
      let dx = this.player.x - npc.x
      let dy = this.player.y - npc.y
      let distance = Math.max(1, Math.hypot(dx, dy))
      if (steeringTarget) {
        dx = steeringTarget.x - npc.x
        dy = steeringTarget.y - npc.y
        distance = Math.max(1, Math.hypot(dx, dy))
        aggroDirection = aggroIntent(archetype, distance, true)
      } else if (archetype.aggro === 'flee') {
        aggroDirection = aggroIntent(archetype, distance)
      }

      if (aggroDirection !== 0) {
        const targetHeading = Math.atan2(dy * aggroDirection, dx * aggroDirection)
        npc.heading = turnToward(npc.heading, targetHeading, archetype.turnRate * dt)
      } else {
        npc.heading +=
          Math.sin(this.elapsed * (0.34 + (index % 7) * 0.025) + npc.phase) *
          dt *
          archetype.turnRate
      }

      const directionX = Math.cos(npc.heading)
      const directionY = Math.sin(npc.heading)
      this.advanceCellGait(npc, dt, archetype.gaitFrequency)

      if (archetype.locomotion === 'constant' || archetype.locomotion === 'drift') {
        const referenceMass = (archetype.massMin + archetype.massMax) * 0.5
        const massFactor = movementFactorForMass(npc.mass, referenceMass)
        const driftPulse =
          archetype.locomotion === 'drift'
            ? 0.72 + Math.sin(this.elapsed + npc.phase) * 0.18
            : 1
        const targetSpeed =
          archetype.maxSpeed * RULE_SET.gait.movementSpeedMultiplier * driftPulse * massFactor
        const velocityBlend =
          1 - Math.exp(-(archetype.locomotion === 'constant' ? 8 : 1.8) * dt)
        npc.vx += (directionX * targetSpeed - npc.vx) * velocityBlend
        npc.vy += (directionY * targetSpeed - npc.vy) * velocityBlend
        this.integrate(npc, dt)
        continue
      }

      const gait = sampleGait(npc.gaitPhase)
      const brake = brakeForSegment(RULE_SET.npc, gait.segment)
      const damping = Math.exp(-brake * dt)
      const sideSign = npc.gaitCycle % 2 === 0 ? 1 : -1
      const referenceMass = (archetype.massMin + archetype.massMax) * 0.5
      const massFactor = movementFactorForMass(npc.mass, referenceMass)
      npc.vx =
        npc.vx * damping +
        (directionX * archetype.burstAcceleration -
          directionY * archetype.lateralBurst * sideSign) *
          gait.drive *
          massFactor *
          dt
      npc.vy =
        npc.vy * damping +
        (directionY * archetype.burstAcceleration +
          directionX * archetype.lateralBurst * sideSign) *
          gait.drive *
          massFactor *
          dt
      this.limitVelocity(
        npc,
        archetype.maxSpeed * RULE_SET.gait.movementSpeedMultiplier * massFactor,
      )
      this.integrate(npc, dt)
    }
  }

  consumeNutrients() {
    if (this.player.absorbedBy) return
    const playerRadius = radiusForMass(this.player.mass)
    for (const nutrient of this.nutrients) {
      if (
        Math.hypot(nutrient.x - this.player.x, nutrient.y - this.player.y) >
        playerRadius + nutrientRadius(nutrient.mass)
      ) {
        continue
      }

      const gain = nutrient.mass * RULE_SET.mass.nutrientEfficiency
      this.player.mass = Math.min(RULE_SET.mass.maximum, this.player.mass + gain)
      this.absorbed += 1
      this.events.push({ type: 'nutrient-absorbed', x: nutrient.x, y: nutrient.y, hue: nutrient.hue })
      this.respawnNutrient(nutrient)
    }
  }

  resolveCellContacts() {
    let maximumRadius = 0
    for (const cell of this.cells) {
      maximumRadius = Math.max(maximumRadius, radiusForMass(cell.mass))
    }
    /** @type {{first: CellState, second: CellState}[]} */
    const contacts = []

    for (const first of this.cells) {
      if (first.absorbedBy || this.isCellBusy(first.id)) continue
      const candidates = /** @type {CellState[]} */ (
        this.cellSpatialIndex.query(
          first.x,
          first.y,
          (radiusForMass(first.mass) + maximumRadius) *
            RULE_SET.mass.contactRadiusMultiplier,
          this.spatialCandidates,
        )
      )
      for (const second of candidates) {
        if (first.id >= second.id || second.absorbedBy || this.isCellBusy(second.id)) continue
        const contactDistance = contactDistanceForMasses(first.mass, second.mass)
        if (Math.hypot(second.x - first.x, second.y - first.y) > contactDistance) continue
        contacts.push({ first, second })
      }
    }

    contacts.sort((left, right) => {
      if (left.first.id !== right.first.id) return left.first.id < right.first.id ? -1 : 1
      return left.second.id < right.second.id ? -1 : left.second.id > right.second.id ? 1 : 0
    })

    for (const { first, second } of contacts) {
      if (this.isCellBusy(first.id) || this.isCellBusy(second.id)) continue
      const { predator, prey } = predatorPreyForContact(first, second)
      if (prey.kind === 'player' && this.elapsed < this.invulnerableUntil) continue
      this.startAbsorption(predator, prey)
    }
  }

  /** @param {number} dt @returns {boolean} */
  updateAbsorptions(dt) {
    for (let index = this.activeAbsorptions.length - 1; index >= 0; index -= 1) {
      const state = this.activeAbsorptions[index]
      const predator = this.cellById(state.predatorId)
      const prey = this.cellById(state.preyId)
      if (!predator || !prey) {
        this.busyCellIds.delete(state.predatorId)
        this.busyCellIds.delete(state.preyId)
        this.activeAbsorptions.splice(index, 1)
        continue
      }

      state.elapsedSeconds += dt
      const predatorRadius = radiusForMass(predator.mass)
      const preyRadius = radiusForMass(prey.mass)
      const distance = Math.hypot(predator.x - prey.x, predator.y - prey.y)
      const contactDistance =
        (predatorRadius + preyRadius) * RULE_SET.mass.contactRadiusMultiplier
      const overlapDepth = Math.max(0, contactDistance - distance)
      const overlapRatio = this.clamp(overlapDepth / Math.max(preyRadius * 2, 0.001), 0, 1)
      const contactFactor = Math.max(
        RULE_SET.mass.absorptionMinimumContactFactor,
        overlapRatio,
      )
      const availableMass = Math.max(0, prey.mass - RULE_SET.mass.absorptionMinimumMass)
      const damageMass = Math.min(
        availableMass,
        state.startPreyMass *
          RULE_SET.mass.absorptionDamageFractionPerSecond *
          contactFactor *
          dt,
      )
      prey.mass = Math.max(RULE_SET.mass.absorptionMinimumMass, prey.mass - damageMass)
      const gainedMass = damageMass * RULE_SET.mass.cellEfficiency
      state.transferredMass += gainedMass
      predator.mass = Math.min(RULE_SET.mass.maximum, predator.mass + gainedMass)
      const drainableMass = Math.max(
        Number.EPSILON,
        state.startPreyMass - RULE_SET.mass.absorptionMinimumMass,
      )
      const progress = this.clamp((state.startPreyMass - prey.mass) / drainableMass, 0, 1)
      prey.absorptionProgress = progress
      predator.feedingProgress = Math.sin(progress * Math.PI)
      predator.heading = Math.atan2(prey.y - predator.y, prey.x - predator.x)
      prey.vx = 0
      prey.vy = 0
      prey.heading = Math.atan2(predator.y - prey.y, predator.x - prey.x)
      const pull = 1 - Math.exp(-RULE_SET.mass.absorptionPullPerSecond * dt)
      prey.x += (predator.x - prey.x) * pull
      prey.y += (predator.y - prey.y) * pull

      if (prey.mass > RULE_SET.mass.absorptionMinimumMass + Number.EPSILON) continue
      prey.mass = RULE_SET.mass.absorptionMinimumMass
      prey.absorptionProgress = 1
      predator.feedingProgress = 0
      this.busyCellIds.delete(predator.id)
      this.busyCellIds.delete(prey.id)
      this.activeAbsorptions.splice(index, 1)
      if (prey.kind === 'player') {
        this.phase = 'game-over'
        this.events.push({
          type: 'player-consumed',
          x: prey.x,
          y: prey.y,
          hue: predator.hue,
        })
        return true
      }

      this.absorbed += 1
      this.events.push({ type: 'cell-absorbed', x: prey.x, y: prey.y, hue: prey.hue })
      this.respawnNpc(prey)
    }
    return false
  }

  /** @param {CellState} predator @param {CellState} prey */
  startAbsorption(predator, prey) {
    if (prey.absorbedBy || this.isCellBusy(predator.id) || this.isCellBusy(prey.id)) return
    prey.absorbedBy = predator.id
    prey.absorptionProgress = 0
    prey.previousAbsorptionProgress = 0
    prey.vx = 0
    prey.vy = 0
    predator.heading = Math.atan2(prey.y - predator.y, prey.x - predator.x)
    predator.feedingProgress = 0
    predator.targetId = undefined
    prey.targetId = undefined
    this.busyCellIds.add(predator.id)
    this.busyCellIds.add(prey.id)
    this.activeAbsorptions.push({
      predatorId: predator.id,
      preyId: prey.id,
      elapsedSeconds: 0,
      startPreyMass: prey.mass,
      transferredMass: 0,
    })
  }

  /** @param {string} id */
  isCellBusy(id) {
    return this.busyCellIds.has(id)
  }

  /** @param {string | undefined} id */
  cellById(id) {
    if (!id) return undefined
    return this.cellLookup.get(id)
  }

  /** @param {CellState} cell */
  archetypeFor(cell) {
    const archetype = RULE_SET.npc.archetypes.find((candidate) => candidate.id === cell.speciesId)
    if (!archetype) throw new Error(`Unknown NPC species: ${cell.speciesId}`)
    return archetype
  }

  /** @param {NutrientState} nutrient */
  respawnNutrient(nutrient) {
    nutrient.x = this.random.between(20, this.worldWidth - 20)
    nutrient.y = this.random.between(20, this.worldHeight - 20)
    nutrient.mass = this.random.between(RULE_SET.nutrient.massMin, RULE_SET.nutrient.massMax)
    nutrient.phase = this.random.between(0, TAU)
    nutrient.hue = this.random.between(0.45, 0.57)
  }

  /** @param {CellState} npc */
  respawnNpc(npc) {
    const archetype = this.archetypeFor(npc)
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
    npc.mass = this.random.between(archetype.massMin, archetype.massMax)
    npc.phase = this.random.between(0, TAU)
    npc.morph = archetype.morph
    npc.gaitPhase = this.random.between(0, 1)
    npc.previousGaitPhase = npc.gaitPhase
    npc.gaitCycle += 1
    npc.absorbedBy = undefined
    npc.previousAbsorptionProgress = 0
    npc.absorptionProgress = 0
    npc.previousFeedingProgress = 0
    npc.feedingProgress = 0
    npc.targetId = undefined
    npc.nextDecisionTick = this.tick + RULE_SET.npc.decisionIntervalTicks
  }

  /** @param {CellState} cell @param {number} dt @param {number} frequency */
  advanceCellGait(cell, dt, frequency) {
    const next = advanceGait(cell.gaitPhase, dt, frequency)
    cell.gaitPhase = next.phase
    cell.gaitCycle += next.completedCycles
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
