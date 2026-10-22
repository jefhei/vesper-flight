/** WebGL capability probe. three.js throws (and leaves a black canvas) when it
 *  cannot create a context — usually hardware acceleration turned off, or a
 *  headless/remote browser. Failing with a sentence beats failing with a void. */

export type WebGLSupport = { ok: boolean; reason: string | null }

export function detectWebGL(): WebGLSupport {
  if (typeof document === 'undefined') return { ok: false, reason: 'no document' }
  let canvas: HTMLCanvasElement
  try {
    canvas = document.createElement('canvas')
  } catch {
    return { ok: false, reason: 'canvas unavailable' }
  }

  const attempts: Array<[string, WebGLContextAttributes]> = [
    ['webgl2', { failIfMajorPerformanceCaveat: false }],
    ['webgl', { failIfMajorPerformanceCaveat: false }],
  ]

  for (const [name, attrs] of attempts) {
    try {
      const context = canvas.getContext(name, attrs)
      if (context) return { ok: true, reason: null }
    } catch {
      // Some browsers throw instead of returning null; fall through.
    }
  }
  return { ok: false, reason: 'no WebGL context could be created' }
}
