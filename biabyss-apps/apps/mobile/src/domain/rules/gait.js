// @ts-check

import { RULE_SET } from './ruleSet.js'

/**
 * @typedef {object} GaitSample
 * @property {number} phase
 * @property {number} frontReach
 * @property {number} drive
 * @property {number} rearCatch
 * @property {number} rest
 * @property {'reach' | 'drive' | 'catch' | 'rest'} segment
 */

/** @param {number} value */
function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

/** @param {number} value */
function sineEase(value) {
  return 0.5 - Math.cos(clamp01(value) * Math.PI) * 0.5
}

/**
 * 실제 추진과 세포 표현이 공유하는 한 발 보행 표본이다.
 * @param {number} phase
 * @returns {GaitSample}
 */
export function sampleGait(phase) {
  const safePhase = Number.isFinite(phase) ? phase - Math.floor(phase) : 0
  const { reachEnd, driveEnd, catchEnd } = RULE_SET.gait
  const reachProgress = clamp01(safePhase / reachEnd)
  const driveProgress = clamp01((safePhase - reachEnd) / (driveEnd - reachEnd))
  const catchProgress = clamp01((safePhase - driveEnd) / (catchEnd - driveEnd))
  const restProgress = clamp01((safePhase - catchEnd) / (1 - catchEnd))

  let axisSeparation = 0
  if (safePhase < reachEnd) axisSeparation = sineEase(reachProgress)
  else if (safePhase < driveEnd) axisSeparation = 1
  else if (safePhase < catchEnd) axisSeparation = 1 - sineEase(catchProgress)

  return {
    phase: safePhase,
    frontReach: axisSeparation,
    drive: safePhase >= reachEnd && safePhase < driveEnd ? Math.sin(driveProgress * Math.PI) : 0,
    rearCatch:
      safePhase < driveEnd
        ? 0
        : safePhase < catchEnd
          ? sineEase(catchProgress)
          : 1 - sineEase(restProgress),
    rest: safePhase >= catchEnd ? sineEase(restProgress) : 0,
    segment:
      safePhase < reachEnd
        ? 'reach'
        : safePhase < driveEnd
          ? 'drive'
          : safePhase < catchEnd
            ? 'catch'
            : 'rest',
  }
}

/**
 * @param {number} phase
 * @param {number} dtSeconds
 * @param {number} cyclesPerSecond
 */
export function advanceGait(phase, dtSeconds, cyclesPerSecond) {
  const next = phase + dtSeconds * cyclesPerSecond
  const completedCycles = Math.max(0, Math.floor(next))
  return { phase: next - completedCycles, completedCycles }
}

/**
 * fixed tick 사이의 위치 보간율과 같은 비율로 보행 위상을 보간한다.
 * @param {number} previousPhase
 * @param {number} currentPhase
 * @param {number} alpha
 */
export function interpolateGaitPhase(previousPhase, currentPhase, alpha) {
  const safeAlpha = clamp01(alpha)
  const unwrappedCurrent = currentPhase < previousPhase ? currentPhase + 1 : currentPhase
  const interpolated = previousPhase + (unwrappedCurrent - previousPhase) * safeAlpha
  return interpolated - Math.floor(interpolated)
}
