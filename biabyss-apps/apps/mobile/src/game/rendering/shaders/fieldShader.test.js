import { describe, expect, it } from 'vitest'
import { fieldFragmentShader } from './fieldShader.js'

describe('procedural microscope field shader', () => {
  it('builds the environment without a fixed image sampler', () => {
    expect(fieldFragmentShader).not.toContain('sampler2D')
    expect(fieldFragmentShader).not.toContain('texture2D')
    expect(fieldFragmentShader).toContain('uniform float uMotionScale')
    expect(fieldFragmentShader).toContain('uniform float uOpticalStage')
    expect(fieldFragmentShader).toContain('uniform vec2 uWorldSize')
  })

  it('keeps the procedural noise budget at four static octaves', () => {
    expect(fieldFragmentShader).toContain('octave < 4')
    expect(fieldFragmentShader).toContain('warp * 1.22')
  })
})
