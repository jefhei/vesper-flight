import type { BodySpec, OrbitSpec, SystemSpec } from '../../types/world'

const MIN_RAMP_STOPS = 4
/** Siblings closer than this fraction of the larger orbit are "the same ring". */
const MIN_ORBIT_SEPARATION = 0.02

function orbitRadiusKm(orbit: OrbitSpec): number {
  return orbit.kind === 'circular' ? orbit.radiusKm : orbit.periapsisKm
}

/** Returns a list of human-readable problems. Empty array = valid. */
export function validateSystemSpec(spec: SystemSpec): string[] {
  const errors: string[] = []
  const byId = new Map<string, BodySpec>(spec.bodies.map((b) => [b.id, b]))

  if (!(spec.star.radiusKm > 0)) errors.push('star.radiusKm must be > 0')
  if (!(spec.playfieldRadiusKm > spec.star.radiusKm)) {
    errors.push('playfieldRadiusKm must exceed the star radius')
  }
  if (!(spec.simClockRate > 0)) errors.push('simClockRate must be > 0')
  if (byId.size !== spec.bodies.length) errors.push('duplicate body id')

  for (const body of spec.bodies) {
    if (!(body.radiusKm > 0)) errors.push(`${body.id}: radiusKm must be > 0`)
    if (body.surface.colorRamp.length < MIN_RAMP_STOPS) {
      errors.push(`${body.id}: colorRamp needs at least ${MIN_RAMP_STOPS} stops`)
    }
    if (body.surface.mapResolution[0] < 8 || body.surface.mapResolution[1] < 4) {
      errors.push(`${body.id}: mapResolution too small`)
    }

    const orbitR = orbitRadiusKm(body.orbit)
    if (!(orbitR > 0)) errors.push(`${body.id}: orbit radius must be > 0`)

    if (body.orbit.kind === 'elliptical') {
      if (!(body.orbit.apoapsisKm > body.orbit.periapsisKm)) {
        errors.push(`${body.id}: apoapsis must exceed periapsis`)
      }
      if (body.orbit.periapsisKm <= spec.star.radiusKm) {
        errors.push(`${body.id}: periapsis is inside the star`)
      }
    }

    if (body.parentId) {
      const parent = byId.get(body.parentId)
      if (!parent) {
        errors.push(`${body.id}: parentId ${body.parentId} does not exist`)
      } else if (orbitR <= parent.radiusKm * 1.5) {
        errors.push(
          `${body.id}: orbit radius ${orbitR} km is at/inside parent ${parent.id} (${parent.radiusKm} km)`,
        )
      }
    } else if (orbitR - body.radiusKm <= spec.star.radiusKm) {
      errors.push(`${body.id}: body intersects the star at periapsis`)
    }

    if (orbitR + body.radiusKm > spec.playfieldRadiusKm) {
      errors.push(`${body.id}: body extends beyond the playfield`)
    }
  }

  // Sibling orbits must be distinguishable rings.
  const groups = new Map<string, BodySpec[]>()
  for (const body of spec.bodies) {
    const key = body.parentId ?? 'star'
    groups.set(key, [...(groups.get(key) ?? []), body])
  }
  for (const [parent, siblings] of groups) {
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        const r1 = orbitRadiusKm(siblings[i].orbit)
        const r2 = orbitRadiusKm(siblings[j].orbit)
        const gap = Math.abs(r1 - r2) / Math.max(r1, r2)
        if (gap < MIN_ORBIT_SEPARATION) {
          errors.push(
            `${parent}: ${siblings[i].id} and ${siblings[j].id} share an orbit ring (gap ${(gap * 100).toFixed(2)}%)`,
          )
        }
      }
    }
  }

  if (spec.belt) {
    if (!(spec.belt.outerRadiusKm > spec.belt.innerRadiusKm)) {
      errors.push('belt: outerRadiusKm must exceed innerRadiusKm')
    }
    if (!(spec.belt.count > 0)) errors.push('belt: count must be > 0')
    if (!(spec.belt.thicknessKm >= 0)) errors.push('belt: thicknessKm must be >= 0')
  }

  if (spec.station) {
    const r = orbitRadiusKm(spec.station.orbit)
    if (!(r > 0 && r < spec.playfieldRadiusKm)) {
      errors.push('station: orbit is outside the playfield')
    }
  }

  return errors
}
