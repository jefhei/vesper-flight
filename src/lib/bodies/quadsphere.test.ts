import { describe, expect, it } from 'vitest'
import { outwardFraction, quadSphere, quadSphereDivisions, radialErrorM } from './quadsphere'

describe('quad-sphere', () => {
  it('has the expected vertex/triangle count per level', () => {
    for (const level of [0, 1]) {
      const divisions = quadSphereDivisions(level)
      const mesh = quadSphere(level, 1000)
      expect(mesh.positions.length).toBe(6 * (divisions + 1) ** 2 * 3)
      expect(mesh.triangleCount).toBe(6 * divisions * divisions * 2)
    }
  })

  it('winds every triangle outward', () => {
    for (const level of [0, 1, 2]) {
      const mesh = quadSphere(level, 1000)
      expect(outwardFraction(mesh)).toBeGreaterThan(0.99)
    }
  })

  it('stays on the sphere before displacement', () => {
    const mesh = quadSphere(1, 4_200_000)
    expect(radialErrorM(mesh, 4_200_000)).toBeLessThan(0.5) // metres
  })

  it('honours a displacement function', () => {
    const mesh = quadSphere(0, 1000, () => 25)
    expect(radialErrorM(mesh, 1025)).toBeLessThan(0.5)
  })

  it('adds a skirt ring when asked', () => {
    const plain = quadSphere(1, 1000)
    const skirted = quadSphere(1, 1000, undefined, 5)
    expect(skirted.positions.length).toBeGreaterThan(plain.positions.length)
    expect(skirted.triangleCount).toBeGreaterThan(plain.triangleCount)
  })
})
