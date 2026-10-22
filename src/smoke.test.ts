import { describe, expect, it } from 'vitest'

// Keeps `npm run test` green while the suite is being built out.
describe('smoke', () => {
  it('adds', () => {
    expect(1 + 1).toBe(2)
  })
})
