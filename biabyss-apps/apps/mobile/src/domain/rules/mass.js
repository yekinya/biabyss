// @ts-check

import { RULE_SET } from './ruleSet.js'

/**
 * @param {number} mass
 * @param {number} [radiusScale]
 */
export function radiusForMass(mass, radiusScale = RULE_SET.mass.radiusScale) {
  if (!Number.isFinite(mass) || mass <= 0) {
    throw new RangeError('mass must be a finite positive number')
  }

  if (!Number.isFinite(radiusScale) || radiusScale <= 0) {
    throw new RangeError('radiusScale must be a finite positive number')
  }

  return Math.sqrt(mass) * radiusScale
}

/** @param {number} predatorMass @param {number} preyMass */
export function canAbsorb(predatorMass, preyMass) {
  const threshold = preyMass * RULE_SET.mass.cellAbsorbRatio
  const tolerance = Number.EPSILON * Math.max(predatorMass, threshold) * 4
  return predatorMass + tolerance >= threshold
}
