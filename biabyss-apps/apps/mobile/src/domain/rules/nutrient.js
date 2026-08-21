// @ts-check

import { RULE_SET } from './ruleSet.js'

/** @param {number} mass */
export function nutrientRadius(mass) {
  validateMass(mass)
  return Math.sqrt(mass) * RULE_SET.nutrient.collisionRadiusScale
}

/** @param {number} mass */
export function nutrientPointSize(mass) {
  validateMass(mass)
  return RULE_SET.nutrient.pointSizeBase + Math.sqrt(mass) * RULE_SET.nutrient.pointSizeMassScale
}

/** @param {number} mass */
function validateMass(mass) {
  if (!Number.isFinite(mass) || mass <= 0) throw new RangeError('nutrient mass must be positive')
}
