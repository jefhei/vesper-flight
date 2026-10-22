/** LOD selection from altitude in parent radii, with hysteresis so a ship
 *  hovering on a boundary cannot flicker between levels. */

export type LodLevel = 0 | 1 | 2 | 3

/** Altitude (in body radii) at or below which each level applies. */
export const LOD_ALTITUDE_THRESHOLDS = [0.15, 0.6, 2.5] as const
export const LOD_HYSTERESIS = 0.12

function levelFromAltitude(altitudeRadii: number): LodLevel {
  if (altitudeRadii <= LOD_ALTITUDE_THRESHOLDS[0]) return 3
  if (altitudeRadii <= LOD_ALTITUDE_THRESHOLDS[1]) return 2
  if (altitudeRadii <= LOD_ALTITUDE_THRESHOLDS[2]) return 1
  return 0
}

export function altitudeRadii(
  distanceToCenterKm: number,
  radiusKm: number,
): number {
  if (!(radiusKm > 0)) return Number.POSITIVE_INFINITY
  return Math.max(0, (distanceToCenterKm - radiusKm) / radiusKm)
}

export function lodLevelFor(
  distanceToCenterKm: number,
  radiusKm: number,
  previous?: LodLevel,
): LodLevel {
  const alt = altitudeRadii(distanceToCenterKm, radiusKm)
  const candidate = levelFromAltitude(alt)
  if (previous === undefined || candidate === previous) return candidate
  if (candidate > previous) {
    // Upgrading: require the ship to be 12% INSIDE the boundary it must cross.
    const boundary = LOD_ALTITUDE_THRESHOLDS[candidate - 1]
    return alt <= boundary * (1 - LOD_HYSTERESIS) ? candidate : previous
  }
  // Downgrading: require the ship to be 12% OUTSIDE the boundary it must cross.
  const boundary = LOD_ALTITUDE_THRESHOLDS[previous - 1]
  return alt > boundary * (1 + LOD_HYSTERESIS) ? candidate : previous
}
