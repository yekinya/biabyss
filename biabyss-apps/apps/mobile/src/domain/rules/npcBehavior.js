// @ts-check

/**
 * Species의 고정 성향과 감지 반경만으로 Player에 대한 방향 의도를 계산한다.
 * @param {{aggro: 'pursue' | 'flee' | 'passive', aggroRadius: number}} archetype
 * @param {number} distance
 */
export function aggroIntent(archetype, distance) {
  if (archetype.aggro === 'passive') return 0
  if (!Number.isFinite(distance) || distance > archetype.aggroRadius) return 0
  return archetype.aggro === 'pursue' ? 1 : -1
}
