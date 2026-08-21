import { describe, expect, it } from 'vitest'
import { aggroIntent, selectAggroTarget } from './npcBehavior.js'

describe('NPC aggro profile', () => {
  it('switches at the configured inclusive radius and requires absorbable pursuit prey', () => {
    const pursue = Object.freeze({ aggro: 'pursue-player', aggroRadius: 390 })
    const flee = Object.freeze({ aggro: 'flee', aggroRadius: 300 })
    const passive = Object.freeze({ aggro: 'passive', aggroRadius: 999 })

    expect(aggroIntent(pursue, 390, true)).toBe(1)
    expect(aggroIntent(pursue, 390, false)).toBe(0)
    expect(aggroIntent(pursue, 390.001, true)).toBe(0)
    expect(aggroIntent(flee, 300)).toBe(-1)
    expect(aggroIntent(flee, 300.001)).toBe(0)
    expect(aggroIntent(passive, 0)).toBe(0)
  })

  it('selects only absorbable targets in the configured scope', () => {
    const predator = Object.freeze({ id: 'predator', kind: 'npc', x: 0, y: 0, mass: 50 })
    const player = Object.freeze({ id: 'player', kind: 'player', x: 20, y: 0, mass: 60 })
    const nearNpc = Object.freeze({ id: 'near', kind: 'npc', x: 10, y: 0, mass: 20 })
    const farNpc = Object.freeze({ id: 'far', kind: 'npc', x: 30, y: 0, mass: 10 })

    expect(
      selectAggroTarget(
        { aggro: 'pursue-player', aggroRadius: 100 },
        predator,
        [player, nearNpc, farNpc],
      ),
    ).toBeUndefined()
    expect(
      selectAggroTarget(
        { aggro: 'pursue-cell', aggroRadius: 100 },
        predator,
        [player, farNpc, nearNpc],
      )?.id,
    ).toBe('near')
  })

  it('breaks equal-distance target ties by stable entity ID', () => {
    const predator = Object.freeze({ id: 'predator', kind: 'npc', x: 0, y: 0, mass: 50 })
    const left = Object.freeze({ id: 'cell-b', kind: 'npc', x: -10, y: 0, mass: 10 })
    const right = Object.freeze({ id: 'cell-a', kind: 'npc', x: 10, y: 0, mass: 10 })
    expect(
      selectAggroTarget(
        { aggro: 'pursue-cell', aggroRadius: 100 },
        predator,
        [left, right],
      )?.id,
    ).toBe('cell-a')
  })
})
