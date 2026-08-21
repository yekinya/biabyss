// @ts-check

import * as THREE from 'three'
import { interpolateGaitPhase, sampleGait } from '../../domain/rules/gait.js'
import { canAbsorb, radiusForMass } from '../../domain/rules/mass.js'
import { RULE_SET } from '../../domain/rules/ruleSet.js'
import { cellFragmentShader, cellVertexShader } from './shaders/cellShader.js'

export class CellRenderer {
  /** @param {THREE.Scene} scene @param {number} capacity */
  constructor(scene, capacity) {
    this.scene = scene
    this.capacity = capacity
    this.geometry = new THREE.PlaneGeometry(2, 2, 1, 1)
    this.phaseAttribute = this.createAttribute(1)
    this.morphAttribute = this.createAttribute(1)
    this.threatAttribute = this.createAttribute(1)
    this.gaitPhaseAttribute = this.createAttribute(1)
    this.frontReachAttribute = this.createAttribute(1)
    this.driveAttribute = this.createAttribute(1)
    this.rearCatchAttribute = this.createAttribute(1)
    this.absorptionAttribute = this.createAttribute(1)
    this.feedingAttribute = this.createAttribute(1)
    this.colorAttribute = this.createAttribute(3)
    this.geometry.setAttribute('aPhase', this.phaseAttribute)
    this.geometry.setAttribute('aMorph', this.morphAttribute)
    this.geometry.setAttribute('aThreat', this.threatAttribute)
    this.geometry.setAttribute('aGaitPhase', this.gaitPhaseAttribute)
    this.geometry.setAttribute('aFrontReach', this.frontReachAttribute)
    this.geometry.setAttribute('aDrive', this.driveAttribute)
    this.geometry.setAttribute('aRearCatch', this.rearCatchAttribute)
    this.geometry.setAttribute('aAbsorption', this.absorptionAttribute)
    this.geometry.setAttribute('aFeeding', this.feedingAttribute)
    this.geometry.setAttribute('aColor', this.colorAttribute)

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpticalStage: { value: 0 },
        uPlaneOverscan: { value: RULE_SET.rendering.cellPlaneOverscan },
      },
      vertexShader: cellVertexShader,
      fragmentShader: cellFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    })
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, capacity)
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 6
    this.scene.add(this.mesh)
    this.transform = new THREE.Object3D()
    this.color = new THREE.Color()
  }

  /** @param {number} itemSize */
  createAttribute(itemSize) {
    return new THREE.InstancedBufferAttribute(
      new Float32Array(this.capacity * itemSize),
      itemSize,
    ).setUsage(THREE.DynamicDrawUsage)
  }

  /** @param {import('../../simulation/Simulation.js').Simulation} simulation @param {number} time @param {number} alpha @param {number} opticalStage */
  update(simulation, time, alpha, opticalStage) {
    const count = Math.min(simulation.cells.length, this.capacity)
    for (let index = 0; index < count; index += 1) {
      const cell = simulation.cells[index]
      const x = THREE.MathUtils.lerp(cell.previousX, cell.x, alpha)
      const y = THREE.MathUtils.lerp(cell.previousY, cell.y, alpha)
      const gaitPhase = interpolateGaitPhase(cell.previousGaitPhase, cell.gaitPhase, alpha)
      const gait = sampleGait(gaitPhase)
      const absorption = THREE.MathUtils.lerp(
        cell.previousAbsorptionProgress,
        cell.absorptionProgress,
        alpha,
      )
      const feeding = THREE.MathUtils.lerp(
        cell.previousFeedingProgress,
        cell.feedingProgress,
        alpha,
      )
      const radius = radiusForMass(cell.mass)
      const gaitStretch = 1 + gait.frontReach * 0.24 - gait.rearCatch * 0.035
      const gaitCompression = 1 - gait.drive * 0.045
      const suctionStretch = 1 + Math.sin(absorption * Math.PI) * 1.4
      const suctionLength = Math.max(0.3, 1 - absorption * 0.7)
      const suctionWidth = Math.max(0.12, 1 - absorption * 0.88)
      const feedingStretch = 1 + feeding * 0.32
      const feedingCompression = 1 - feeding * 0.08
      const planeRadius =
        (radius * RULE_SET.rendering.cellPlaneOverscan) / 0.72

      const threat = cell.kind === 'npc' && canAbsorb(cell.mass, simulation.player.mass)
      const prey = cell.kind === 'npc' && canAbsorb(simulation.player.mass, cell.mass)
      if (cell.kind === 'player') this.color.setRGB(0.2, 0.27, 0.23)
      else if (threat) this.color.setRGB(0.32, 0.2, 0.18)
      else if (prey) this.color.setRGB(0.18, 0.29, 0.17)
      else this.color.setRGB(0.27, 0.26, 0.2)

      this.transform.position.set(x, y, 3 + (cell.kind === 'player' ? 0.3 : threat ? 0.15 : 0))
      this.transform.rotation.set(0, 0, cell.heading)
      this.transform.scale.set(
        planeRadius * gaitStretch * suctionStretch * suctionLength * feedingStretch,
        (planeRadius / Math.sqrt(gaitStretch)) *
          gaitCompression *
          suctionWidth *
          feedingCompression,
        1,
      )
      this.transform.updateMatrix()
      this.mesh.setMatrixAt(index, this.transform.matrix)
      this.phaseAttribute.setX(index, cell.phase)
      this.morphAttribute.setX(index, cell.morph)
      this.threatAttribute.setX(index, threat ? 1 : 0)
      this.gaitPhaseAttribute.setX(index, gaitPhase)
      this.frontReachAttribute.setX(index, gait.frontReach)
      this.driveAttribute.setX(index, gait.drive)
      this.rearCatchAttribute.setX(index, gait.rearCatch)
      this.absorptionAttribute.setX(index, absorption)
      this.feedingAttribute.setX(index, feeding)
      this.colorAttribute.setXYZ(index, this.color.r, this.color.g, this.color.b)
    }

    this.mesh.count = count
    this.mesh.instanceMatrix.needsUpdate = true
    for (const attribute of [
      this.phaseAttribute,
      this.morphAttribute,
      this.threatAttribute,
      this.gaitPhaseAttribute,
      this.frontReachAttribute,
      this.driveAttribute,
      this.rearCatchAttribute,
      this.absorptionAttribute,
      this.feedingAttribute,
      this.colorAttribute,
    ]) {
      attribute.needsUpdate = true
    }
    this.material.uniforms.uTime.value = time
    this.material.uniforms.uOpticalStage.value = opticalStage
  }

  dispose() {
    this.scene.remove(this.mesh)
    this.geometry.dispose()
    this.material.dispose()
  }
}
