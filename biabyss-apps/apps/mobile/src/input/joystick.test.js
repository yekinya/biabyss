import { describe, expect, it } from 'vitest'
import { sampleJoystick } from './joystick.js'

describe('sampleJoystick', () => {
  it('returns no direction or strength at the center', () => {
    expect(sampleJoystick(0, 0, 72)).toEqual({
      directionX: 0,
      directionY: 0,
      strength: 0,
      knobX: 0,
      knobY: 0,
    })
  })

  it('maps half the radius to half strength', () => {
    const sample = sampleJoystick(36, 0, 72)
    expect(sample.strength).toBe(0.5)
    expect(sample.directionX).toBe(1)
    expect(sample.knobX).toBe(36)
  })

  it('clamps the knob and strength at the outer radius', () => {
    const sample = sampleJoystick(300, 400, 72)
    expect(sample.strength).toBe(1)
    expect(Math.hypot(sample.knobX, sample.knobY)).toBeCloseTo(72)
    expect(sample.directionX).toBeCloseTo(0.6)
    expect(sample.directionY).toBeCloseTo(0.8)
  })

  it('rejects an invalid radius', () => {
    expect(() => sampleJoystick(1, 1, 0)).toThrow(RangeError)
  })
})
