import type { Vec3 } from '../../types/math'

/** The authored Hound-class exterior, as data.
 *
 *  Conventions: metres, -Z is FORWARD (the nose), +Y is up, origin at the
 *  centre of the hull. The interior project's decks stack along this same axis,
 *  nose deck first — that is what makes the two models the same ship.
 */

export type PartKind = 'box' | 'wedge' | 'cylinder'
export type PartGroup = 'hull' | 'radiator' | 'light'

export type HullPart = {
  id: string
  kind: PartKind
  group: PartGroup
  /** box/wedge: [width, height, length]; cylinder: [radius, height, radius] */
  size: [number, number, number]
  pos: Vec3
  rot?: Vec3
  /** sRGB hex. */
  color: string
  /** wedge only: cross-section at -Z relative to `size`. */
  taperFront?: [number, number]
  /** cylinder only: radius at +Y end, for cones/bells. */
  radiusTopRatio?: number
  /** cylinder only: leave the ends open (sleeves, bells) rather than capped. */
  openEnded?: boolean
}

export const HULL_LENGTH_M = 45
export const HULL_BEAM_M = 14

const PLATE = '#9aa1aa'
const PLATE_DARK = '#6d747d'
const NAVY = '#33404f'
const METAL = '#585d61'
const HEAT = '#6e6153'
const HAZARD_Y = '#c8a13a'
const HAZARD_K = '#221f1b'
const PATCH = '#767061'
const LIGHT_R = '#ff4d4d'
const LIGHT_G = '#5dff8a'
const LIGHT_W = '#ffe9c9'
const LIGHT_A = '#ffb066'

