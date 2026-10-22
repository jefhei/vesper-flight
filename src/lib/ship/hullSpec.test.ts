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
    // Deployed wings stand off the flanks: ~18.6 m across, 14.4 m tall.
    expect(bounds.size[0]).toBeGreaterThan(HULL_BEAM_M + 3)
    // Nose at -Z, drive at +Z.
    expect(bounds.min[2]).toBeLessThan(-21)
    expect(bounds.max[2]).toBeGreaterThan(21)
  })

  it('has one hull merge, twelve radiator panels and seven running lights', () => {
    const counts = partCountByGroup()
    // Four wings × three panels; the nozzle throat rides the same heat material.
    expect(HULL_LANDMARKS.radiatorPanels).toHaveLength(12)
    expect(counts.radiator).toBe(13)
    expect(counts.light).toBe(7)
    expect(counts.hull).toBeGreaterThan(60)
  })

  it('gives every radiator wing three panels and a tip rail', () => {
    for (const wing of HULL_LANDMARKS.wingIds) {
      const panels = HULL_PARTS.filter((p) => p.id.startsWith(`rad-${wing}-`))
      expect(panels).toHaveLength(3)
      expect(panels.every((p) => p.group === 'radiator')).toBe(true)
      expect(HULL_PARTS.some((p) => p.id === `radrail-${wing}`)).toBe(true)
      expect(HULL_PARTS.some((p) => p.id === `radhdr-${wing}`)).toBe(true)
    }
  })

  it('mirrors the radiator wings port/starboard and dorsal/ventral', () => {
    const byId = new Map(HULL_PARTS.map((p) => [p.id, p]))
    for (const i of [0, 1, 2]) {
      const port = byId.get(`rad-port-${i}`)!
      const stbd = byId.get(`rad-stbd-${i}`)!
      expect(port.pos[0] + stbd.pos[0]).toBeCloseTo(0, 6)
      expect(port.pos[2]).toBeCloseTo(stbd.pos[2], 6)

      const dorsal = byId.get(`rad-dorsal-${i}`)!
      const ventral = byId.get(`rad-ventral-${i}`)!
      expect(dorsal.pos[1] + ventral.pos[1]).toBeCloseTo(0, 6)
      expect(dorsal.pos[2]).toBeCloseTo(ventral.pos[2], 6)
    }
  })

  it('carries twelve RCS thrusters, three per corner', () => {
    const bodies = HULL_PARTS.filter(
      (p) => p.id.startsWith('rcs-') && /-(x|y|z)$/.test(p.id),
    )
    expect(bodies).toHaveLength(12)
    for (const corner of [0, 1, 2, 3]) {
      const set = bodies.filter((p) => p.id.startsWith(`rcs-${corner}-`))
      expect(set.map((p) => p.id.split('-').pop()).sort()).toEqual(['x', 'y', 'z'])
    }
    // Four of the twelve carry modelled exhaust nozzles.
    expect(HULL_PARTS.filter((p) => p.id.endsWith('-nozzle'))).toHaveLength(8)
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
