import { describe, expect, it } from 'vitest'
import { opticalStageId, resolveOpticalStage } from './microscopeStage.js'

describe('microscope optical stage', () => {
  it('progresses from bright field through algae bloom to detritus', () => {
    expect(opticalStageId(resolveOpticalStage(36, 36))).toBe('bright-field')
    expect(opticalStageId(resolveOpticalStage(80, 36))).toBe('algae-bloom')
    expect(opticalStageId(resolveOpticalStage(140, 36))).toBe('detritus-deep')
  })

  it('clamps invalid or extreme growth safely', () => {
    expect(resolveOpticalStage(Number.NaN, 36)).toBe(0)
    expect(resolveOpticalStage(9999, 36)).toBe(2)
  })
})
