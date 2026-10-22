import { describe, expect, it } from 'vitest'
import { validateSystemSpec } from './validate'
import { PATHOLOGICAL_SYSTEM, TRIVIAL_SYSTEM, VESPER_SYSTEM } from './systems'

describe('validateSystemSpec', () => {
  it('accepts the trivial fixture', () => {
    expect(validateSystemSpec(TRIVIAL_SYSTEM)).toEqual([])
  })

  it('accepts the shipped Vesper system', () => {
    expect(validateSystemSpec(VESPER_SYSTEM)).toEqual([])
  })

  it('rejects the pathological fixture with the right reasons', () => {
    const errors = validateSystemSpec(PATHOLOGICAL_SYSTEM)
    expect(errors.length).toBeGreaterThanOrEqual(2)
    expect(errors.join('\n')).toMatch(/intersects the star/)
    expect(errors.join('\n')).toMatch(/at\/inside parent/)
  })

  it('rejects a short colour ramp', () => {
    const broken = structuredClone(VESPER_SYSTEM)
    broken.bodies[0].surface.colorRamp = ['#000000', '#ffffff']
    expect(validateSystemSpec(broken).join('\n')).toMatch(/colorRamp/)
  })

  it('rejects a duplicate body id', () => {
    const broken = structuredClone(TRIVIAL_SYSTEM)
    broken.bodies.push({ ...broken.bodies[0] })
    expect(validateSystemSpec(broken).join('\n')).toMatch(/duplicate body id/)
  })
})
