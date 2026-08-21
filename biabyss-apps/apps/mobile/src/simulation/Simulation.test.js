import { describe, expect, it } from 'vitest'
import { RULE_SET } from '../domain/rules/ruleSet.js'
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
