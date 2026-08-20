import { describe, expect, it } from 'vitest'
import { radiusForMass } from './mass'

describe('radiusForMass', () => {
  it('keeps two-dimensional area proportional to mass', () => {
    expect(radiusForMass(36)).toBe(24)
    expect(radiusForMass(144)).toBe(48)
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid mass %s',
    (mass) => {
      expect(() => radiusForMass(mass)).toThrow(RangeError)
    },
  )

  it('supports a ruleset-provided radius scale', () => {
    expect(radiusForMass(25, 3)).toBe(15)
  })
})
