import { describe, expect, it } from 'vitest'
import { SeededRandom, stratifiedPositions } from './random.js'

describe('seeded field placement', () => {
  it('is deterministic for the same seed', () => {
    const first = stratifiedPositions(54, 6000, 3600, new SeededRandom(707))
    const second = stratifiedPositions(54, 6000, 3600, new SeededRandom(707))
    expect(first).toEqual(second)
  })

  it('spreads samples across the entire field', () => {
    const points = stratifiedPositions(54, 6000, 3600, new SeededRandom(707))
    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)
    expect(Math.min(...xs)).toBeLessThan(900)
    expect(Math.max(...xs)).toBeGreaterThan(5100)
    expect(Math.min(...ys)).toBeLessThan(700)
    expect(Math.max(...ys)).toBeGreaterThan(2900)
  })
})
