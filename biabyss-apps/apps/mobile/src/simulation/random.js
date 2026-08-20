// @ts-check

export class SeededRandom {
  /** @param {number} seed */
  constructor(seed) {
    this.state = seed >>> 0 || 0x6d2b79f5
  }

  next() {
    let value = this.state
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    this.state = value >>> 0
    return this.state / 0x1_0000_0000
  }

  /** @param {number} minimum @param {number} maximum */
  between(minimum, maximum) {
    return minimum + (maximum - minimum) * this.next()
  }
}

/**
 * @param {number} count
 * @param {number} width
 * @param {number} height
 * @param {SeededRandom} random
 */
export function stratifiedPositions(count, width, height, random) {
  const columns = Math.ceil(Math.sqrt((count * width) / height))
  const rows = Math.ceil(count / columns)
  const cellWidth = width / columns
  const cellHeight = height / rows
  const positions = []

  for (let index = 0; index < count; index += 1) {
    const column = index % columns
    const row = Math.floor(index / columns)
    positions.push({
      x: (column + random.between(0.18, 0.82)) * cellWidth,
      y: (row + random.between(0.18, 0.82)) * cellHeight,
    })
  }

  return positions
}
