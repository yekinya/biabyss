import { describe, expect, it } from 'vitest'
import { cellFragmentShader } from './cellShader.js'

describe('procedural microscope cell shader', () => {
  it('uses the simulation gait contract for both movement axes', () => {
    expect(cellFragmentShader).toContain('uniform float uFrontReach')
    expect(cellFragmentShader).toContain('uniform float uDrive')
    expect(cellFragmentShader).toContain('uniform float uRearCatch')
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
})
