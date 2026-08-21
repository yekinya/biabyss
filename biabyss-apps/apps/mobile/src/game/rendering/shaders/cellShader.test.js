import { describe, expect, it } from 'vitest'
import { cellFragmentShader, cellVertexShader } from './cellShader.js'

describe('procedural microscope cell shader', () => {
  it('uses the simulation gait contract for both movement axes', () => {
    expect(cellVertexShader).toContain('attribute float aFrontReach')
    expect(cellVertexShader).toContain('attribute float aDrive')
    expect(cellVertexShader).toContain('attribute float aRearCatch')
    expect(cellVertexShader).toContain('#ifdef USE_INSTANCING')
    expect(cellFragmentShader).toContain('varying float vFrontReach')
    expect(cellFragmentShader).toContain('frontAxisX')
    expect(cellFragmentShader).toContain('rearAxisX')
    expect(cellFragmentShader).not.toContain('uStride')
    expect(cellFragmentShader).not.toContain('uLocomotion')
  })

  it('draws organelles procedurally without a bitmap sampler', () => {
    expect(cellFragmentShader).not.toContain('sampler2D')
    expect(cellFragmentShader).toContain('vacuoleRing')
    expect(cellFragmentShader).toContain('granuleShape')
    expect(cellFragmentShader).toContain('outerHalo')
    expect(cellFragmentShader).toContain('uniform float uOpticalStage')
  })

  it('defines five species silhouettes and a suction progress input', () => {
    expect(cellFragmentShader).toContain('micrococcusDistance')
    expect(cellFragmentShader).toContain('ciliophoranDistance')
    expect(cellFragmentShader).toContain('larvoidDistance')
    expect(cellFragmentShader).toContain('tentacleAmoebaDistance')
    expect(cellFragmentShader).toContain('diplococcusDistance')
    expect(cellVertexShader).toContain('attribute float aAbsorption')
    expect(cellFragmentShader).toContain('varying float vAbsorption')
  })
})
