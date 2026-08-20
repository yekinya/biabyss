export const DEFAULT_RADIUS_SCALE = 4

export function radiusForMass(
  mass: number,
  radiusScale = DEFAULT_RADIUS_SCALE,
): number {
  if (!Number.isFinite(mass) || mass <= 0) {
    throw new RangeError('mass must be a finite positive number')
  }

  if (!Number.isFinite(radiusScale) || radiusScale <= 0) {
    throw new RangeError('radiusScale must be a finite positive number')
  }

  return Math.sqrt(mass) * radiusScale
}
