import { describe, expect, it } from 'vitest'
import { canAbsorb, radiusForMass } from './mass.js'

describe('mass rules', () => {
  it('keeps area proportional to mass', () => {
    expect(radiusForMass(36)).toBe(24)
    expect(radiusForMass(144)).toBe(48)
  })

  it('rejects invalid mass', () => {
    expect(() => radiusForMass(0)).toThrow(RangeError)
    expect(() => radiusForMass(Number.NaN)).toThrow(RangeError)
  })

  it('uses the exact absorption ratio boundary', () => {
    expect(canAbsorb(56, 50)).toBe(true)
    expect(canAbsorb(55.99, 50)).toBe(false)
  })
})
