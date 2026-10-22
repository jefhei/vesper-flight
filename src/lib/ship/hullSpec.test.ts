import { describe, expect, it } from 'vitest'
import {
  HULL_BEAM_M,
  HULL_LANDMARKS,
  HULL_LENGTH_M,
  HULL_PARTS,
  hullBounds,
  partCountByGroup,
} from './hullSpec'

describe('Hound-class hull spec', () => {
  it('is a 45 m ship with a 14 m beam (radiators deployed wider)', () => {
    const bounds = hullBounds()
    const primary = hullBounds(HULL_PARTS.filter((p) => p.group === 'hull'))
    expect(bounds.size[2]).toBeGreaterThan(HULL_LENGTH_M - 1)
    expect(bounds.size[2]).toBeLessThan(HULL_LENGTH_M + 1.5)
    // The welded pressure hull is 14 m across; booms, the dock ring and the
    // deployed radiators all extend the silhouette beyond that.
    const mainBody = HULL_PARTS.find((p) => p.id === 'main-body')!
    expect(mainBody.size[0]).toBe(HULL_BEAM_M)
    expect(primary.size[0]).toBeGreaterThan(HULL_BEAM_M)
    expect(bounds.size[0]).toBeGreaterThan(HULL_BEAM_M + 10)
    // Nose at -Z, drive at +Z.
    expect(bounds.min[2]).toBeLessThan(-21)
    expect(bounds.max[2]).toBeGreaterThan(21)
  })

  it('has one hull merge, four radiator panels and seven running lights', () => {
    const counts = partCountByGroup()
    // Four panels plus the nozzle throat, which rides the same heat material.
    const panels = HULL_PARTS.filter((p) => p.id.startsWith('rad-'))
    expect(panels).toHaveLength(4)
    expect(counts.radiator).toBe(5)
    expect(counts.light).toBe(7)
    expect(counts.hull).toBeGreaterThan(25)
  })

  it('mirrors the radiator panels port/starboard and dorsal/ventral', () => {
    const byId = new Map(HULL_PARTS.map((p) => [p.id, p]))
    const pairs: Array<[string, string]> = [
      ['rad-port', 'rad-stbd'],
      ['rad-dorsal', 'rad-ventral'],
    ]
    for (const [a, b] of pairs) {
      const pa = byId.get(a)!
      const pb = byId.get(b)!
      expect(pa.group).toBe('radiator')
      expect(pb.group).toBe('radiator')
      // Mirrored across the matching axis, same z.
      const axisSum = Math.abs(pa.pos[0] + pb.pos[0]) + Math.abs(pa.pos[1] + pb.pos[1])
      expect(axisSum).toBeLessThan(0.001)
      expect(Math.abs(pa.pos[2] - pb.pos[2])).toBeLessThan(0.001)
    }
  })

  it('carries twelve RCS thrusters, three per corner', () => {
    const rcs = HULL_PARTS.filter((p) => p.id.startsWith('rcs-'))
    expect(rcs).toHaveLength(12)
    for (const corner of [0, 1, 2, 3]) {
      const set = rcs.filter((p) => p.id.startsWith(`rcs-${corner}-`))
      expect(set.map((p) => p.id.split('-').pop()).sort()).toEqual(['x', 'y', 'z'])
    }
  })

  it('puts the nameplate on the dorsal spine, inside the hull footprint', () => {
    const { pos } = HULL_LANDMARKS.nameplate
    expect(pos[1]).toBeGreaterThan(6) // above the spine deck
    expect(Math.abs(pos[0])).toBeLessThan(HULL_BEAM_M / 2)
    expect(pos[2]).toBeGreaterThan(-20)
    expect(pos[2]).toBeLessThan(20)
  })

  it('gives every part a real hex colour and a unique id', () => {
    const ids = new Set<string>()
    for (const part of HULL_PARTS) {
      expect(part.id).not.toBe('')
      expect(ids.has(part.id)).toBe(false)
      ids.add(part.id)
      expect(part.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
