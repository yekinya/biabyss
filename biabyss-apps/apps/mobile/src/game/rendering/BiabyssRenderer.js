// @ts-check

import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { RULE_SET } from '../../domain/rules/ruleSet.js'
import { CellRenderer } from './CellRenderer.js'
import { JoystickRenderer } from './JoystickRenderer.js'
import {
  AmbientParticles,
  FluidTrails,
  InternalParticles,
  NutrientParticles,
} from './ParticleSystems.js'
import { fieldFragmentShader, fieldVertexShader } from './shaders/fieldShader.js'

export class BiabyssRenderer {
  /** @param {HTMLElement} host @param {import('../../simulation/Simulation.js').Simulation} simulation */
  constructor(host, simulation) {
    this.host = host
    this.simulation = simulation
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x01070b)
    this.overlayScene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200)
    this.overlayCamera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 20)
    this.overlayCamera.position.z = 10
    this.camera.position.set(simulation.player.x, simulation.player.y, 100)
    this.camera.lookAt(simulation.player.x, simulation.player.y, 0)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.08
    this.renderer.autoClear = false
    this.renderer.domElement.dataset.engine = 'three-webgl'
    this.host.replaceChildren(this.renderer.domElement)

    this.viewportWidth = 1
    this.viewportHeight = 1
    this.pixelRatio = 1
    this.frame = 0
    this.drawCalls = 0
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    /** @type {import('./JoystickRenderer.js').JoystickViewState} */
    this.joystickState = {
      active: false,
      centerX: 0,
      centerY: 0,
      knobX: 0,
      knobY: 0,
      strength: 0,
    }
    this.fieldMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMotionScale: { value: this.reducedMotion ? 0.18 : 1 },
        uSeed: { value: simulation.seed % 997 },
        uWorldSize: { value: new THREE.Vector2(simulation.worldWidth, simulation.worldHeight) },
      },
      vertexShader: fieldVertexShader,
      fragmentShader: fieldFragmentShader,
      depthWrite: false,
    })
    this.fieldGeometry = new THREE.PlaneGeometry(simulation.worldWidth, simulation.worldHeight)
    this.field = new THREE.Mesh(this.fieldGeometry, this.fieldMaterial)
    this.field.position.set(simulation.worldWidth / 2, simulation.worldHeight / 2, -8)
    this.scene.add(this.field)
    this.fieldBoundary = this.createFieldBoundary()
    this.scene.add(this.fieldBoundary)

    this.cellRenderer = new CellRenderer(this.scene, this.reducedMotion)
    this.ambientParticles = new AmbientParticles(
      this.scene,
      simulation.worldWidth,
      simulation.worldHeight,
      simulation.random,
      1,
    )
    this.nutrientParticles = new NutrientParticles(this.scene, 1)
    this.internalParticles = new InternalParticles(this.scene, simulation.cells.length, 1)
    this.trails = new FluidTrails(this.scene, 1)
    this.joystick = new JoystickRenderer(this.overlayScene, this.reducedMotion)

    this.renderPass = new RenderPass(this.scene, this.camera)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      this.reducedMotion ? 0.28 : 0.58,
      0.48,
      0.62,
    )
    this.outputPass = new OutputPass()
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(this.outputPass)

    this.handleContextLost = this.handleContextLost.bind(this)
    this.handleContextRestored = this.handleContextRestored.bind(this)
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost)
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored)
    this.contextLost = false
  }

  createFieldBoundary() {
    const width = this.simulation.worldWidth
    const height = this.simulation.worldHeight
    const positions = new Float32Array([
      0, 0, 2, width, 0, 2,
      width, 0, 2, width, height, 2,
      width, height, 2, 0, height, 2,
      0, height, 2, 0, 0, 2,
    ])
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.LineBasicMaterial({
      color: 0x62d7d4,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    })
    return new THREE.LineSegments(geometry, material)
  }

  /** @param {number} width @param {number} height */
  resize(width, height) {
    this.viewportWidth = Math.max(1, width)
    this.viewportHeight = Math.max(1, height)
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, RULE_SET.rendering.dprMaximum)
    this.renderer.setPixelRatio(this.pixelRatio)
    this.renderer.setSize(this.viewportWidth, this.viewportHeight, false)
    this.camera.left = -this.viewportWidth / 2
    this.camera.right = this.viewportWidth / 2
    this.camera.top = this.viewportHeight / 2
    this.camera.bottom = -this.viewportHeight / 2
    this.camera.updateProjectionMatrix()
    this.overlayCamera.left = 0
    this.overlayCamera.right = this.viewportWidth
    this.overlayCamera.top = this.viewportHeight
    this.overlayCamera.bottom = 0
    this.overlayCamera.updateProjectionMatrix()
    this.composer.setPixelRatio(this.pixelRatio)
    this.composer.setSize(this.viewportWidth, this.viewportHeight)
    this.bloomPass.setSize(this.viewportWidth, this.viewportHeight)
    this.ambientParticles.setPixelRatio(this.pixelRatio)
    this.nutrientParticles.setPixelRatio(this.pixelRatio)
    this.internalParticles.setPixelRatio(this.pixelRatio)
    this.trails.setPixelRatio(this.pixelRatio)
  }

  /** @param {number} time @param {number} alpha @param {number} dt */
  render(time, alpha, dt) {
    if (this.contextLost) return
    this.frame += 1
    this.fieldMaterial.uniforms.uTime.value = time
    this.fieldMaterial.uniforms.uSeed.value = this.simulation.seed % 997
    this.cellRenderer.update(this.simulation, time, alpha)
    this.nutrientParticles.update(this.simulation, time)
    this.internalParticles.update(this.simulation, time, alpha)

    if (!this.reducedMotion) {
      if (this.frame % 2 === 0) this.trails.emit(this.simulation.player)
      if (this.frame % 7 === 0) {
        for (let index = 1; index < this.simulation.cells.length; index += 3) {
          this.trails.emit(this.simulation.cells[index])
        }
      }
    }
    for (const event of this.simulation.events) this.trails.burst(event)
    this.trails.update(dt)
    this.followPlayer(dt)
    this.composer.render(dt)
    this.drawCalls = this.renderer.info.render.calls
    this.joystick.update(this.joystickState, this.viewportHeight, time)
    this.renderer.clearDepth()
    this.renderer.render(this.overlayScene, this.overlayCamera)
  }

  /** @param {import('./JoystickRenderer.js').JoystickViewState} state */
  setJoystick(state) {
    this.joystickState = { ...state }
  }

  hideJoystick() {
    this.joystickState.active = false
  }

  /** @param {number} dt */
  followPlayer(dt) {
    const halfWidth = this.viewportWidth / 2
    const halfHeight = this.viewportHeight / 2
    const targetX = THREE.MathUtils.clamp(
      this.simulation.player.x,
      halfWidth,
      this.simulation.worldWidth - halfWidth,
    )
    const targetY = THREE.MathUtils.clamp(
      this.simulation.player.y,
      halfHeight,
      this.simulation.worldHeight - halfHeight,
    )
    const smoothing = 1 - Math.exp(-dt * 5.2)
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetX, smoothing)
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, smoothing)
  }

  /** @param {number} clientX @param {number} clientY */
  screenToWorld(clientX, clientY) {
    const bounds = this.renderer.domElement.getBoundingClientRect()
    const normalizedX = (clientX - bounds.left) / bounds.width - 0.5
    const normalizedY = 0.5 - (clientY - bounds.top) / bounds.height
    return {
      x: this.camera.position.x + normalizedX * this.viewportWidth,
      y: this.camera.position.y + normalizedY * this.viewportHeight,
    }
  }

  diagnostics() {
    return {
      engine: 'three-webgl',
      canvasCount: this.host.querySelectorAll('canvas').length,
      postProcessing: ['RenderPass', 'UnrealBloomPass', 'OutputPass'],
      environment: 'procedural-cosmic-fluid',
      environmentTextures: 0,
      worldWidth: this.simulation.worldWidth,
      worldHeight: this.simulation.worldHeight,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      fieldAreaRatio:
        (this.simulation.worldWidth * this.simulation.worldHeight) /
        (this.simulation.viewportWidth * this.simulation.viewportHeight),
      cells: this.simulation.cells.length,
      nutrients: this.simulation.nutrients.length,
      trailCapacity: RULE_SET.rendering.trailCapacity,
      drawCalls: this.drawCalls,
      joystickActive: this.joystickState.active,
      joystickStrength: this.joystickState.strength,
    }
  }

  /** @param {Event} event */
  handleContextLost(event) {
    event.preventDefault()
    this.contextLost = true
    this.simulation.phase = 'paused'
  }

  handleContextRestored() {
    this.contextLost = false
  }

  dispose() {
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost)
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored)
    this.cellRenderer.dispose()
    this.ambientParticles.dispose()
    this.nutrientParticles.dispose()
    this.internalParticles.dispose()
    this.trails.dispose()
    this.joystick.dispose()
    this.fieldGeometry.dispose()
    this.fieldMaterial.dispose()
    this.fieldBoundary.geometry.dispose()
    this.fieldBoundary.material.dispose()
    this.composer.dispose()
    this.renderer.dispose()
  }
}
