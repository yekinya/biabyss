// @ts-check

import { RULE_SET } from '../../domain/rules/ruleSet.js'

/** @param {number} mass */
export function cameraWorldScaleForMass(mass) {
  if (!Number.isFinite(mass) || mass <= 0) {
    throw new RangeError('mass must be a finite positive number')
  }
  const startRoot = Math.sqrt(RULE_SET.rendering.cameraZoomOutStartMass)
  const fullRoot = Math.sqrt(RULE_SET.rendering.cameraZoomOutFullMass)
  const progress = Math.min(
    1,
    Math.max(0, (Math.sqrt(mass) - startRoot) / (fullRoot - startRoot)),
  )
  const eased = progress * progress * (3 - 2 * progress)
  return 1 + (RULE_SET.rendering.cameraMaximumWorldScale - 1) * eased
}

/** @param {number} cssExtent @param {number} worldScale */
export function visibleWorldExtent(cssExtent, worldScale) {
  return Math.max(1, cssExtent) * worldScale
}

/** @param {number} position @param {number} worldExtent @param {number} visibleExtent */
export function clampCameraCoordinate(position, worldExtent, visibleExtent) {
  if (visibleExtent >= worldExtent) return worldExtent / 2
  const halfExtent = visibleExtent / 2
  return Math.min(worldExtent - halfExtent, Math.max(halfExtent, position))
}

/** @param {number} cameraCenter @param {number} normalizedOffset @param {number} visibleExtent */
export function worldCoordinateFromNormalized(cameraCenter, normalizedOffset, visibleExtent) {
  return cameraCenter + normalizedOffset * visibleExtent
}
