// @ts-check

import * as THREE from 'three'
import { interpolateGaitPhase, sampleGait } from '../../domain/rules/gait.js'
import { nutrientPointSize } from '../../domain/rules/nutrient.js'
import { RULE_SET } from '../../domain/rules/ruleSet.js'
import { particleFragmentShader, particleVertexShader } from './shaders/particleShader.js'

class PointBuffer {
  /** @param {number} capacity @param {number} pixelRatio @param {THREE.Blending} [blending] */
  constructor(capacity, pixelRatio, blending = THREE.NormalBlending) {
    this.capacity = capacity
    this.positions = new Float32Array(capacity * 3)
    this.sizes = new Float32Array(capacity)
    this.alphas = new Float32Array(capacity)
    this.colors = new Float32Array(capacity * 3)
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1).setUsage(THREE.DynamicDrawUsage))
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1).setUsage(THREE.DynamicDrawUsage))
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage))
    this.material = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: pixelRatio } },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending,
    })
    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false
  }

  /** @param {number} index @param {number} x @param {number} y @param {number} z @param {number} size @param {number} alpha @param {THREE.Color} color */
  set(index, x, y, z, size, alpha, color) {
    const offset = index * 3
    this.positions[offset] = x
    this.positions[offset + 1] = y
    this.positions[offset + 2] = z
    this.sizes[index] = size
    this.alphas[index] = alpha
    this.colors[offset] = color.r
    this.colors[offset + 1] = color.g
    this.colors[offset + 2] = color.b
  }

  commit() {
    this.geometry.getAttribute('position').needsUpdate = true
    this.geometry.getAttribute('aSize').needsUpdate = true
    this.geometry.getAttribute('aAlpha').needsUpdate = true
    this.geometry.getAttribute('aColor').needsUpdate = true
  }

  /** @param {number} pixelRatio */
  setPixelRatio(pixelRatio) {
    this.material.uniforms.uPixelRatio.value = pixelRatio
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}

export class AmbientParticles {
  /** @param {THREE.Scene} scene @param {number} width @param {number} height @param {import('../../simulation/random.js').SeededRandom} random @param {number} pixelRatio */
  constructor(scene, width, height, random, pixelRatio) {
    this.buffer = new PointBuffer(RULE_SET.rendering.ambientParticles, pixelRatio)
    const color = new THREE.Color()
    for (let index = 0; index < this.buffer.capacity; index += 1) {
      color.setHSL(random.between(0.14, 0.26), random.between(0.05, 0.28), random.between(0.12, 0.34))
      this.buffer.set(
        index,
        random.between(0, width),
        random.between(0, height),
        -2,
        random.between(1, 4.2),
        random.between(0.04, 0.18),
        color,
      )
    }
    this.buffer.commit()
    scene.add(this.buffer.points)
  }

  /** @param {number} pixelRatio */
  setPixelRatio(pixelRatio) {
    this.buffer.setPixelRatio(pixelRatio)
  }

  dispose() {
    this.buffer.dispose()
  }
}

export class NutrientParticles {
  /** @param {THREE.Scene} scene @param {number} pixelRatio */
  constructor(scene, pixelRatio) {
    this.buffer = new PointBuffer(
      RULE_SET.nutrient.targetCount,
      pixelRatio,
      THREE.AdditiveBlending,
    )
    this.color = new THREE.Color()
    scene.add(this.buffer.points)
  }

  /** @param {import('../../simulation/Simulation.js').Simulation} simulation @param {number} time @param {number} opticalStage */
  update(simulation, time, opticalStage) {
    for (let index = 0; index < simulation.nutrients.length; index += 1) {
      const nutrient = simulation.nutrients[index]
      const pulse = 0.78 + Math.sin(time * 2.1 + nutrient.phase) * 0.18
      const size = nutrientPointSize(nutrient.mass)
      const stageHue = THREE.MathUtils.lerp(0.31, 0.16, opticalStage / 2)
      this.color.setHSL(stageHue + (nutrient.hue - 0.5) * 0.08, 0.62, 0.62)
      this.buffer.set(index, nutrient.x, nutrient.y, 1, size * pulse, 0.34, this.color)
    }
    this.buffer.commit()
  }

  /** @param {number} pixelRatio */
  setPixelRatio(pixelRatio) {
    this.buffer.setPixelRatio(pixelRatio)
  }

  dispose() {
    this.buffer.dispose()
  }
}

export class InternalParticles {
  /** @param {THREE.Scene} scene @param {number} cellCapacity @param {number} pixelRatio */
  constructor(scene, cellCapacity, pixelRatio) {
    this.perCell = RULE_SET.rendering.internalParticlesPerCell
    this.buffer = new PointBuffer(cellCapacity * this.perCell, pixelRatio)
    this.color = new THREE.Color()
    scene.add(this.buffer.points)
  }