/** Roughly 45 m nose-to-nozzle. z: -22.5 (nose) → +22.5 (nozzle lip). */
export const HULL_PARTS: HullPart[] = [
  // --- primary structure ---------------------------------------------------
  {
    id: 'prow-wedge',
    kind: 'wedge',
    group: 'hull',
    // size = the BACK cross-section; taperFront = the nose face.
    size: [12, 8, 6],
    taperFront: [6.2, 5.4],
    pos: [0, 0, -19.5],
    color: PLATE,
  },
  { id: 'bridge-block', kind: 'box', group: 'hull', size: [10, 7, 4], pos: [0, 0.5, -14.5], color: PLATE },
  // Slanted visor plate over the bridge: gives the prow a "face" from outside,
  // and is the same sensor wall the interior's head deck looks at.
  { id: 'bridge-visor', kind: 'box', group: 'hull', size: [9.2, 0.35, 3.2], pos: [0, 3.2, -16.2], rot: [0.5, 0, 0], color: PLATE_DARK },
  { id: 'bridge-viewport', kind: 'box', group: 'hull', size: [7.4, 0.5, 0.2], pos: [0, 3.55, -17.5], rot: [0.5, 0, 0], color: HAZARD_K },
  { id: 'main-body', kind: 'box', group: 'hull', size: [14, 10, 24], pos: [0, 0, -0.5], color: PLATE },
  {
    id: 'aft-taper',
    kind: 'wedge',
    group: 'hull',
    size: [14, 10, 4.5],
    taperFront: [11, 9],
    pos: [0, 0, 13.75],
    color: PLATE_DARK,
  },
  { id: 'drive-collar', kind: 'cylinder', group: 'hull', size: [5.6, 1.5, 5.6], pos: [0, 0, 16.75], rot: [Math.PI / 2, 0, 0], color: METAL, openEnded: true },
  { id: 'drive-bell', kind: 'cylinder', group: 'hull', size: [5.0, 5, 6.6], pos: [0, 0, 20], rot: [Math.PI / 2, 0, 0], color: HEAT, radiusTopRatio: 0.76, openEnded: true },
  { id: 'nozzle-lip', kind: 'cylinder', group: 'hull', size: [6.8, 1, 6.8], pos: [0, 0, 22.4], rot: [Math.PI / 2, 0, 0], color: METAL, openEnded: true },

  // --- dorsal spine, hatches, dock ----------------------------------------
  { id: 'spine', kind: 'box', group: 'hull', size: [6, 1.1, 21], pos: [0, 5.5, -1], color: PLATE_DARK },
  // Keel fin: breaks the long box along the bottom, aft half only.
  { id: 'keel-fin', kind: 'box', group: 'hull', size: [0.5, 3.4, 14], pos: [0, -6.4, 4], color: PLATE_DARK },
  // Dorsal tankage aft — silhouette variety the interior can't show.
  { id: 'tank-a', kind: 'cylinder', group: 'hull', size: [1.5, 6, 1.5], pos: [-2.4, 6.9, 6.2], rot: [Math.PI / 2, 0, 0], color: METAL },
  { id: 'tank-b', kind: 'cylinder', group: 'hull', size: [1.5, 6, 1.5], pos: [2.4, 6.9, 6.2], rot: [Math.PI / 2, 0, 0], color: METAL },
  { id: 'hatch-fwd', kind: 'box', group: 'hull', size: [4, 0.45, 4], pos: [0, 6.25, -7], color: METAL },
  { id: 'hatch-aft', kind: 'box', group: 'hull', size: [4, 0.45, 4], pos: [0, 6.25, 2], color: METAL },
  { id: 'hatch-fwd-stripe', kind: 'box', group: 'hull', size: [3.2, 0.08, 0.25], pos: [0, 6.5, -8.6], color: HAZARD_Y },
  // Backing plate for the nameplate plane (drawn as part of the hull merge).
  { id: 'nameplate-backing', kind: 'box', group: 'hull', size: [5.9, 0.06, 1.35], pos: [0, 6.10, 4.6], color: HAZARD_K },
  { id: 'dock-ring', kind: 'cylinder', group: 'hull', size: [2.4, 0.9, 2.4], pos: [-7.1, 1.2, -3], rot: [0, 0, Math.PI / 2], color: METAL, openEnded: true },
  { id: 'dock-collar', kind: 'cylinder', group: 'hull', size: [2.9, 0.3, 2.9], pos: [-6.85, 1.2, -3], rot: [0, 0, Math.PI / 2], color: PLATE_DARK, openEnded: true },

  // --- wear: panel bands, patch, hazard marks ------------------------------
  { id: 'band-fwd', kind: 'box', group: 'hull', size: [14.06, 0.5, 0.5], pos: [0, 1.5, -11], color: NAVY },
  { id: 'band-aft', kind: 'box', group: 'hull', size: [14.06, 0.35, 0.35], pos: [0, -2.2, 6], color: NAVY },
  { id: 'patch-repair', kind: 'box', group: 'hull', size: [0.12, 3.2, 4.2], pos: [7.02, 1.1, 3.5], color: PATCH },
  { id: 'patch-repair-2', kind: 'box', group: 'hull', size: [0.12, 1.6, 1.8], pos: [-7.02, -2.4, -6.5], color: PATCH },
  { id: 'hazard-prow-a', kind: 'box', group: 'hull', size: [4.2, 0.34, 0.12], pos: [0, 2.55, -22.3], color: HAZARD_Y },
  { id: 'hazard-prow-b', kind: 'box', group: 'hull', size: [0.34, 3.6, 0.12], pos: [-2.4, 0.2, -22.3], color: HAZARD_K },
  { id: 'hazard-prow-c', kind: 'box', group: 'hull', size: [0.34, 3.6, 0.12], pos: [2.4, 0.2, -22.3], color: HAZARD_K },

  // --- greebles: conduit runs and service boxes ---------------------------
  { id: 'conduit-a', kind: 'box', group: 'hull', size: [0.22, 0.22, 18], pos: [4.6, 5.06, 0], color: METAL },
  { id: 'conduit-b', kind: 'box', group: 'hull', size: [0.22, 0.22, 18], pos: [-4.6, 5.06, 0], color: METAL },
  { id: 'service-1', kind: 'box', group: 'hull', size: [1.6, 1.1, 2.4], pos: [6.1, -2.6, -8], color: PLATE_DARK },
  { id: 'service-2', kind: 'box', group: 'hull', size: [1.2, 0.9, 1.6], pos: [-6.2, 2.9, 5.5], color: PLATE_DARK },
  { id: 'vent-a', kind: 'box', group: 'hull', size: [2.4, 0.18, 1.2], pos: [0, -5.08, -2], color: HAZARD_K },
  { id: 'vent-b', kind: 'box', group: 'hull', size: [2.4, 0.18, 1.2], pos: [0, -5.08, 2], color: HAZARD_K },
  // Panel seams: without these the flanks read as one flat cardboard box.
  ...[0, 1, 2, 3, 4].flatMap((i): HullPart[] => {
    const z = -9 + i * 4
    return [
      { id: `seam-port-${i}`, kind: 'box', group: 'hull', size: [0.07, 9.6, 0.16], pos: [-7.03, 0, z], color: PLATE_DARK },
      { id: `seam-stbd-${i}`, kind: 'box', group: 'hull', size: [0.07, 9.6, 0.16], pos: [7.03, 0, z], color: PLATE_DARK },
      { id: `seam-dorsal-${i}`, kind: 'box', group: 'hull', size: [13.4, 0.07, 0.16], pos: [0, 5.03, z], color: PLATE_DARK },
    ]
  }),

  // --- RCS quads: 12, three per corner ------------------------------------
  ...[
    [-1, 1, -1],
    [1, 1, -1],
    [-1, -1, -1],
    [1, -1, -1],
  ].flatMap(([sx, sy, sz], corner): HullPart[] => {
    const x = sx * 6.55
    const y = sy * 4.55
    const z = sz * 9.5
    const id = `rcs-${corner}`
    return [
      { id: `${id}-x`, kind: 'box', group: 'hull', size: [0.9, 0.75, 0.75], pos: [x, y, z], color: METAL },
      { id: `${id}-y`, kind: 'box', group: 'hull', size: [0.75, 0.9, 0.75], pos: [x - sx * 0.35, y + sy * 0.35, z], color: METAL },
      { id: `${id}-z`, kind: 'box', group: 'hull', size: [0.75, 0.75, 0.9], pos: [x - sx * 0.35, y, z - sz * 0.4], color: METAL },
    ]
  }),

  // --- radiators: four panels on booms ------------------------------------
  { id: 'boom-port', kind: 'box', group: 'hull', size: [2.6, 0.5, 0.5], pos: [-8.1, 0, 5], color: METAL },
  { id: 'boom-stbd', kind: 'box', group: 'hull', size: [2.6, 0.5, 0.5], pos: [8.1, 0, 5], color: METAL },
  { id: 'boom-dorsal', kind: 'box', group: 'hull', size: [0.5, 2.2, 0.5], pos: [0, 7.2, 5], color: METAL },
  { id: 'boom-ventral', kind: 'box', group: 'hull', size: [0.5, 2.2, 0.5], pos: [0, -7.2, 5], color: METAL },
  { id: 'rad-port', kind: 'box', group: 'radiator', size: [4.6, 0.16, 12], pos: [-11.2, 0, 5], rot: [0, 0, 0.16], color: '#2e2d2b' },
  { id: 'rad-stbd', kind: 'box', group: 'radiator', size: [4.6, 0.16, 12], pos: [11.2, 0, 5], rot: [0, 0, -0.16], color: '#2e2d2b' },
  { id: 'rad-dorsal', kind: 'box', group: 'radiator', size: [3.4, 0.16, 12], pos: [0, 9.2, 5], rot: [0.16, 0, 0], color: '#2e2d2b' },
  { id: 'rad-ventral', kind: 'box', group: 'radiator', size: [3.4, 0.16, 12], pos: [0, -9.2, 5], rot: [-0.16, 0, 0], color: '#2e2d2b' },
  // Nozzle throat: sits just inside the lip, so an open bell shows a glowing
  // throat instead of a black disc from astern.
  { id: 'nozzle-glow', kind: 'cylinder', group: 'radiator', size: [4.4, 0.5, 4.4], pos: [0, 0, 21.4], rot: [Math.PI / 2, 0, 0], color: '#2a1207' },

  // --- running lights ------------------------------------------------------
  { id: 'light-port', kind: 'box', group: 'light', size: [0.34, 0.34, 0.34], pos: [-7.04, 2.6, -9], color: LIGHT_R },
  { id: 'light-stbd', kind: 'box', group: 'light', size: [0.34, 0.34, 0.34], pos: [7.04, 2.6, -9], color: LIGHT_G },
  { id: 'light-mast', kind: 'box', group: 'light', size: [0.3, 0.3, 0.3], pos: [0, 6.1, -12], color: LIGHT_W },
  { id: 'light-dock-a', kind: 'box', group: 'light', size: [0.28, 0.28, 0.28], pos: [-7.1, 3.1, -3], color: LIGHT_A },
  { id: 'light-dock-b', kind: 'box', group: 'light', size: [0.28, 0.28, 0.28], pos: [-7.1, -0.7, -3], color: LIGHT_A },
  { id: 'light-spine-a', kind: 'box', group: 'light', size: [0.24, 0.24, 0.24], pos: [2.9, 6.1, 8], color: LIGHT_W },
  { id: 'light-spine-b', kind: 'box', group: 'light', size: [0.24, 0.24, 0.24], pos: [-2.9, 6.1, 8], color: LIGHT_W },
]

