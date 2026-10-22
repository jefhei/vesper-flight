import { describe, expect, it } from 'vitest'
import { lodLevelFor } from './lod'

const R = 4200

describe('LOD selection', () => {
  it('maps altitude to levels', () => {
    expect(lodLevelFor(R * 100, R)).toBe(0)
    expect(lodLevelFor(R * 2.4, R)).toBe(1)
    expect(lodLevelFor(R * 1.4, R)).toBe(2)
    expect(lodLevelFor(R * 1.05, R)).toBe(3)
  })

  it('never steps back out while the ship approaches', () => {
    let previous = lodLevelFor(R * 40, R)
    let monotonic = true
    for (let i = 1; i <= 400; i++) {
      const altitude = 40 - (i / 400) * 39.99
      const next = lodLevelFor(R * altitude, R, previous)
      if (next < previous) monotonic = false
      previous = next
    }
    expect(monotonic).toBe(true)
    expect(previous).toBe(3)
  })

  it('holds the level across a boundary (hysteresis)', () => {
    // Sitting exactly on the 0.6-radius boundary must not flicker.
    const at = R * 1.6
    const held = lodLevelFor(at, R, 1)
    expect(held).toBe(1)
    // 12% inside the boundary is where the upgrade is allowed.
    const nudgedIn = lodLevelFor(R * 1.52, R, 1)
    expect(nudgedIn).toBe(2)
  })
})
