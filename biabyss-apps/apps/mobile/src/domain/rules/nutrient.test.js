import { describe, expect, it } from 'vitest'
import { nutrientPointSize, nutrientRadius } from './nutrient.js'

describe('nutrient size rules', () => {
  it('derives larger collision and point sizes from mass', () => {
    expect(nutrientRadius(6)).toBeGreaterThan(nutrientRadius(1))
    expect(nutrientPointSize(6)).toBeGreaterThan(nutrientPointSize(1))
  })

  it('rejects invalid mass', () => {
    expect(() => nutrientRadius(0)).toThrow(RangeError)
    expect(() => nutrientPointSize(Number.NaN)).toThrow(RangeError)
  })
})
