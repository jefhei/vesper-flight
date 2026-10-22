import type { Vec3 } from '../../types/math'
import { distance } from '../math/vec3'

/** Floating-origin bookkeeping. The camera always renders near zero; the world
 *  rebases under it when it drifts too far, because float32 in a GPU matrix
 *  only has so many bits (at 1e9 m the spacing is ~64 m — ship-sized). */

export type OriginState = { originKm: Vec3; rebaseSerial: number }

/** Rebase thresholds are SHIP-SCALE, not system-scale: float32 spacing at
 *  10,000 km is ~1 m, which is hull-sized. Keeping render space within a few
 *  kilometres of the camera puts sub-millimetre precision on the hull, and
 *  distant planets get metre-level error that is angularly invisible. */
export const DEFAULT_REBASE_THRESHOLD_KM = 8
export const DEFAULT_REBASE_GRID_KM = 1

export function createOrigin(): OriginState {
  return { originKm: [0, 0, 0], rebaseSerial: 0 }
}

export function updateOrigin(
  cameraWorldKm: Vec3,
  origin: OriginState,
  thresholdKm = DEFAULT_REBASE_THRESHOLD_KM,
  gridKm = DEFAULT_REBASE_GRID_KM,
): OriginState {
  if (distance(cameraWorldKm, origin.originKm) <= thresholdKm) return origin
  const snap = (v: number) => Math.round(v / gridKm) * gridKm
  return {
    originKm: [snap(cameraWorldKm[0]), snap(cameraWorldKm[1]), snap(cameraWorldKm[2])],
    rebaseSerial: origin.rebaseSerial + 1,
  }
}

/** world → render space (what actually reaches a float32 matrix). */
export function toRenderKm(worldKm: Vec3, origin: OriginState): Vec3 {
  return [
    worldKm[0] - origin.originKm[0],
    worldKm[1] - origin.originKm[1],
    worldKm[2] - origin.originKm[2],
  ]
}

/** render → world. Lossless in float64; the truth lives in world space. */
export function fromRenderKm(renderKm: Vec3, origin: OriginState): Vec3 {
  return [
    renderKm[0] + origin.originKm[0],
    renderKm[1] + origin.originKm[1],
    renderKm[2] + origin.originKm[2],
  ]
}

/** Peak float32 quantization of a render-space position, in metres. This is the
 *  number the precision spike exists to measure. */
export function float32ErrorM(renderKm: Vec3): number {
  let peak = 0
  for (const component of renderKm) {
    const metres = component * 1000
    const error = Math.abs(Math.fround(metres) - metres)
    if (error > peak) peak = error
  }
  return peak
}
