// @ts-check

import * as THREE from 'three'
import { canAbsorb, radiusForMass } from '../../domain/rules/mass.js'
import { interpolateGaitPhase, sampleGait } from '../../domain/rules/gait.js'
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

  /** @param {import('../../simulation/Simulation.js').Simulation} simulation @param {number} time @param {number} alpha @param {number} opticalStage */
  update(simulation, time, alpha, opticalStage) {
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
      const gait = sampleGait(interpolateGaitPhase(cell.previousGaitPhase, cell.gaitPhase, alpha))
      const stretch = 1 + gait.frontReach * 0.24 - gait.rearCatch * 0.035
      const compression = 1 - gait.drive * 0.045
      const planeRadius = radius / 0.72
      mesh.position.set(x, y, 3)
      mesh.scale.set(planeRadius * stretch, (planeRadius / Math.sqrt(stretch)) * compression, 1)
      mesh.rotation.z = cell.heading

      const threat = cell.kind === 'npc' && canAbsorb(cell.mass, simulation.player.mass)
      const prey = cell.kind === 'npc' && canAbsorb(simulation.player.mass, cell.mass)
      if (cell.kind === 'player') this.color.setRGB(0.2, 0.27, 0.23)
      else if (threat) this.color.setRGB(0.32, 0.2, 0.18)
      else if (prey) this.color.setRGB(0.18, 0.29, 0.17)
      else this.color.setRGB(0.27, 0.26, 0.2)
      mesh.material.uniforms.uTime.value = time
      mesh.material.uniforms.uPhase.value = cell.phase
      mesh.material.uniforms.uMorph.value = cell.morph
      mesh.material.uniforms.uThreat.value = threat ? 1 : 0
      mesh.material.uniforms.uFrontReach.value = gait.frontReach
      mesh.material.uniforms.uDrive.value = gait.drive
      mesh.material.uniforms.uRearCatch.value = gait.rearCatch
      mesh.material.uniforms.uOpticalStage.value = opticalStage
      mesh.material.uniforms.uColor.value.copy(this.color)
      mesh.renderOrder = threat ? 8 : cell.kind === 'player' ? 10 : 5
    }
  }

  /** @param {import('../../simulation/Simulation.js').CellState} cell */
  createMesh(cell) {
    this.color.setRGB(0.22, 0.27, 0.22)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: cell.phase },
        uMorph: { value: cell.morph },
        uThreat: { value: 0 },
        uFrontReach: { value: 0 },
        uDrive: { value: 0 },
        uRearCatch: { value: 0 },
        uOpticalStage: { value: 0 },
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
