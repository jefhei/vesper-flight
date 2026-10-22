import { describe, expect, it } from 'vitest'
import { bodyPositionKm, bodyStatesAt, orbitalPositionKm } from './ephemeris'
import { VESPER_SYSTEM } from './systems'
import { distance } from '../math/vec3'

describe('ephemeris', () => {
  it('is deterministic: same time twice is bit-identical', () => {
    const a = bodyPositionKm('halcyon', VESPER_SYSTEM, 123_456.789)
    const b = bodyPositionKm('halcyon', VESPER_SYSTEM, 123_456.789)
    expect(a).toEqual(b)
  })

  it('is periodic for a circular orbit', () => {
    const halcyon = VESPER_SYSTEM.bodies.find((b) => b.id === 'halcyon')!
    if (halcyon.orbit.kind !== 'circular') throw new Error('fixture is circular')
    const p = halcyon.orbit.periodS
    const p0 = orbitalPositionKm(halcyon.orbit, 1000)
    const p1 = orbitalPositionKm(halcyon.orbit, 1000 + p)
    expect(distance(p0, p1)).toBeLessThan(1e-6)
  })

  it('resolves the parent chain: a moon orbits its parent at its orbit radius', () => {
    const nell = bodyPositionKm('nell', VESPER_SYSTEM, 42_000)
    const halcyon = bodyPositionKm('halcyon', VESPER_SYSTEM, 42_000)
    expect(distance(nell, halcyon)).toBeCloseTo(40_000, 0)
  })

  it('keeps the comet inside its ellipse bounds', () => {
    for (let t = 0; t < 40; t++) {
      const pos = bodyPositionKm('ashfall', VESPER_SYSTEM, (t / 40) * 3000 * 86_400)
      const r = Math.hypot(pos[0], pos[1], pos[2])
      expect(r).toBeGreaterThanOrEqual(300_000 - 1)
      expect(r).toBeLessThanOrEqual(1_100_000 + 1)
    }
  })

  it('stays finite over ten million sim seconds', () => {
    for (let i = 0; i < 200; i++) {
      const t = (i / 200) * 10_000_000
      for (const state of bodyStatesAt(VESPER_SYSTEM, t)) {
        expect(state.worldPosKm.every(Number.isFinite)).toBe(true)
      }
    }
  })
})
