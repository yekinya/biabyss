import { describe, expect, it } from 'vitest'
import { CellSpatialIndex } from './CellSpatialIndex.js'

describe('CellSpatialIndex', () => {
  it('returns only neighboring buckets and rebuilds without stale cells', () => {
    const index = new CellSpatialIndex(100, 1000)
    const near = { id: 'near', x: 90, y: 90 }
    const adjacent = { id: 'adjacent', x: 110, y: 110 }
    const far = { id: 'far', x: 800, y: 800 }
    index.rebuild([near, adjacent, far])
    expect(index.query(100, 100, 40).map((cell) => cell.id)).toEqual(['near', 'adjacent'])

    index.rebuild([far])
    expect(index.query(100, 100, 40)).toHaveLength(0)
  })
})
