import { describe, expect, it } from 'vitest'
import { generateSurfaceMap, hashSurface } from './surface'
import { VESPER_SYSTEM } from '../world/systems'

const halcyon = VESPER_SYSTEM.bodies.find((b) => b.id === 'halcyon')!
const tallow = VESPER_SYSTEM.bodies.find((b) => b.id === 'tallow')!

describe('surface bake', () => {
  it('is deterministic for one seed', () => {
    const a = generateSurfaceMap(halcyon.surface, 64, 32)
    const b = generateSurfaceMap(halcyon.surface, 64, 32)
    expect(hashSurface(a)).toBe(hashSurface(b))
  })

  it('differs when the seed changes', () => {
    const a = generateSurfaceMap(halcyon.surface, 64, 32)
    const b = generateSurfaceMap({ ...halcyon.surface, noiseSeed: 999 }, 64, 32)
    expect(hashSurface(a)).not.toBe(hashSurface(b))
  })

  it('stays in range and is opaque', () => {
    const bake = generateSurfaceMap(halcyon.surface, 64, 32)
    for (const h of bake.heights) {
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(1)
    }
    for (let i = 3; i < bake.rgba.length; i += 4) expect(bake.rgba[i]).toBe(255)
  })

  it('produces visible contrast on both an ocean world and a gas giant', () => {
    for (const spec of [halcyon.surface, tallow.surface]) {
      const bake = generateSurfaceMap(spec, 128, 64)
      let min = 255
      let max = 0
      for (let i = 0; i < bake.rgba.length; i += 4) {
        min = Math.min(min, bake.rgba[i])
        max = Math.max(max, bake.rgba[i])
      }
      expect(max - min).toBeGreaterThan(20)
    }
  })
})
