// @ts-check

/**
 * Player 성장률을 0..2의 연속 Optical Stage로 바꾼다.
 * gameplay state가 아닌 Presentation 파생 값이다.
 * @param {number} mass
 * @param {number} initialMass
 */
export function resolveOpticalStage(mass, initialMass) {
  if (!Number.isFinite(mass) || !Number.isFinite(initialMass) || initialMass <= 0) return 0
  const growthRatio = Math.max(1, mass / initialMass)
  return Math.min(2, (growthRatio - 1) / 1.1)
}

/** @param {number} stage */
export function opticalStageId(stage) {
  if (stage < 0.72) return 'bright-field'
  if (stage < 1.55) return 'algae-bloom'
  return 'detritus-deep'
}
