import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { CellRenderer } from './CellRenderer.js'
import { RULE_SET } from '../../domain/rules/ruleSet.js'

describe('CellRenderer swarm batching', () => {
  it('keeps the full population in one instanced mesh and shared material', () => {
    const scene = new THREE.Scene()
    const renderer = new CellRenderer(scene, RULE_SET.npc.count + 1)
    expect(renderer.mesh.isInstancedMesh).toBe(true)
    expect(renderer.mesh.count).toBe(1621)
    expect(scene.children.filter((child) => child instanceof THREE.InstancedMesh)).toHaveLength(1)
    expect(renderer.geometry.getAttribute('aMorph').count).toBe(1621)
    expect(renderer.geometry.getAttribute('aAbsorption').count).toBe(1621)
    expect(renderer.geometry.getAttribute('aFeeding').count).toBe(1621)
    expect(renderer.material.uniforms.uPlaneOverscan.value).toBe(1.35)
    renderer.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
