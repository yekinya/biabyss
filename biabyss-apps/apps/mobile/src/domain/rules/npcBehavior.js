// @ts-check

import { canAbsorb } from './mass.js'

/**
 * Species 성향, 감지 반경과 현재 포식 가능 여부로 방향 의도를 계산한다.
 * @param {{aggro: 'pursue-player' | 'pursue-cell' | 'flee' | 'passive', aggroRadius: number}} archetype
 * @param {number} distance
 * @param {boolean} [absorbable]
 * @returns {-1 | 0 | 1}
 */
export function aggroIntent(archetype, distance, absorbable = false) {
  if (archetype.aggro === 'passive') return 0
  if (!Number.isFinite(distance) || distance > archetype.aggroRadius) return 0
  if (archetype.aggro === 'flee') return -1
  return absorbable ? 1 : 0
}

/**
 * @typedef {object} AggroCell
 * @property {string} id
 * @property {'player' | 'npc'} kind
 * @property {number} x
 * @property {number} y
 * @property {number} mass
 * @property {string | undefined} [absorbedBy]
 */

/**
 * @param {{aggro: 'pursue-player' | 'pursue-cell' | 'flee' | 'passive', aggroRadius: number}} archetype
 * @param {AggroCell} predator
 * @param {AggroCell[]} candidates
 * @returns {AggroCell | undefined}
 */
export function selectAggroTarget(archetype, predator, candidates) {
  if (archetype.aggro !== 'pursue-player' && archetype.aggro !== 'pursue-cell') {
    return undefined
  }

  const maximumDistanceSquared = archetype.aggroRadius * archetype.aggroRadius
  /** @type {AggroCell | undefined} */
  let selected
  let selectedDistanceSquared = Number.POSITIVE_INFINITY

  for (const candidate of candidates) {
    if (candidate.id === predator.id || candidate.absorbedBy) continue
    if (archetype.aggro === 'pursue-player' && candidate.kind !== 'player') continue
    if (!canAbsorb(predator.mass, candidate.mass)) continue
    const dx = candidate.x - predator.x
    const dy = candidate.y - predator.y
    const distanceSquared = dx * dx + dy * dy
    if (distanceSquared > maximumDistanceSquared) continue
    if (
      distanceSquared < selectedDistanceSquared ||
      (distanceSquared === selectedDistanceSquared && selected && candidate.id < selected.id)
    ) {
      selected = candidate
      selectedDistanceSquared = distanceSquared
    }
  }

  return selected
}
