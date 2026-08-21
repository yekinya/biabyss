// @ts-check

import * as THREE from 'three'
import { RULE_SET } from '../../domain/rules/ruleSet.js'

/**
 * @typedef {object} JoystickViewState
 * @property {boolean} active
 * @property {number} centerX
 * @property {number} centerY
 * @property {number} knobX
 * @property {number} knobY
 * @property {number} strength
 */

export class JoystickRenderer {
  /** @param {THREE.Scene} scene @param {boolean} reducedMotion */
  constructor(scene, reducedMotion) {
    this.scene = scene
    this.reducedMotion = reducedMotion
    this.radius = RULE_SET.player.joystickRadiusCssPx
    this.group = new THREE.Group()
    this.group.visible = false
    this.group.renderOrder = 100

    this.backplateMaterial = new THREE.MeshBasicMaterial({
      color: 0x273b38,
      transparent: true,
      opacity: 0.18,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x304b46,
      transparent: true,
      opacity: 0.58,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    this.strengthMaterial = new THREE.MeshBasicMaterial({
      color: 0x536c43,
      transparent: true,
      opacity: 0.42,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    })
    this.knobMaterial = new THREE.MeshBasicMaterial({
      color: 0x344e47,
      transparent: true,
      opacity: 0.78,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x304b46,
      transparent: true,
      opacity: 0.38,
      depthTest: false,
      depthWrite: false,
    })

    this.backplateGeometry = new THREE.CircleGeometry(this.radius, 64)
    this.ringGeometry = new THREE.RingGeometry(this.radius - 1.5, this.radius, 64)
    this.strengthGeometry = new THREE.RingGeometry(this.radius * 0.7, this.radius * 0.77, 64)
    this.knobGeometry = new THREE.CircleGeometry(this.radius * 0.19, 40)
    this.knobRingGeometry = new THREE.RingGeometry(this.radius * 0.22, this.radius * 0.235, 40)
    this.spokePositions = new Float32Array(6)
    this.spokeGeometry = new THREE.BufferGeometry()
    this.spokeGeometry.setAttribute('position', new THREE.BufferAttribute(this.spokePositions, 3))

    this.backplate = new THREE.Mesh(this.backplateGeometry, this.backplateMaterial)
    this.ring = new THREE.Mesh(this.ringGeometry, this.ringMaterial)
    this.strengthRing = new THREE.Mesh(this.strengthGeometry, this.strengthMaterial)
    this.spoke = new THREE.Line(this.spokeGeometry, this.lineMaterial)
    this.knob = new THREE.Mesh(this.knobGeometry, this.knobMaterial)
    this.knobRing = new THREE.Mesh(this.knobRingGeometry, this.ringMaterial)
    this.group.add(
      this.backplate,
      this.ring,
      this.strengthRing,
      this.spoke,
      this.knob,
      this.knobRing,
    )
    scene.add(this.group)
  }

  /** @param {JoystickViewState} state @param {number} viewportHeight @param {number} time */
  update(state, viewportHeight, time) {
    this.group.visible = state.active
    if (!state.active) return

    const y = viewportHeight - state.centerY
    const knobY = -state.knobY
    this.group.position.set(state.centerX, y, 0)
    this.knob.position.set(state.knobX, knobY, 0.2)
    this.knobRing.position.copy(this.knob.position)
    const strengthScale = Math.max(0.04, state.strength)
    this.strengthRing.scale.setScalar(strengthScale)
    this.strengthMaterial.opacity = 0.14 + state.strength * 0.38
    this.knobMaterial.opacity = 0.5 + state.strength * 0.34

    this.spokePositions[3] = state.knobX
    this.spokePositions[4] = knobY
    this.spokeGeometry.getAttribute('position').needsUpdate = true

    const pulse = this.reducedMotion ? 1 : 1 + Math.sin(time * 4.2) * 0.018 * state.strength
    this.ring.scale.setScalar(pulse)
  }

  dispose() {
    this.scene.remove(this.group)
    this.backplateGeometry.dispose()
    this.ringGeometry.dispose()
    this.strengthGeometry.dispose()
    this.knobGeometry.dispose()
    this.knobRingGeometry.dispose()
    this.spokeGeometry.dispose()
    this.backplateMaterial.dispose()
    this.ringMaterial.dispose()
    this.strengthMaterial.dispose()
    this.knobMaterial.dispose()
    this.lineMaterial.dispose()
  }
}
