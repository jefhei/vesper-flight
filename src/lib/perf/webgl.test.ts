import { describe, expect, it, vi } from 'vitest'
import { detectWebGL } from './webgl'

describe('detectWebGL', () => {
  it('reports unsupported without throwing when getContext returns null', () => {
    // jsdom has no GL; src/test-setup.ts stubs getContext to return null.
    const result = detectWebGL()
    expect(result.ok).toBe(false)
    expect(result.reason).toBeTruthy()
  })

  it('reports supported when a context is returned', () => {
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as unknown as RenderingContext)
    const result = detectWebGL()
    expect(result.ok).toBe(true)
    expect(result.reason).toBeNull()
    spy.mockRestore()
  })

  it('survives a browser that throws from getContext', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('gpu process crashed')
    })
    expect(detectWebGL().ok).toBe(false)
    spy.mockRestore()
  })
})
