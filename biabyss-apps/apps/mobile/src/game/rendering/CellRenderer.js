// @ts-check

import * as THREE from 'three'
import { canAbsorb, radiusForMass } from '../../domain/rules/mass.js'
import { RULE_SET } from '../../domain/rules/ruleSet.js'
import { cellFragmentShader, cellVertexShader } from './shaders/cellShader.js'

export class CellRenderer {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this.scene = scene
    this.geometry = new THREE.PlaneGeometry(2, 2, 1, 1)
    /** @type {Map<string, THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>} */
    this.meshes = new Map()
    this.color = new THREE.Color()
  }

  /** @param {import('../../simulation/Simulation.js').Simulation} simulation @param {number} time @param {number} alpha */
  update(simulation, time, alpha) {
    for (const cell of simulation.cells) {
      let mesh = this.meshes.get(cell.id)
      if (!mesh) {
        mesh = this.createMesh(cell)
        this.meshes.set(cell.id, mesh)
        this.scene.add(mesh)
      }

      const x = THREE.MathUtils.lerp(cell.previousX, cell.x, alpha)
      const y = THREE.MathUtils.lerp(cell.previousY, cell.y, alpha)
      const radius = radiusForMass(cell.mass)
      const speed = Math.hypot(cell.vx, cell.vy)
      const speedReference = cell.kind === 'player' ? RULE_SET.player.maxSpeed : RULE_SET.npc.maxSpeed
      const locomotion = Math.min(1, speed / speedReference)
      const gaitFrequency = cell.kind === 'player' ? RULE_SET.player.wriggleFrequency : 1.35
      const gaitAngle = simulation.elapsed * gaitFrequency * Math.PI * 2 + cell.phase
      const stride = 0.5 + Math.sin(gaitAngle) * 0.5
      const rearFollow = 0.5 + Math.sin(gaitAngle - 1.18) * 0.5
      const stretch = 1 + locomotion * (0.06 + stride * 0.16)
      const pulse = 1 + Math.sin(time * 1.7 + cell.phase) * 0.022
      const planeRadius = radius / 0.72
      mesh.position.set(x, y, 3)
      mesh.scale.set(planeRadius * stretch * pulse, planeRadius / Math.sqrt(stretch) / pulse, 1)
      if (speed > 1) mesh.rotation.z = Math.atan2(cell.vy, cell.vx)

      const threat = cell.kind === 'npc' && canAbsorb(cell.mass, simulation.player.mass)
      const prey = cell.kind === 'npc' && canAbsorb(simulation.player.mass, cell.mass)
      const hue = cell.kind === 'player' ? 0.49 : threat ? 0.92 : prey ? 0.4 : cell.hue
      const saturation = threat ? 0.9 : 0.78
      const lightness = cell.kind === 'player' ? 0.68 : threat ? 0.58 : 0.62
      this.color.setHSL(hue, saturation, lightness)
      mesh.material.uniforms.uTime.value = time
      mesh.material.uniforms.uPhase.value = cell.phase
      mesh.material.uniforms.uMorph.value = cell.morph
      mesh.material.uniforms.uThreat.value = threat ? 1 : 0
      mesh.material.uniforms.uLocomotion.value = locomotion
      mesh.material.uniforms.uStride.value = stride
      mesh.material.uniforms.uRearFollow.value = rearFollow
      mesh.material.uniforms.uColor.value.copy(this.color)
      mesh.renderOrder = threat ? 8 : cell.kind === 'player' ? 10 : 5
    }
  }

  /** @param {import('../../simulation/Simulation.js').CellState} cell */
  createMesh(cell) {
    this.color.setHSL(cell.kind === 'player' ? 0.49 : cell.hue, 0.8, 0.64)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: cell.phase },
        uMorph: { value: cell.morph },
        uThreat: { value: 0 },
        uLocomotion: { value: 0 },
        uStride: { value: 0.5 },
        uRearFollow: { value: 0.5 },
        uColor: { value: this.color.clone() },
      },
      vertexShader: cellVertexShader,
      fragmentShader: cellFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    })
    return new THREE.Mesh(this.geometry, material)
  }

  dispose() {
    this.geometry.dispose()
    for (const mesh of this.meshes.values()) mesh.material.dispose()
    this.meshes.clear()
  }
}
