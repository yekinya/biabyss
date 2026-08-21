import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { RULE_SET } from '../../domain/rules/ruleSet.js'
import { Simulation } from '../../simulation/Simulation.js'
import { FluidTrails } from './ParticleSystems.js'

describe('absorption fragment particles', () => {
  it('moves a pooled prey fragment toward the predator over its lifetime', () => {
    const scene = new THREE.Scene()
    const trails = new FluidTrails(scene, 1)
    const simulation = new Simulation(1000, 600, 707)
    const predator = simulation.player
    const prey = simulation.cells[1]
    predator.x = 100
    predator.y = 0
    prey.x = 0
    prey.y = 0
    prey.mass = 25
    prey.phase = 0.4
    prey.hue = 0.3
    trails.emitAbsorption(predator, prey, 0.5)

    expect(trails.cursor).toBe(1)
    expect(trails.life[0]).toBeCloseTo(
      RULE_SET.rendering.absorptionParticleLifetimeSeconds,
      6,
    )
    expect(trails.driftX[0]).toBeGreaterThan(0)
    expect(trails.maximumSize[0]).toBeGreaterThan(3)
    const previousX = trails.buffer.positions[0]
    trails.update(1 / 60)
    expect(trails.buffer.positions[0]).toBeGreaterThan(previousX)
    expect(trails.life[0]).toBeLessThan(RULE_SET.rendering.absorptionParticleLifetimeSeconds)
    expect(Array.from(trails.buffer.positions).every(Number.isFinite)).toBe(true)
    trails.dispose()
  })
})
