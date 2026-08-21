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

/** @param {number} firstMass @param {number} secondMass */
export function contactDistanceForMasses(firstMass, secondMass) {
  return (
    (radiusForMass(firstMass) + radiusForMass(secondMass)) *
    RULE_SET.mass.contactRadiusMultiplier
  )
}

/** @param {number} currentMass @param {number} referenceMass */
export function movementFactorForMass(currentMass, referenceMass) {
  if (!Number.isFinite(currentMass) || currentMass <= 0) {
    throw new RangeError('currentMass must be a finite positive number')
  }
  if (!Number.isFinite(referenceMass) || referenceMass <= 0) {
    throw new RangeError('referenceMass must be a finite positive number')
  }
  const factor = Math.pow(referenceMass / currentMass, RULE_SET.mass.movementMassExponent)
  return Math.min(
    RULE_SET.mass.movementMaximumFactor,
    Math.max(RULE_SET.mass.movementMinimumFactor, factor),
  )
}

/**
 * @template {{id: string, mass: number}} T
 * @param {T} first
 * @param {T} second
 * @returns {{predator: T, prey: T}}
 */
export function predatorPreyForContact(first, second) {
  if (first.mass > second.mass) return { predator: first, prey: second }
  if (second.mass > first.mass) return { predator: second, prey: first }
  return first.id < second.id
    ? { predator: first, prey: second }
    : { predator: second, prey: first }
}
