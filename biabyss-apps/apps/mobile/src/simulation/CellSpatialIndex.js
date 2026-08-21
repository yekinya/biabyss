// @ts-check

/** @typedef {{id: string, x: number, y: number}} SpatialCell */

export class CellSpatialIndex {
  /** @param {number} cellSize @param {number} worldWidth */
  constructor(cellSize, worldWidth) {
    if (!Number.isFinite(cellSize) || cellSize <= 0) throw new RangeError('cellSize must be positive')
    this.cellSize = cellSize
    this.columns = Math.max(1, Math.ceil(worldWidth / cellSize))
    /** @type {Map<number, SpatialCell[]>} */
    this.buckets = new Map()
  }

  /** @param {SpatialCell[]} cells */
  rebuild(cells) {
    for (const bucket of this.buckets.values()) bucket.length = 0
    for (const cell of cells) {
      const key = this.keyFor(cell.x, cell.y)
      let bucket = this.buckets.get(key)
      if (!bucket) {
        bucket = []
        this.buckets.set(key, bucket)
      }
      bucket.push(cell)
    }
  }

  /** @param {number} x @param {number} y @param {number} radius @param {SpatialCell[]} [output] @returns {SpatialCell[]} */
  query(x, y, radius, output = []) {
    const minimumColumn = Math.max(0, Math.floor((x - radius) / this.cellSize))
    const maximumColumn = Math.min(
      this.columns - 1,
      Math.floor((x + radius) / this.cellSize),
    )
    const minimumRow = Math.max(0, Math.floor((y - radius) / this.cellSize))
    const maximumRow = Math.floor((y + radius) / this.cellSize)
    output.length = 0

    for (let row = minimumRow; row <= maximumRow; row += 1) {
      for (let column = minimumColumn; column <= maximumColumn; column += 1) {
        const bucket = this.buckets.get(row * this.columns + column)
        if (!bucket) continue
        for (const cell of bucket) output.push(cell)
      }
    }
    return output
  }

  /** @param {number} x @param {number} y */
  keyFor(x, y) {
    return Math.floor(y / this.cellSize) * this.columns + Math.floor(x / this.cellSize)
  }
}
