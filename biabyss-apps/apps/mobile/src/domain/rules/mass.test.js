import { describe, expect, it } from 'vitest'
import {
  canAbsorb,
  contactDistanceForMasses,
  movementFactorForMass,
  predatorPreyForContact,
  radiusForMass,
} from './mass.js'
import { RULE_SET } from './ruleSet.js'

describe('mass rules', () => {
  it('keeps area proportional to mass', () => {
    expect(radiusForMass(36)).toBe(24)
    expect(radiusForMass(144)).toBe(48)
  })

  it('rejects invalid mass', () => {
    expect(() => radiusForMass(0)).toThrow(RangeError)
    expect(() => radiusForMass(Number.NaN)).toThrow(RangeError)
  })

  it('has no neutral absorption band between differently sized cells', () => {
    expect(canAbsorb(50, 50)).toBe(true)
    expect(canAbsorb(50.001, 50)).toBe(true)
    expect(canAbsorb(49.999, 50)).toBe(false)
  })

  it('selects the larger predator and breaks equal-mass ties by stable ID', () => {
    const small = { id: 'cell-b', mass: 49.99 }
    const large = { id: 'cell-a', mass: 50 }
    expect(predatorPreyForContact(small, large)).toEqual({ predator: large, prey: small })
    const equalA = { id: 'cell-a', mass: 50 }
    const equalB = { id: 'cell-b', mass: 50 }
    expect(predatorPreyForContact(equalB, equalA)).toEqual({
      predator: equalA,
      prey: equalB,
    })
  })

  it('grows contact distance with current mass and adds membrane sensitivity', () => {
    const initial = contactDistanceForMasses(36, 10)
    const grown = contactDistanceForMasses(144, 10)
    expect(grown).toBeGreaterThan(initial)
    expect(initial).toBeCloseTo(
      (radiusForMass(36) + radiusForMass(10)) * RULE_SET.mass.contactRadiusMultiplier,
      8,
    )
  })

  it('slows growth gently without dropping below the configured movement floor', () => {
    expect(movementFactorForMass(36, 36)).toBe(1)
    expect(movementFactorForMass(144, 36)).toBeGreaterThan(0.7)
    expect(movementFactorForMass(RULE_SET.mass.maximum, 36)).toBe(
      RULE_SET.mass.movementMinimumFactor,
    )
  })
})