  /** @param {import('../../simulation/Simulation.js').Simulation} simulation @param {number} time @param {number} alpha */
  update(simulation, time, alpha) {
    let particleIndex = 0
    for (const cell of simulation.cells) {
      const x = THREE.MathUtils.lerp(cell.previousX, cell.x, alpha)
      const y = THREE.MathUtils.lerp(cell.previousY, cell.y, alpha)
      const radius = Math.sqrt(cell.mass) * RULE_SET.mass.radiusScale
      const absorption = THREE.MathUtils.lerp(
        cell.previousAbsorptionProgress,
        cell.absorptionProgress,
        alpha,
      )
      const visualRadius = radius * Math.max(0.1, 1 - absorption * 0.9)
      const speed = Math.hypot(cell.vx, cell.vy)
      const gait = sampleGait(interpolateGaitPhase(cell.previousGaitPhase, cell.gaitPhase, alpha))
      const flowRate = 0.35 + gait.drive * 2.6 + gait.rearCatch * 0.8
      const inertiaScale = Math.min(visualRadius * 0.18, speed * 0.045)
      const inertiaX = speed > 0 ? (-cell.vx / speed) * inertiaScale : 0
      const inertiaY = speed > 0 ? (-cell.vy / speed) * inertiaScale : 0
      this.color.setRGB(cell.kind === 'player' ? 0.13 : 0.18, cell.kind === 'player' ? 0.18 : 0.2, 0.14)
      for (let localIndex = 0; localIndex < this.perCell; localIndex += 1) {
        const spread =
          0.68 +
          0.3 *
            (0.5 +
              Math.sin(time * (0.22 + localIndex * 0.012) * flowRate + cell.phase + localIndex) *
                0.5)
        const angle =
          time * (0.08 + localIndex * 0.009) * flowRate +
          cell.phase +
          localIndex * 2.17 +
          spread * 0.75
        const orbit = visualRadius * (0.1 + (localIndex % 4) * 0.085) * spread
        const twinkle =
          0.72 + Math.sin(time * 0.38 + cell.phase * 2 + localIndex) * 0.12
        const axisOffset =
          (localIndex % 2 === 0 ? 1 : -1) * gait.frontReach * visualRadius * 0.16 +
          gait.rearCatch * visualRadius * 0.08
        const headingX = Math.cos(cell.heading)
        const headingY = Math.sin(cell.heading)
        this.buffer.set(
          particleIndex,
          x + inertiaX + headingX * axisOffset + Math.cos(angle) * orbit,
          y + inertiaY + headingY * axisOffset + Math.sin(angle * 1.13) * orbit * 0.82,
          5,
          (cell.kind === 'player' ? 3.6 : 2.8) * (0.82 + twinkle * 0.18),
          (cell.kind === 'player' ? 0.52 : 0.38) * twinkle * (1 - absorption * 0.9),
          this.color,
        )
        particleIndex += 1
      }
    }
    this.buffer.commit()
  }

  /** @param {number} pixelRatio */
  setPixelRatio(pixelRatio) {
    this.buffer.setPixelRatio(pixelRatio)
  }

  dispose() {
    this.buffer.dispose()
  }
}

export class FluidTrails {
  /** @param {THREE.Scene} scene @param {number} pixelRatio */
  constructor(scene, pixelRatio) {
    this.buffer = new PointBuffer(RULE_SET.rendering.trailCapacity, pixelRatio)
    this.life = new Float32Array(this.buffer.capacity)
    this.maximumLife = new Float32Array(this.buffer.capacity)
    this.maximumSize = new Float32Array(this.buffer.capacity)
    this.maximumAlpha = new Float32Array(this.buffer.capacity)
    this.driftX = new Float32Array(this.buffer.capacity)
    this.driftY = new Float32Array(this.buffer.capacity)
    this.cursor = 0
    this.color = new THREE.Color()
    scene.add(this.buffer.points)
  }

