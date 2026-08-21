import { describe, expect, it } from 'vitest'
import { aggroIntent } from './npcBehavior.js'

describe('NPC aggro profile', () => {
  it('switches at the configured inclusive radius without a mass input', () => {
    const pursue = Object.freeze({ aggro: 'pursue', aggroRadius: 390 })
    const flee = Object.freeze({ aggro: 'flee', aggroRadius: 300 })
    const passive = Object.freeze({ aggro: 'passive', aggroRadius: 999 })

    expect(aggroIntent(pursue, 390)).toBe(1)
    expect(aggroIntent(pursue, 390.001)).toBe(0)
    expect(aggroIntent(flee, 300)).toBe(-1)
    expect(aggroIntent(flee, 300.001)).toBe(0)
    expect(aggroIntent(passive, 0)).toBe(0)
  })
})
