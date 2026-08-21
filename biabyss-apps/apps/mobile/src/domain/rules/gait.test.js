import { describe, expect, it } from 'vitest'
import { advanceGait, interpolateGaitPhase, sampleGait } from './gait.js'
import { RULE_SET } from './ruleSet.js'

describe('shared gait phase', () => {
  it('reaches, drives, catches and rests in stable order', () => {
    const reach = sampleGait(RULE_SET.gait.reachEnd * 0.75)
    const drive = sampleGait((RULE_SET.gait.reachEnd + RULE_SET.gait.driveEnd) * 0.5)
    const catchSample = sampleGait((RULE_SET.gait.driveEnd + RULE_SET.gait.catchEnd) * 0.5)
    const rest = sampleGait((RULE_SET.gait.catchEnd + 1) * 0.5)

    expect(reach.segment).toBe('reach')
    expect(reach.frontReach).toBeGreaterThan(0.5)
    expect(drive.segment).toBe('drive')
    expect(drive.drive).toBeCloseTo(1, 5)
    expect(catchSample.segment).toBe('catch')
    expect(catchSample.rearCatch).toBeGreaterThan(0.4)
    expect(rest.segment).toBe('rest')
    expect(rest.frontReach).toBe(0)
  })

  it('reports completed cycles without losing the normalized phase', () => {
    const result = advanceGait(0.95, 0.1, 1.5)
    expect(result.completedCycles).toBe(1)
    expect(result.phase).toBeCloseTo(0.1, 8)
  })

  it('keeps drive timing and makes rear catch take twice as long', () => {
    const frequency = 1
    const driveSeconds = RULE_SET.gait.driveEnd - RULE_SET.gait.reachEnd
    const catchSeconds =
      (RULE_SET.gait.catchEnd - RULE_SET.gait.driveEnd) / RULE_SET.gait.catchTimeScale
    expect(advanceGait(RULE_SET.gait.reachEnd, driveSeconds, frequency).phase).toBeCloseTo(
      RULE_SET.gait.driveEnd,
      8,
    )
    expect(advanceGait(RULE_SET.gait.driveEnd, catchSeconds * 0.5, frequency).phase).toBeCloseTo(
      (RULE_SET.gait.driveEnd + RULE_SET.gait.catchEnd) * 0.5,
      8,
    )
    expect(advanceGait(RULE_SET.gait.driveEnd, catchSeconds, frequency).phase).toBeCloseTo(
      RULE_SET.gait.catchEnd,
      8,
    )
  })

  it('interpolates across a cycle wrap without running backward', () => {
    expect(interpolateGaitPhase(0.98, 0.02, 0.5)).toBeCloseTo(0, 8)
    expect(interpolateGaitPhase(0.2, 0.4, 0.25)).toBeCloseTo(0.25, 8)
  })
})
