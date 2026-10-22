import { describe, expect, it } from 'vitest'
import { outwardFraction, wedgeGeometry } from './primitives'

describe('wedgeGeometry', () => {
  it('emits 12 flat-shaded triangles, non-indexed', () => {
    const mesh = wedgeGeometry(6, 6.5, 6.2, 12, 7)
    expect(mesh.triangleCount).toBe(12)
    expect(mesh.positions.length).toBe(12 * 9)
    expect(mesh.normals.length).toBe(12 * 9)
    expect(mesh.uvs.length).toBe(12 * 6)
  })

  it('winds every triangle outward', () => {
    const mesh = wedgeGeometry(6, 6.5, 6.2, 12, 7)
    expect(outwardFraction(mesh)).toBe(1)
  })

  it('spans the requested length and the larger cross-section', () => {
    const mesh = wedgeGeometry(6, 6.5, 6.2, 12, 7)
    let minZ = Infinity
    let maxZ = -Infinity
    let maxX = 0
    for (let i = 0; i < mesh.positions.length; i += 3) {
      minZ = Math.min(minZ, mesh.positions[i + 2])
      maxZ = Math.max(maxZ, mesh.positions[i + 2])
      maxX = Math.max(maxX, Math.abs(mesh.positions[i]))
    }
    expect(maxZ - minZ).toBeCloseTo(6, 6)
    expect(maxX).toBeCloseTo(6, 6) // half of the 12 m back face
  })

  it('has unit-length normals', () => {
    const mesh = wedgeGeometry(4, 4, 3, 8, 5)
    for (let i = 0; i < mesh.normals.length; i += 3) {
      const len = Math.hypot(mesh.normals[i], mesh.normals[i + 1], mesh.normals[i + 2])
      expect(len).toBeCloseTo(1, 5)
    }
  })
})