/** Landmarks a reviewer checks by eye (PRD §4). Positions are local metres. */
export const HULL_LANDMARKS = {
  nameplate: { pos: [0, 6.16, 4.6] as Vec3, size: [5.6, 1.15] as [number, number] },
  dockRing: { pos: [-7.1, 1.2, -3] as Vec3, radiusM: 2.4 },
  hatches: [
    { pos: [0, 6.25, -7] as Vec3, size: [4, 4] as [number, number] },
    { pos: [0, 6.25, 2] as Vec3, size: [4, 4] as [number, number] },
  ],
  radiatorPanels: ['rad-port', 'rad-stbd', 'rad-dorsal', 'rad-ventral'],
  plumeExitZ: 22.4,
} as const

export function partCountByGroup(parts: HullPart[] = HULL_PARTS): Record<PartGroup, number> {
  const counts: Record<PartGroup, number> = { hull: 0, radiator: 0, light: 0 }
  for (const p of parts) counts[p.group]++
  return counts
}

/** Axis-aligned bounds of the authored parts (ignoring rotation, which is small
 *  or axis-aligned for every part that matters to the silhouette). */
export function hullBounds(parts: HullPart[] = HULL_PARTS) {
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]
  for (const p of parts) {
    const half: Vec3 =
      p.kind === 'cylinder'
        ? [p.size[0], p.size[1] / 2, p.size[0]]
        : [p.size[0] / 2, p.size[1] / 2, p.size[2] / 2]
    for (let axis = 0; axis < 3; axis++) {
      // Cylinders are rotated onto Z by the builder; account for their length.
      const extent = p.kind === 'cylinder' ? (axis === 2 ? p.size[1] / 2 : half[axis]) : half[axis]
      min[axis] = Math.min(min[axis], p.pos[axis] - extent)
      max[axis] = Math.max(max[axis], p.pos[axis] + extent)
    }
  }
  return { min, max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] as Vec3 }
}
