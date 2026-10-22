import type { BodySpec, BodyState, OrbitSpec, SystemSpec } from '../../types/world'
import type { Vec3 } from '../../types/math'

const TWO_PI = Math.PI * 2

/** Newton solve of Kepler's equation. Deterministic: same input → same bits. */
export function eccentricAnomaly(meanAnomaly: number, eccentricity: number): number {
  const M = ((meanAnomaly % TWO_PI) + TWO_PI) % TWO_PI
  let E = eccentricity < 0.8 ? M : Math.PI
  for (let i = 0; i < 12; i++) {
    const f = E - eccentricity * Math.sin(E) - M
    const fp = 1 - eccentricity * Math.cos(E)
    const next = E - f / fp
    if (Math.abs(next - E) < 1e-12) return next
    E = next
  }
  return E
}

/** Closed-form orbital position in the system frame (km, y = orbital normal). */
export function orbitalPositionKm(orbit: OrbitSpec, tS: number): Vec3 {
  let x: number
  let z: number

  if (orbit.kind === 'circular') {
    const angle = orbit.phaseRad + (TWO_PI * tS) / orbit.periodS
    x = orbit.radiusKm * Math.cos(angle)
    z = orbit.radiusKm * Math.sin(angle)
  } else {
    const a = (orbit.periapsisKm + orbit.apoapsisKm) / 2
    const e = (orbit.apoapsisKm - orbit.periapsisKm) / (orbit.apoapsisKm + orbit.periapsisKm)
    const M = orbit.phaseRad + (TWO_PI * tS) / orbit.periodS
    const E = eccentricAnomaly(M, e)
    const trueAnomaly =
      2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2))
    const r = a * (1 - e * Math.cos(E))
    x = r * Math.cos(trueAnomaly)
    z = r * Math.sin(trueAnomaly)
  }

  const inc = orbit.inclinationRad
  return [x, z * Math.sin(inc), z * Math.cos(inc)]
}

function bodyById(spec: SystemSpec): Map<string, BodySpec> {
  return new Map(spec.bodies.map((b) => [b.id, b]))
}

/** World position of one body at sim time t, resolving the parent chain. */
export function bodyPositionKm(
  bodyId: string,
  spec: SystemSpec,
  tS: number,
  byId?: Map<string, BodySpec>,
  depth = 0,
): Vec3 {
  if (depth > 8) return [0, 0, 0]
  const index = byId ?? bodyById(spec)
  const body = index.get(bodyId)
  if (!body) return [0, 0, 0]
  const local = orbitalPositionKm(body.orbit, tS)
  if (!body.parentId) return local
  const parent = bodyPositionKm(body.parentId, spec, tS, index, depth + 1)
  return [parent[0] + local[0], parent[1] + local[1], parent[2] + local[2]]
}

/** Every body's instantaneous state. Pure function of (spec, t). */
export function bodyStatesAt(spec: SystemSpec, tS: number): BodyState[] {
  const index = bodyById(spec)
  return spec.bodies.map((b) => ({
    bodyId: b.id,
    worldPosKm: bodyPositionKm(b.id, spec, tS, index),
    radiusKm: b.radiusKm,
  }))
}

export function stationPositionKm(spec: SystemSpec, tS: number): Vec3 | null {
  return spec.station ? orbitalPositionKm(spec.station.orbit, tS) : null
}
