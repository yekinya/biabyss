// @ts-check

import * as THREE from 'three'
import { RULE_SET } from '../../domain/rules/ruleSet.js'
import { particleFragmentShader, particleVertexShader } from './shaders/particleShader.js'

class PointBuffer {
  /** @param {number} capacity @param {number} pixelRatio */
  constructor(capacity, pixelRatio) {
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
      blending: THREE.AdditiveBlending,
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
      color.setHSL(random.between(0.46, 0.58), 0.65, random.between(0.42, 0.72))
      this.buffer.set(
        index,
        random.between(0, width),
        random.between(0, height),
        -2,
        random.between(1, 4.2),
        random.between(0.08, 0.32),
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
    this.buffer = new PointBuffer(RULE_SET.nutrient.targetCount, pixelRatio)
    this.color = new THREE.Color()
    scene.add(this.buffer.points)
  }

  /** @param {import('../../simulation/Simulation.js').Simulation} simulation @param {number} time */
  update(simulation, time) {
    for (let index = 0; index < simulation.nutrients.length; index += 1) {
      const nutrient = simulation.nutrients[index]
      const pulse = 0.82 + Math.sin(time * 2.1 + nutrient.phase) * 0.22
      this.color.setHSL(nutrient.hue, 0.82, 0.64)
      this.buffer.set(index, nutrient.x, nutrient.y, 1, 4.4 * pulse, 0.72, this.color)
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
      this.color.setHSL(cell.kind === 'player' ? 0.49 : cell.hue, 0.78, 0.72)
      for (let localIndex = 0; localIndex < this.perCell; localIndex += 1) {
        const angle = time * (0.22 + localIndex * 0.035) + cell.phase + localIndex * 2.17
        const orbit = radius * (0.2 + (localIndex % 3) * 0.11)
        this.buffer.set(
          particleIndex,
          x + Math.cos(angle) * orbit,
          y + Math.sin(angle * 1.13) * orbit,
          5,
          cell.kind === 'player' ? 4.2 : 2.7,
          cell.kind === 'player' ? 0.66 : 0.42,
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
    this.driftX = new Float32Array(this.buffer.capacity)
    this.driftY = new Float32Array(this.buffer.capacity)
    this.cursor = 0
    this.color = new THREE.Color()
    scene.add(this.buffer.points)
  }

  /** @param {import('../../simulation/Simulation.js').CellState} cell */
  emit(cell) {
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
    this.driftX[index] = -directionX * speed * 0.045 - directionY * 3.5
    this.driftY[index] = -directionY * speed * 0.045 + directionX * 3.5
    this.color.setHSL(cell.kind === 'player' ? 0.49 : cell.hue, 0.8, 0.62)
    this.buffer.set(index, x, y, 0, cell.kind === 'player' ? 11 : 7, 0.48, this.color)
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
      this.buffer.sizes[index] = 2 + ratio * 10
      this.buffer.alphas[index] = ratio * ratio * 0.46
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
      this.driftX[index] = Math.cos(angle) * 42
      this.driftY[index] = Math.sin(angle) * 42
      this.color.setHSL(event.hue, 0.88, 0.7)
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
