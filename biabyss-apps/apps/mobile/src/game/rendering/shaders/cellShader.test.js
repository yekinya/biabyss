import { describe, expect, it } from 'vitest'
import {
  cellFallbackFragmentShader,
  cellFallbackVertexShader,
  cellFragmentShader,
  cellVertexShader,
} from './cellShader.js'

describe('procedural microscope cell shader', () => {
  it('uses the simulation gait contract for both movement axes', () => {
    expect(cellVertexShader).toContain('attribute vec4 aCellData0')
    expect(cellVertexShader).toContain('attribute vec4 aCellData1')
    expect(cellVertexShader).toContain('attribute vec4 aCellData2')
    expect(cellVertexShader).toContain('vFrontReach = aCellData1.x')
    expect(cellVertexShader).toContain('vDrive = aCellData1.y')
    expect(cellVertexShader).toContain('vRearCatch = aCellData1.z')
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
    expect(cellFragmentShader).toContain('phaseHalo')
    expect(cellFragmentShader).toContain('outerMembrane')
    expect(cellFragmentShader).toContain('innerMembrane')
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
    expect(cellVertexShader).toContain('vAbsorption = aCellData1.w')
    expect(cellVertexShader).toContain('vFeeding = aCellData2.x')
    expect(cellVertexShader).toContain('vColor = aCellData2.yzw')
    expect(cellFragmentShader).toContain('varying float vAbsorption')
    expect(cellFragmentShader).toContain('varying float vFeeding')
    expect(cellFragmentShader).toContain('uniform float uPlaneOverscan')
    expect(cellFragmentShader).toContain('* uPlaneOverscan')
  })

  it('derives plane coordinates without a UV attribute and provides a shader fallback', () => {
    expect(cellVertexShader).toContain('vUv = position.xy * 0.5 + 0.5')
    expect(cellVertexShader).not.toContain('vUv = uv')
    expect(cellFallbackVertexShader).not.toContain('aCellData')
    expect(cellFallbackFragmentShader).toContain('outerMembrane')
    expect(cellFallbackFragmentShader).toContain('innerMembrane')
    expect(cellFallbackFragmentShader).not.toContain('sampler2D')
  })
})