  /** @param {import('../../simulation/Simulation.js').CellState} cell */
  emit(cell) {
    if (cell.absorbedBy) return
    const speed = Math.hypot(cell.vx, cell.vy)
    if (speed < 7) return
    const index = this.cursor
    this.cursor = (this.cursor + 1) % this.buffer.capacity
    const radius = Math.sqrt(cell.mass) * RULE_SET.mass.radiusScale
    const directionX = cell.vx / speed
    const directionY = cell.vy / speed
    const lateral = Math.sin(cell.phase + performance.now() * 0.002) * radius * 0.16
    const x = cell.x - directionX * radius * 0.74 - directionY * lateral
    const y = cell.y - directionY * radius * 0.74 + directionX * lateral
    const lifetime = RULE_SET.rendering.trailLifetimeSeconds * (cell.kind === 'player' ? 1 : 0.72)
    this.life[index] = lifetime
    this.maximumLife[index] = lifetime
    this.maximumSize[index] = cell.kind === 'player' ? 11 : 7
    this.maximumAlpha[index] = 0.48
    this.driftX[index] = -directionX * speed * 0.045 - directionY * 3.5
    this.driftY[index] = -directionY * speed * 0.045 + directionX * 3.5
    this.color.setHSL(cell.kind === 'player' ? 0.32 : 0.18, 0.24, 0.27)
    this.buffer.set(index, x, y, 0, cell.kind === 'player' ? 11 : 7, 0.48, this.color)
  }

  /**
   * @param {import('../../simulation/Simulation.js').CellState} predator
   * @param {import('../../simulation/Simulation.js').CellState} prey
   * @param {number} phase
   */
  emitAbsorption(predator, prey, phase) {
    const dx = predator.x - prey.x
    const dy = predator.y - prey.y
    const rawDistance = Math.hypot(dx, dy)
    const distance = Math.max(0.001, rawDistance)
    const directionX = rawDistance > 0.001 ? dx / distance : Math.cos(predator.heading)
    const directionY = rawDistance > 0.001 ? dy / distance : Math.sin(predator.heading)
    const perpendicularX = -directionY
    const perpendicularY = directionX
    const preyRadius = Math.sqrt(prey.mass) * RULE_SET.mass.radiusScale
    const surfaceOffset = preyRadius * (0.32 + Math.sin(phase * 1.7) * 0.12)
    const lateralOffset = Math.sin(phase * 3.1 + prey.phase) * preyRadius * 0.34
    const x = prey.x + directionX * surfaceOffset + perpendicularX * lateralOffset
    const y = prey.y + directionY * surfaceOffset + perpendicularY * lateralOffset
    const index = this.cursor
    this.cursor = (this.cursor + 1) % this.buffer.capacity
    const lifetime = RULE_SET.rendering.absorptionParticleLifetimeSeconds
    const speed = Math.min(
      RULE_SET.rendering.absorptionParticleSpeed,
      Math.max(42, (distance / lifetime) * 1.08),
    )
    const curl = Math.sin(phase * 2.3) * 14
    const size = Math.min(12, Math.max(3.5, preyRadius * 0.16))
    this.life[index] = lifetime
    this.maximumLife[index] = lifetime
    this.maximumSize[index] = size
    this.maximumAlpha[index] = 0.76
    this.driftX[index] = directionX * speed + perpendicularX * curl
    this.driftY[index] = directionY * speed + perpendicularY * curl
    this.color.setHSL(0.18 + prey.hue * 0.18, 0.34, 0.32)
    this.buffer.set(index, x, y, 7, size, 0.76, this.color)
  }

  /** @param {number} dt */
  update(dt) {
    for (let index = 0; index < this.buffer.capacity; index += 1) {
      if (this.life[index] <= 0) {
        this.buffer.alphas[index] = 0
        this.buffer.sizes[index] = 0
        continue
      }
      this.life[index] = Math.max(0, this.life[index] - dt)
      const ratio = this.life[index] / this.maximumLife[index]
      const offset = index * 3
      this.buffer.positions[offset] += this.driftX[index] * dt
      this.buffer.positions[offset + 1] += this.driftY[index] * dt
      this.buffer.sizes[index] = 2 + ratio * Math.max(0, this.maximumSize[index] - 2)
      this.buffer.alphas[index] = ratio * ratio * this.maximumAlpha[index]
    }
    this.buffer.commit()
  }

  /** @param {import('../../simulation/Simulation.js').SimulationEvent} event */
  burst(event) {
    for (let burstIndex = 0; burstIndex < 14; burstIndex += 1) {
      const index = this.cursor
      this.cursor = (this.cursor + 1) % this.buffer.capacity
      const angle = (burstIndex / 14) * Math.PI * 2
      this.life[index] = 0.62
      this.maximumLife[index] = 0.62
      this.maximumSize[index] = 8
      this.maximumAlpha[index] = 0.82
      this.driftX[index] = Math.cos(angle) * 42
      this.driftY[index] = Math.sin(angle) * 42
      this.color.setHSL(event.hue < 0.6 ? 0.28 : 0.12, 0.42, 0.3)
      this.buffer.set(index, event.x, event.y, 7, 8, 0.82, this.color)
    }
  }

  /** @param {number} pixelRatio */
  setPixelRatio(pixelRatio) {
    this.buffer.setPixelRatio(pixelRatio)
  }

  dispose() {
    this.buffer.dispose()
  }
}
