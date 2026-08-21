import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  CELL_FALLBACK_ACTIVE_ATTRIBUTE_SLOTS,
  CELL_PRIMARY_ACTIVE_ATTRIBUTE_SLOTS,
  CellRenderer,
} from './CellRenderer.js'
import { RULE_SET } from '../../domain/rules/ruleSet.js'
import { Simulation } from '../../simulation/Simulation.js'

describe('CellRenderer swarm batching', () => {
  it('keeps the full population in one instanced mesh and shared material', () => {
    const scene = new THREE.Scene()
    const renderer = new CellRenderer(scene, RULE_SET.npc.count + 1)
    expect(renderer.mesh.isInstancedMesh).toBe(true)
    expect(renderer.mesh.count).toBe(1621)
    expect(scene.children.filter((child) => child instanceof THREE.InstancedMesh)).toHaveLength(1)
    expect(renderer.geometry.getAttribute('aCellData0').count).toBe(1621)
    expect(renderer.geometry.getAttribute('aCellData1').count).toBe(1621)
    expect(renderer.geometry.getAttribute('aCellData2').count).toBe(1621)
    expect(renderer.geometry.getAttribute('aMorph')).toBeUndefined()
    expect(renderer.geometry.getAttribute('aAbsorption')).toBeUndefined()
    expect(renderer.geometry.getAttribute('aFeeding')).toBeUndefined()
    expect(renderer.primaryMaterial.uniforms.uPlaneOverscan.value).toBe(1.35)
    renderer.dispose()
    expect(scene.children).toHaveLength(0)
  })

  it('packs every cell state into three finite vec4 attributes', () => {
    const simulation = new Simulation(1000, 600, 707)
    const renderer = new CellRenderer(new THREE.Scene(), simulation.cells.length)
    renderer.update(simulation, 1.25, 0.5, 0)

    const customAttributes = Object.entries(renderer.geometry.attributes).filter(([name]) =>
      name.startsWith('aCellData'),
    )
    expect(customAttributes).toHaveLength(3)
    for (const [, attribute] of customAttributes) {
      expect(attribute.itemSize).toBe(4)
      expect(Array.from(attribute.array).every(Number.isFinite)).toBe(true)
    }
    expect(Array.from(renderer.mesh.instanceMatrix.array).every(Number.isFinite)).toBe(true)
    renderer.dispose()
  })

  it('stays within WebGL minimum slots and switches to the simple material when needed', () => {
    const renderer = new CellRenderer(new THREE.Scene(), 1)
    expect(CELL_PRIMARY_ACTIVE_ATTRIBUTE_SLOTS).toBeLessThanOrEqual(8)
    expect(CELL_FALLBACK_ACTIVE_ATTRIBUTE_SLOTS).toBeLessThan(
      CELL_PRIMARY_ACTIVE_ATTRIBUTE_SLOTS,
    )
    renderer.ensureAttributeBudget(CELL_PRIMARY_ACTIVE_ATTRIBUTE_SLOTS - 1)
    expect(renderer.fallbackActive).toBe(true)
    expect(renderer.fallbackReason).toBe('attribute-budget')
    expect(renderer.mesh.material).toBe(renderer.fallbackMaterial)
    renderer.dispose()
  })
})
