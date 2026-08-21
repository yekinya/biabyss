import { describe, expect, it } from 'vitest'
import { RULE_SET } from '../../domain/rules/ruleSet.js'
import {
  cameraWorldScaleForMass,
  clampCameraCoordinate,
  visibleWorldExtent,
  worldCoordinateFromNormalized,
} from './cameraScale.js'

describe('mass-aware camera world scale', () => {
  it('starts at one and grows monotonically to the configured maximum', () => {
    const masses = [36, 144, 288, 576, 1152, 2304, 4096]
    const scales = masses.map(cameraWorldScaleForMass)
    expect(scales[0]).toBe(1)
    expect(scales[1]).toBe(1)
    expect(scales.at(-1)).toBe(RULE_SET.rendering.cameraMaximumWorldScale)
    for (let index = 1; index < scales.length; index += 1) {
      expect(scales[index]).toBeGreaterThanOrEqual(scales[index - 1])
    }
  })

  it('uses the same scale for visible world extents', () => {
    const scale = cameraWorldScaleForMass(576)
    expect(visibleWorldExtent(1000, scale)).toBeCloseTo(1000 * scale, 8)
    expect(visibleWorldExtent(600, scale)).toBeCloseTo(600 * scale, 8)
  })

  it('uses the visible extent for field clamping and screen conversion', () => {
    const visible = 1800
    expect(clampCameraCoordinate(200, 6000, visible)).toBe(900)
    expect(clampCameraCoordinate(5800, 6000, visible)).toBe(5100)
    expect(worldCoordinateFromNormalized(3000, 0.5, visible)).toBe(3900)
    expect(worldCoordinateFromNormalized(3000, -0.5, visible)).toBe(2100)
  })
})
