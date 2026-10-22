import type { Vec3 } from './math'

/** The authored system, as data. PRD §7 contract #1. */

export type BodyKind = 'rock' | 'ocean' | 'gas' | 'ice' | 'comet'

export type OrbitSpec =
  | {
      kind: 'circular'
      radiusKm: number
      periodS: number
      phaseRad: number
      inclinationRad: number
    }
  | {
      kind: 'elliptical'
      periapsisKm: number
      apoapsisKm: number
      periodS: number
      phaseRad: number
      inclinationRad: number
    }

export type SurfaceSpec = {
  /** [width, height] of the equirectangular bake. */
  mapResolution: [number, number]
  noiseSeed: number
  /** Authored colour stops, low elevation → high elevation. Hex strings. */
  colorRamp: string[]
  features: Array<{
    kind: 'craters' | 'bands' | 'continents' | 'cracks' | 'icecaps'
    weight: number
  }>
  emissive?: { kind: 'lava' | 'none'; intensity: number }
}

export type AtmosphereSpec = { heightKm: number; colorK: number; density: number }
export type RingsSpec = { innerKm: number; outerKm: number; densityMap: string }

export type BodySpec = {
  id: string
  name: string
  kind: BodyKind
  radiusKm: number
  /** null = orbits the star. */
  parentId: string | null
  orbit: OrbitSpec
  rotationPeriodS: number
  axialTiltRad: number
  tidalLock: boolean
  surface: SurfaceSpec
  atmosphere?: AtmosphereSpec
  rings?: RingsSpec
}

export type StarSpec = {
  name: string
  spectralClass: string
  radiusKm: number
  colorK: number
  luminosity: number
  coronaScale: number
}

export type BeltSpec = {
  innerRadiusKm: number
  outerRadiusKm: number
  count: number
  thicknessKm: number
  seed: number
}

export type StationSpec = {
  id: string
  name: string
  orbit: OrbitSpec
  sizeM: number
}

export type SystemSpec = {
  id: string
  name: string
  seed: number
  star: StarSpec
  bodies: BodySpec[]
  belt?: BeltSpec
  station?: StationSpec
  playfieldRadiusKm: number
  /** Sim seconds per real second. 1 = real time. */
  simClockRate: number
}

/** Ephemeris output before any camera-dependent work (LOD, distance). */
export type BodyState = {
  bodyId: string
  worldPosKm: Vec3
  radiusKm: number
}

/** Per-frame, camera-aware body state. PRD §7 contract #2. */
export type BodyInstance = {
  bodyId: string
  worldPosKm: Vec3
  radiusKm: number
  distanceToCameraKm: number
  lodLevel: 0 | 1 | 2 | 3
  sunAngleRad: number
}
