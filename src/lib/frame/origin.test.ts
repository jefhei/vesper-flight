import { describe, expect, it } from 'vitest'
import {
  createOrigin,
  float32ErrorM,
  fromRenderKm,
  toRenderKm,
  updateOrigin,
} from './origin'
import { distance } from '../math/vec3'

describe('floating origin', () => {
  it('does not rebase inside the threshold', () => {
    const o = createOrigin()
    const next = updateOrigin([1000, 0, 0], o, 10_000, 1000)
    expect(next.rebaseSerial).toBe(0)
    expect(next.originKm).toEqual([0, 0, 0])
  })

  it('rebases onto the grid past the threshold', () => {
    const o = createOrigin()
    const next = updateOrigin([10_400, 0, 0], o, 10_000, 1000)
    expect(next.rebaseSerial).toBe(1)
    expect(next.originKm).toEqual([10_000, 0, 0])
  })

  it('is exact over ten thousand updates', () => {
    let origin = createOrigin()
    let peak = 0
    for (let i = 0; i < 10_000; i++) {
      // Walk outward at 1,000 km per step, plus a jitter so no two steps align.
      const world = [i * 1000 + (i % 7) * 0.25, (i % 13) * 3.5, (i % 17) * 0.125] as const
      origin = updateOrigin([...world], origin, 5000, 1000)
      const render = toRenderKm([...world], origin)
      const recovered = fromRenderKm(render, origin)
      peak = Math.max(peak, distance(recovered, [...world]) * 1000) // metres
    }
    expect(origin.rebaseSerial).toBeGreaterThan(1500)
    expect(peak).toBeLessThan(1) // metres
  })

  it('keeps near-field float32 error sub-millimetre', () => {
    const o = createOrigin()
    const near = toRenderKm([o.originKm[0] + 2.5, 0, 0], o)
    expect(float32ErrorM(near)).toBeLessThan(0.001)
  })

  it('degrades with distance when no rebase happens — why the rebase exists', () => {
    const o = createOrigin()
    // Sample a few offsets: a round number like 1e9 m is exactly representable
    // in float32, which would hide the very effect being measured.
    const errors = [0.011, 0.023, 0.037, 0.049, 0.061].map((offset) =>
      float32ErrorM(toRenderKm([1_000_000 + offset, 0, 0], o)),
    )
    expect(Math.max(...errors)).toBeGreaterThan(10) // metres, at 1e6 km
  })
})
