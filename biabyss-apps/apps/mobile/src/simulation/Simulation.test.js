import { describe, expect, it } from 'vitest'
import { RULE_SET } from '../domain/rules/ruleSet.js'
import { sampleGait } from '../domain/rules/gait.js'
import { Simulation } from './Simulation.js'

describe('Simulation field', () => {
  it('creates a field 36 times the viewport area', () => {
    const simulation = new Simulation(1000, 600, 707)
    expect(simulation.worldWidth * simulation.worldHeight).toBe(
      1000 * 600 * RULE_SET.world.viewportAreaMultiplier,
    )
    expect(simulation.cells).toHaveLength(RULE_SET.npc.count + 1)
    expect(simulation.nutrients).toHaveLength(RULE_SET.nutrient.targetCount)
    expect(new Set(simulation.cells.slice(1).map((cell) => cell.morph)).size).toBe(6)
    for (const npc of simulation.cells.slice(1)) {
      expect(Math.hypot(npc.x - simulation.player.x, npc.y - simulation.player.y)).toBeGreaterThanOrEqual(
        RULE_SET.npc.safeSpawnDistance - 0.001,
      )
    }
  })

  it('adds lateral movement instead of constant straight-line velocity', () => {
    const simulation = new Simulation(1000, 600, 707)
    simulation.start()
    simulation.setInput(simulation.player.x + 500, simulation.player.y, true)
    for (let tick = 0; tick < 60; tick += 1) simulation.step(1 / 60)
    expect(simulation.player.x).toBeGreaterThan(simulation.worldWidth / 2)
    expect(Math.abs(simulation.player.y - simulation.worldHeight / 2)).toBeGreaterThan(0.01)
  })

  it('moves in a burst and settles before the next front-axis reach', () => {
    const simulation = new Simulation(1000, 600, 707)
    simulation.start()
    simulation.setInput(simulation.player.x + 500, simulation.player.y, true, 1)
    let driveDistance = 0
    let reachDistance = 0
    let peakSpeed = 0
    let settledSpeed = Number.POSITIVE_INFINITY

    for (let tick = 0; tick < 37; tick += 1) {
      const previousX = simulation.player.x
      const previousY = simulation.player.y
      simulation.step(1 / RULE_SET.simulationHz)
      const gait = sampleGait(simulation.player.gaitPhase)
      const distance = Math.hypot(
        simulation.player.x - previousX,
        simulation.player.y - previousY,
      )
      const speed = Math.hypot(simulation.player.vx, simulation.player.vy)
      if (gait.segment === 'reach') reachDistance += distance
      if (gait.segment === 'drive') driveDistance += distance
      if (gait.segment === 'drive') peakSpeed = Math.max(peakSpeed, speed)
      if (gait.segment === 'rest' && gait.phase > 0.9) settledSpeed = Math.min(settledSpeed, speed)
    }

    expect(driveDistance).toBeGreaterThan(reachDistance * 8)
    expect(peakSpeed).toBeGreaterThan(120)
    expect(settledSpeed).toBeLessThan(peakSpeed * 0.15)
  })

  it('moves farther per stride at a stronger joystick ratio', () => {
    const weak = new Simulation(1000, 600, 707)
    const strong = new Simulation(1000, 600, 707)
    weak.start()
    strong.start()
    weak.setInput(weak.player.x + 500, weak.player.y, true, 0.25)
    strong.setInput(strong.player.x + 500, strong.player.y, true, 1)

    for (let tick = 0; tick < 120; tick += 1) {
      weak.step(1 / RULE_SET.simulationHz)
      strong.step(1 / RULE_SET.simulationHz)
    }

    const weakDistance = Math.hypot(
      weak.player.x - weak.worldWidth / 2,
      weak.player.y - weak.worldHeight / 2,
    )
    const strongDistance = Math.hypot(
      strong.player.x - strong.worldWidth / 2,
      strong.player.y - strong.worldHeight / 2,
    )
    expect(strongDistance).toBeGreaterThan(weakDistance * 2)
  })

  it('does not add thrust at zero joystick strength', () => {
    const simulation = new Simulation(1000, 600, 707)
    simulation.start()
    simulation.setInput(simulation.player.x + 500, simulation.player.y, true, 0)
    for (let tick = 0; tick < 60; tick += 1) simulation.step(1 / RULE_SET.simulationHz)
    expect(simulation.player.x).toBe(simulation.worldWidth / 2)
    expect(simulation.player.y).toBe(simulation.worldHeight / 2)
  })

  it('keeps strength-based movement deterministic', () => {
    const first = new Simulation(1000, 600, 911)
    const second = new Simulation(1000, 600, 911)
    first.start()
    second.start()
    first.setInput(first.player.x + 400, first.player.y + 200, true, 0.63)
    second.setInput(second.player.x + 400, second.player.y + 200, true, 0.63)
    for (let tick = 0; tick < 180; tick += 1) {
      first.step(1 / RULE_SET.simulationHz)
      second.step(1 / RULE_SET.simulationHz)
    }
    expect(first.player.x).toBe(second.player.x)
    expect(first.player.y).toBe(second.player.y)
    expect(first.player.vx).toBe(second.player.vx)
    expect(first.player.vy).toBe(second.player.vy)
  })

  it('keeps gait and movement identical across 30, 60 and 120 Hz render schedules', () => {
    /** @param {number} renderHz */
    const runSchedule = (renderHz) => {
      const simulation = new Simulation(1000, 600, 911)
      const fixedStep = 1 / RULE_SET.simulationHz
      let accumulator = 0
      simulation.start()
      simulation.setInput(simulation.player.x + 400, simulation.player.y + 200, true, 0.63)

      for (let frame = 0; frame < renderHz * 2; frame += 1) {
        accumulator += 1 / renderHz
        while (accumulator + Number.EPSILON >= fixedStep) {
          simulation.step(fixedStep)
          accumulator -= fixedStep
        }
      }
      return simulation
    }

    const at30 = runSchedule(30)
    const at60 = runSchedule(60)
    const at120 = runSchedule(120)
    for (const simulation of [at30, at60, at120]) expect(simulation.tick).toBe(120)
    expect(at30.player.x).toBe(at60.player.x)
    expect(at30.player.y).toBe(at60.player.y)
    expect(at30.player.gaitPhase).toBe(at60.player.gaitPhase)
    expect(at30.player.gaitCycle).toBe(at60.player.gaitCycle)
    expect(at120.player.x).toBe(at60.player.x)
    expect(at120.player.y).toBe(at60.player.y)
    expect(at120.player.gaitPhase).toBe(at60.player.gaitPhase)
    expect(at120.player.gaitCycle).toBe(at60.player.gaitCycle)
  })

  it('freezes simulation state while paused', () => {
    const simulation = new Simulation(1000, 600, 707)
    simulation.start()
    simulation.togglePause()
    simulation.step(1 / 60)
    expect(simulation.tick).toBe(0)
    expect(simulation.elapsed).toBe(0)
  })

  it('absorbs nutrients exactly once and increases mass', () => {
    const simulation = new Simulation(1000, 600, 707)
    const nutrient = simulation.nutrients[0]
    nutrient.x = simulation.player.x
    nutrient.y = simulation.player.y
    const previousMass = simulation.player.mass
    simulation.start()
    simulation.step(1 / 60)
    expect(simulation.absorbed).toBe(1)
    expect(simulation.player.mass).toBeGreaterThan(previousMass)
    expect(simulation.events.map((event) => event.type)).toContain('nutrient-absorbed')
  })

  it('ends the run when a larger predator contacts the player after protection', () => {
    const simulation = new Simulation(1000, 600, 707)
    const predator = simulation.cells[1]
    predator.x = simulation.player.x
    predator.y = simulation.player.y
    predator.mass = simulation.player.mass * 2
    simulation.start()
    simulation.elapsed = simulation.invulnerableUntil
    simulation.step(1 / 60)
    expect(simulation.phase).toBe('game-over')
    expect(simulation.events.map((event) => event.type)).toContain('player-consumed')
  })
})
