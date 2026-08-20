// @ts-check

/**
 * @typedef {object} JoystickSample
 * @property {number} directionX
 * @property {number} directionY
 * @property {number} strength
 * @property {number} knobX
 * @property {number} knobY
 */

/**
 * Canvas CSS 좌표의 pointer 변위를 조이패드 반경 안으로 정규화한다.
 * @param {number} deltaX
 * @param {number} deltaY
 * @param {number} radiusCssPx
 * @returns {JoystickSample}
 */
export function sampleJoystick(deltaX, deltaY, radiusCssPx) {
  if (!Number.isFinite(radiusCssPx) || radiusCssPx <= 0) {
    throw new RangeError('joystick radius must be a finite positive number')
  }

  const safeX = Number.isFinite(deltaX) ? deltaX : 0
  const safeY = Number.isFinite(deltaY) ? deltaY : 0
  const distance = Math.hypot(safeX, safeY)
  if (distance === 0) {
    return { directionX: 0, directionY: 0, strength: 0, knobX: 0, knobY: 0 }
  }

  const strength = Math.min(1, distance / radiusCssPx)
  const directionX = safeX / distance
  const directionY = safeY / distance
  return {
    directionX,
    directionY,
    strength,
    knobX: directionX * radiusCssPx * strength,
    knobY: directionY * radiusCssPx * strength,
  }
}
