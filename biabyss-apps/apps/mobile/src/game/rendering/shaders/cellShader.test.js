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

  it('defines eight species silhouettes and continuous feeding inputs', () => {
    expect(cellFragmentShader).toContain('micrococcusDistance')
    expect(cellFragmentShader).toContain('ciliophoranDistance')
    expect(cellFragmentShader).toContain('larvoidDistance')
    expect(cellFragmentShader).toContain('tentacleAmoebaDistance')
    expect(cellFragmentShader).toContain('diplococcusDistance')
    expect(cellFragmentShader).toContain('streptococcusDistance')
    expect(cellFragmentShader).toContain('spirillumDistance')
    expect(cellFragmentShader).toContain('radiolarianDistance')
    expect(cellVertexShader).toContain('attribute float aAbsorption')
    expect(cellVertexShader).toContain('attribute float aFeeding')
    expect(cellFragmentShader).toContain('varying float vAbsorption')
    expect(cellFragmentShader).toContain('varying float vFeeding')
    expect(cellFragmentShader).toContain('uniform float uPlaneOverscan')
    expect(cellFragmentShader).toContain('* uPlaneOverscan')
  })
})
