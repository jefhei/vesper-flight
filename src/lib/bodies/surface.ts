import type { SurfaceSpec } from '../../types/world'
import { fbm3, mulberry32, ridged3 } from './noise'

/** Deterministic equirectangular bake: albedo RGBA + a height field.
 *  No canvas, no GPU — so the same seed produces the same bytes anywhere. */

export type SurfaceBake = {
  width: number
  height: number
  rgba: Uint8Array
  heights: Float32Array
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rampColor(ramp: Array<[number, number, number]>, t: number): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, t))
  const scaled = clamped * (ramp.length - 1)
  const i = Math.min(ramp.length - 2, Math.floor(scaled))
  const f = scaled - i
  const a = ramp[i]
  const b = ramp[i + 1]
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ]
}

export function generateSurfaceMap(
  spec: SurfaceSpec,
  width = spec.mapResolution[0],
  height = spec.mapResolution[1],
): SurfaceBake {
  const ramp = spec.colorRamp.map(hexToRgb)
  const rgba = new Uint8Array(width * height * 4)
  const heights = new Float32Array(width * height)
  const seed = spec.noiseSeed

  const has = (kind: SurfaceSpec['features'][number]['kind']) =>
    spec.features.some((f) => f.kind === kind)
  const weightOf = (kind: SurfaceSpec['features'][number]['kind']) =>
    spec.features.find((f) => f.kind === kind)?.weight ?? 0

  const craterJitter = mulberry32(seed ^ 0x9e3779b9)

  for (let y = 0; y < height; y++) {
    const lat = (0.5 - (y + 0.5) / height) * Math.PI
    const cosLat = Math.cos(lat)
    const sinLat = Math.sin(lat)

    for (let x = 0; x < width; x++) {
      const lon = ((x + 0.5) / width) * Math.PI * 2
      const dirX = cosLat * Math.cos(lon)
      const dirY = sinLat
      const dirZ = cosLat * Math.sin(lon)

      let height01: number

      if (has('bands')) {
        // Latitudinal bands with turbulence — gas giants.
        const turbulence = fbm3(dirX * 2.2, dirY * 2.2, dirZ * 2.2, seed, 4) * 0.18
        const bands = Math.sin((sinLat + turbulence) * 26) * 0.5 + 0.5
        const detail = fbm3(dirX * 9, dirY * 9, dirZ * 9, seed + 7, 3) * 0.12
        height01 = Math.min(1, Math.max(0, bands * 0.82 + detail + 0.1))
      } else {
        const base = fbm3(dirX * 2.6, dirY * 2.6, dirZ * 2.6, seed, 5)
        let value = base * 0.5 + 0.5

        if (has('continents')) {
          // Sea level at 0.48: below is water, above is land.
          const detail = fbm3(dirX * 7, dirY * 7, dirZ * 7, seed + 3, 4) * 0.5 + 0.5
          value = value * 0.72 + detail * 0.28
          if (value < 0.46) value = 0.12 + (value / 0.46) * 0.16 // ocean floor
          else value = 0.52 + ((value - 0.46) / 0.54) * 0.48 // land
        }

        if (has('cracks')) {
          const crack = ridged3(dirX * 5, dirY * 5, dirZ * 5, seed + 11, 4)
          value = value * (1 - weightOf('cracks') * 0.35) + Math.pow(crack, 6) * 0.4
        }

        if (has('craters')) {
          const crater = ridged3(dirX * 7, dirY * 7, dirZ * 7, seed + 21, 4)
          const pit = craterJitter() * 0.0001
          value = value * 0.75 + Math.pow(crater, 3) * 0.25 + pit
        }

        if (has('icecaps')) {
          const capLat = Math.abs(sinLat)
          if (capLat > 0.86) {
            const blend = Math.min(1, (capLat - 0.86) / 0.1)
            value = value * (1 - blend * weightOf('icecaps')) + blend * weightOf('icecaps')
          }
        }
        height01 = Math.min(1, Math.max(0, value))
      }

      heights[y * width + x] = height01
      const [r, g, b] = rampColor(ramp, height01)
      const i = (y * width + x) * 4
      rgba[i] = r
      rgba[i + 1] = g
      rgba[i + 2] = b
      rgba[i + 3] = 255
    }
  }

  return { width, height, rgba, heights }
}

/** Cheap FNV-1a over the bake — used by the determinism test and the manifest. */
export function hashSurface(bake: SurfaceBake): string {
  let h = 0x811c9dc5
  for (let i = 0; i < bake.rgba.length; i++) {
    h ^= bake.rgba[i]
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/** Displacement in metres for the quad-sphere, sampled from the bake. */
export function displacementSampler(
  bake: SurfaceBake,
  amplitudeM: number,
): (dir: [number, number, number]) => number {
  return (dir) => {
    const lat = Math.asin(Math.max(-1, Math.min(1, dir[1])))
    const lon = Math.atan2(dir[2], dir[0])
    const u = (lon / (Math.PI * 2) + 0.5) % 1
    const v = 0.5 - lat / Math.PI
    const x = Math.min(bake.width - 1, Math.floor(u * bake.width))
    const y = Math.min(bake.height - 1, Math.floor(v * bake.height))
    return (bake.heights[y * bake.width + x] - 0.5) * amplitudeM
  }
}
