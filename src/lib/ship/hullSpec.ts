import type { Vec3 } from '../../types/math'
import { octagonProfile, type Profile2 } from './primitives'

/** The authored Hound-class exterior, as data.
 *
 *  Conventions: metres, -Z is FORWARD (the nose), +Y is up, origin at the
 *  centre of the hull. The interior project's decks stack along this same axis,
 *  nose deck first — that is what makes the two models the same ship.
 *
 *  The structure is extruded octagonal profiles, not boxes: a hull meets its
 *  faces at a bevel, and the bevel is what catches light and gives a silhouette
 *  edges instead of corners.
 */

export type PartKind = 'box' | 'wedge' | 'cylinder' | 'prism'
export type PartGroup = 'hull' | 'radiator' | 'light'

export type HullPart = {
  id: string
  kind: PartKind
  group: PartGroup
  /** box/wedge: [width, height, length]; cylinder: [radius, height, radius];
   *  prism: [profile width, profile height, length]. */
  size: [number, number, number]
  pos: Vec3
  rot?: Vec3
  /** sRGB hex. */
  color: string
  /** prism only: the cross-section to extrude. */
  profile?: Profile2
  /** prism only: ring scale at -Z and +Z. */
  frontScale?: number
  backScale?: number
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
const PLATE_MID = '#858c95'
const NAVY = '#33404f'
const METAL = '#585d61'
const METAL_DARK = '#43474a'
const HEAT = '#6e6153'
const HEAT_SHIELD = '#4a4238'
const HAZARD_Y = '#c8a13a'
const HAZARD_K = '#221f1b'
const PATCH = '#767061'
const PANEL = '#2e2d2b'
const LIGHT_R = '#ff4d4d'
const LIGHT_G = '#5dff8a'
const LIGHT_W = '#ffe9c9'
const LIGHT_A = '#ffb066'

const OCT_BODY = octagonProfile(14, 10, 0.24)
const OCT_NOSE = octagonProfile(11, 8, 0.26)
const OCT_TIP = octagonProfile(6.6, 5.4, 0.3)
const OCT_BRIDGE = octagonProfile(8.4, 3.4, 0.28)
const OCT_HOUSING = octagonProfile(2.6, 1.6, 0.3)

/** One radiator wing: a broad plate split into three segments along the ship
 *  axis, on a boom, with a header pipe and a tip rail. A wing is an ARRAY —
 *  the first pass put the three panels side by side across the wing and the
 *  result read as a stack of blades. */
type WingSpec = {
  id: string
  axis: 'x' | 'y'
  /** Sign along the axis. */
  sign: 1 | -1
  /** Distance from hull centreline to the inboard edge of the wing. */
  root: number
  /** Cant, radians. */
  tilt: number
}

const RADIATOR_WINGS: WingSpec[] = [
  { id: 'port', axis: 'x', sign: -1, root: 8.5, tilt: 0.3 },
  { id: 'stbd', axis: 'x', sign: 1, root: 8.5, tilt: -0.3 },
  { id: 'dorsal', axis: 'y', sign: 1, root: 6.6, tilt: 0.3 },
  { id: 'ventral', axis: 'y', sign: -1, root: 6.6, tilt: -0.3 },
]

/** Z centres of the three segments, aft of midships. */
const WING_SEGMENTS_Z = [4.2, 7.1, 10.0]
const SEG_LENGTH = 2.7
const WING_SPAN_X = 3.6
const WING_HEIGHT_Y = 3.2
const PANEL_THICKNESS = 0.3

function wingParts(wing: WingSpec): HullPart[] {
  const { id, axis, sign, root, tilt } = wing
  const parts: HullPart[] = []
  const along: 'x' | 'y' = axis

  const panelSize: [number, number, number] =
    axis === 'x'
      ? [PANEL_THICKNESS, WING_HEIGHT_Y, SEG_LENGTH]
      : [WING_SPAN_X, PANEL_THICKNESS, SEG_LENGTH]
  const panelPos = (z: number): Vec3 =>
    axis === 'x' ? [sign * (root + PANEL_THICKNESS / 2), 0, z] : [0, sign * (root + PANEL_THICKNESS / 2), z]
  const panelRot: Vec3 = axis === 'x' ? [0, 0, tilt] : [tilt, 0, 0]

  WING_SEGMENTS_Z.forEach((z, i) => {
    parts.push({
      id: `rad-${id}-${i}`,
      kind: 'box',
      group: 'radiator',
      size: panelSize,
      pos: panelPos(z),
      rot: panelRot,
      color: PANEL,
    })
    if (i < WING_SEGMENTS_Z.length - 1) {
      const ribZ = (WING_SEGMENTS_Z[i] + WING_SEGMENTS_Z[i + 1]) / 2
      parts.push({
        id: `radrib-${id}-${i}`,
        kind: 'box',
        group: 'hull',
        size:
          axis === 'x'
            ? [0.34, WING_HEIGHT_Y + 0.2, 0.26]
            : [WING_SPAN_X + 0.2, 0.34, 0.26],
        pos: panelPos(ribZ),
        color: METAL_DARK,
      })
    }
  })

  // Boom from the hull surface out to the wing.
  const hullSurface = along === 'x' ? 7 : 5
  const boomLen = Math.max(0.6, root - hullSurface)
  parts.push({
    id: `boom-${id}`,
    kind: 'box',
    group: 'hull',
    size:
      axis === 'x'
        ? [boomLen, 0.5, 0.5]
        : [0.5, boomLen, 0.5],
    pos:
      axis === 'x'
        ? [sign * (hullSurface + boomLen / 2), 0, 7.4]
        : [0, sign * (hullSurface + boomLen / 2), 7.4],
    color: METAL,
  })

  // Header pipe runs the length of the array at the inboard edge.
  parts.push({
    id: `radhdr-${id}`,
    kind: 'cylinder',
    group: 'hull',
    size: [0.22, 8.6, 0.22],
    pos: axis === 'x' ? [sign * (root - 0.2), -WING_HEIGHT_Y / 2 - 0.2, 7.1] : [sign * -WING_SPAN_X / 2 - 0.2, sign * (root - 0.2), 7.1],
    rot: [Math.PI / 2, 0, 0],
    color: METAL_DARK,
    openEnded: true,
  })

  // Tip rail closes the outboard edge.
  parts.push({
    id: `radrail-${id}`,
    kind: 'box',
    group: 'hull',
    size:
      axis === 'x'
        ? [0.26, WING_HEIGHT_Y + 0.25, 8.6]
        : [WING_SPAN_X + 0.25, 0.26, 8.6],
    pos:
      axis === 'x'
        ? [sign * (root + PANEL_THICKNESS + 0.13), 0, 7.1]
        : [0, sign * (root + PANEL_THICKNESS + 0.13), 7.1],
    color: METAL_DARK,
  })

  return parts
}

/** Roughly 45 m nose-to-nozzle. z: -22.5 (nose) → +22.5 (nozzle lip). */
export const HULL_PARTS: HullPart[] = [
  // --- primary structure: a three-segment tapered nose, then the body ------
  // Tip: small octagon, tapering back to the nose shoulder.
  {
    id: 'nose-tip',
    kind: 'prism',
    group: 'hull',
    size: [6.6, 5.4, 3.6],
    profile: OCT_TIP,
    frontScale: 0.42,
    backScale: 1,
    pos: [0, 0, -20.7],
    color: PLATE,
  },
  // Nose shoulder: widens from the tip to the body section.
  {
    id: 'nose-shoulder',
    kind: 'prism',
    group: 'hull',
    size: [11, 8, 5.4],
    profile: OCT_NOSE,
    frontScale: 0.6,
    backScale: 1,
    pos: [0, 0, -16.2],
    color: PLATE,
  },
  // Bridge cap sits proud of the nose shoulder: the ship's "head".
  {
    id: 'bridge-cap',
    kind: 'prism',
    group: 'hull',
    size: [8.4, 3.4, 4.4],
    profile: OCT_BRIDGE,
    frontScale: 0.82,
    backScale: 1,
    pos: [0, 3.5, -15.6],
    color: PLATE_MID,
  },
  { id: 'bridge-visor', kind: 'box', group: 'hull', size: [7.6, 0.32, 2.6], pos: [0, 4.7, -17.6], rot: [0.62, 0, 0], color: PLATE_DARK },
  { id: 'bridge-viewport', kind: 'box', group: 'hull', size: [6.2, 0.44, 0.18], pos: [0, 5.0, -18.5], rot: [0.62, 0, 0], color: HAZARD_K },
  { id: 'bridge-chin', kind: 'box', group: 'hull', size: [5.4, 0.4, 2.2], pos: [0, 2.0, -18.3], rot: [-0.5, 0, 0], color: PLATE_DARK },
  // Main body: the full octagonal section.
  {
    id: 'main-body',
    kind: 'prism',
    group: 'hull',
    size: [14, 10, 25],
    profile: OCT_BODY,
    frontScale: 1,
    backScale: 1,
    pos: [0, 0, -1],
    color: PLATE,
  },
  // Aft taper into the drive collar.
  {
    id: 'aft-taper',
    kind: 'prism',
    group: 'hull',
    size: [14, 10, 5],
    profile: OCT_BODY,
    frontScale: 1,
    backScale: 0.78,
    pos: [0, 0, 14],
    color: PLATE_DARK,
  },

  // --- drive: collar, ribbed bell, lip, shield tiles ----------------------
  { id: 'drive-collar', kind: 'cylinder', group: 'hull', size: [5.6, 1.4, 5.6], pos: [0, 0, 17.2], rot: [Math.PI / 2, 0, 0], color: METAL, openEnded: true },
  { id: 'drive-bell', kind: 'cylinder', group: 'hull', size: [5.0, 5.2, 6.6], pos: [0, 0, 20.4], rot: [Math.PI / 2, 0, 0], color: HEAT, radiusTopRatio: 0.74, openEnded: true },
  { id: 'bell-rib-0', kind: 'cylinder', group: 'hull', size: [5.35, 0.34, 5.35], pos: [0, 0, 18.4], rot: [Math.PI / 2, 0, 0], color: METAL_DARK, openEnded: true },
  { id: 'bell-rib-1', kind: 'cylinder', group: 'hull', size: [5.85, 0.34, 5.85], pos: [0, 0, 20.0], rot: [Math.PI / 2, 0, 0], color: METAL_DARK, openEnded: true },
  { id: 'bell-rib-2', kind: 'cylinder', group: 'hull', size: [6.35, 0.34, 6.35], pos: [0, 0, 21.6], rot: [Math.PI / 2, 0, 0], color: METAL_DARK, openEnded: true },
  { id: 'nozzle-lip', kind: 'cylinder', group: 'hull', size: [6.9, 0.9, 6.9], pos: [0, 0, 22.3], rot: [Math.PI / 2, 0, 0], color: METAL, openEnded: true },
  ...[0, 1, 2, 3, 4, 5].flatMap((i): HullPart[] => {
    const a = (i / 6) * Math.PI * 2
    return [
      {
        id: `shield-tile-${i}`,
        kind: 'box',
        group: 'hull',
        size: [1.5, 0.22, 2.4],
        pos: [Math.cos(a) * 5.9, Math.sin(a) * 5.9, 16.4],
        rot: [0, 0, a],
        color: HEAT_SHIELD,
      },
    ]
  }),

  // --- dorsal spine, hatches, dock ----------------------------------------
  { id: 'spine', kind: 'box', group: 'hull', size: [5.6, 1.0, 20], pos: [0, 5.35, -1], color: PLATE_DARK },
  { id: 'keel-fin', kind: 'prism', group: 'hull', size: [0.9, 3.2, 13], profile: octagonProfile(0.9, 3.2, 0.4), frontScale: 0.6, backScale: 1, pos: [0, -6.3, 4], color: PLATE_DARK },
  { id: 'tank-a', kind: 'cylinder', group: 'hull', size: [1.45, 5.6, 1.45], pos: [-2.3, 6.8, 6.4], rot: [Math.PI / 2, 0, 0], color: METAL },
  { id: 'tank-b', kind: 'cylinder', group: 'hull', size: [1.45, 5.6, 1.45], pos: [2.3, 6.8, 6.4], rot: [Math.PI / 2, 0, 0], color: METAL },
  { id: 'tank-saddle-a', kind: 'box', group: 'hull', size: [3.2, 0.4, 1.0], pos: [-2.3, 6.15, 4.6], color: METAL_DARK },
  { id: 'tank-saddle-b', kind: 'box', group: 'hull', size: [3.2, 0.4, 1.0], pos: [2.3, 6.15, 4.6], color: METAL_DARK },
  { id: 'hatch-fwd', kind: 'box', group: 'hull', size: [3.8, 0.42, 3.8], pos: [0, 6.1, -7], color: METAL },
  { id: 'hatch-aft', kind: 'box', group: 'hull', size: [3.8, 0.42, 3.8], pos: [0, 6.1, 1.4], color: METAL },
  { id: 'hatch-fwd-stripe', kind: 'box', group: 'hull', size: [3.0, 0.08, 0.24], pos: [0, 6.34, -8.5], color: HAZARD_Y },
  { id: 'hatch-aft-stripe', kind: 'box', group: 'hull', size: [3.0, 0.08, 0.24], pos: [0, 6.34, 2.9], color: HAZARD_Y },
  { id: 'nameplate-backing', kind: 'box', group: 'hull', size: [5.9, 0.06, 1.3], pos: [0, 5.98, 4.4], color: HAZARD_K },
  { id: 'nameplate-frame-top', kind: 'box', group: 'hull', size: [5.9, 0.12, 0.12], pos: [0, 6.02, 3.7], color: METAL },
  { id: 'nameplate-frame-bot', kind: 'box', group: 'hull', size: [5.9, 0.12, 0.12], pos: [0, 6.02, 5.1], color: METAL },
  { id: 'dock-ring', kind: 'cylinder', group: 'hull', size: [2.3, 0.9, 2.3], pos: [-7.2, 1.1, -4], rot: [0, 0, Math.PI / 2], color: METAL, openEnded: true },
  { id: 'dock-collar', kind: 'cylinder', group: 'hull', size: [2.85, 0.32, 2.85], pos: [-6.95, 1.1, -4], rot: [0, 0, Math.PI / 2], color: PLATE_DARK, openEnded: true },
  { id: 'dock-lamp-a', kind: 'box', group: 'hull', size: [0.3, 0.3, 0.3], pos: [-7.25, 3.0, -4], color: LIGHT_A },
  { id: 'dock-lamp-b', kind: 'box', group: 'hull', size: [0.3, 0.3, 0.3], pos: [-7.25, -0.8, -4], color: LIGHT_A },

  // --- wear: bands, patches, hazard marks ---------------------------------
  { id: 'band-fwd', kind: 'box', group: 'hull', size: [14.1, 0.42, 0.42], pos: [0, 2.2, -11.5], color: NAVY },
  { id: 'band-aft', kind: 'box', group: 'hull', size: [14.1, 0.3, 0.3], pos: [0, -2.4, 6.5], color: NAVY },
  { id: 'patch-repair', kind: 'box', group: 'hull', size: [0.1, 2.8, 3.8], pos: [7.06, 1.0, 3.2], color: PATCH },
  { id: 'patch-repair-2', kind: 'box', group: 'hull', size: [0.1, 1.4, 1.7], pos: [-7.06, -2.2, -6.8], color: PATCH },
  { id: 'hazard-nose-a', kind: 'box', group: 'hull', size: [3.2, 0.3, 0.1], pos: [0, 1.6, -22.42], color: HAZARD_Y },
  { id: 'hazard-nose-b', kind: 'box', group: 'hull', size: [0.3, 2.6, 0.1], pos: [-1.6, 0, -22.42], color: HAZARD_K },
  { id: 'hazard-nose-c', kind: 'box', group: 'hull', size: [0.3, 2.6, 0.1], pos: [1.6, 0, -22.42], color: HAZARD_K },

  // --- greebles: conduits, service boxes, vents, masts, winches -----------
  { id: 'conduit-a', kind: 'box', group: 'hull', size: [0.2, 0.2, 17], pos: [3.4, 5.1, -2], color: METAL },
  { id: 'conduit-b', kind: 'box', group: 'hull', size: [0.2, 0.2, 17], pos: [-3.4, 5.1, -2], color: METAL },
  { id: 'conduit-c', kind: 'box', group: 'hull', size: [0.16, 0.16, 12], pos: [6.9, 3.2, 2], color: METAL_DARK },
  { id: 'service-1', kind: 'box', group: 'hull', size: [1.5, 1.0, 2.2], pos: [6.0, -2.8, -8], color: PLATE_DARK },
  { id: 'service-2', kind: 'box', group: 'hull', size: [1.1, 0.85, 1.5], pos: [-6.1, 2.7, 5.2], color: PLATE_DARK },
  { id: 'service-3', kind: 'box', group: 'hull', size: [0.9, 0.7, 1.2], pos: [-6.2, -2.4, -10.5], color: PLATE_DARK },
  { id: 'vent-a', kind: 'box', group: 'hull', size: [2.2, 0.16, 1.1], pos: [0, -5.1, -2], color: HAZARD_K },
  { id: 'vent-b', kind: 'box', group: 'hull', size: [2.2, 0.16, 1.1], pos: [0, -5.1, 2], color: HAZARD_K },
  { id: 'mast-a', kind: 'box', group: 'hull', size: [0.12, 3.4, 0.12], pos: [0, 7.4, -13.4], color: METAL },
  { id: 'mast-a-tip', kind: 'box', group: 'hull', size: [0.3, 0.3, 0.3], pos: [0, 9.1, -13.4], color: LIGHT_W },
  { id: 'mast-b', kind: 'box', group: 'hull', size: [0.1, 2.2, 0.1], pos: [-4.4, 6.6, -12.2], color: METAL },
  { id: 'sensor-dome-a', kind: 'cylinder', group: 'hull', size: [0.9, 0.5, 0.9], pos: [-2.6, 5.5, -13.2], color: PLATE_MID },
  { id: 'sensor-dome-b', kind: 'cylinder', group: 'hull', size: [0.6, 0.4, 0.6], pos: [2.7, 5.4, -13.6], color: PLATE_MID },
  { id: 'winch-a', kind: 'cylinder', group: 'hull', size: [0.55, 1.4, 0.55], pos: [2.0, 5.9, 9.6], rot: [0, 0, Math.PI / 2], color: METAL_DARK },
  { id: 'crane-arm', kind: 'box', group: 'hull', size: [0.35, 0.35, 5.4], pos: [-2.2, 6.1, 10.5], color: METAL },
  { id: 'crane-tip', kind: 'box', group: 'hull', size: [1.0, 0.7, 0.9], pos: [-2.2, 5.9, 13.0], color: PLATE_DARK },
  { id: 'housing-a', kind: 'prism', group: 'hull', size: [2.6, 1.6, 3.4], profile: OCT_HOUSING, frontScale: 0.7, backScale: 1, pos: [5.6, 3.6, -5.5], color: PLATE_DARK },
  { id: 'housing-b', kind: 'prism', group: 'hull', size: [2.6, 1.6, 3.4], profile: OCT_HOUSING, frontScale: 0.7, backScale: 1, pos: [-5.6, 3.6, -5.5], color: PLATE_DARK },
  // Panel seams on the flat flanks (the octagon leaves a flat side plane at ±7).
  ...[0, 1, 2, 3, 4].flatMap((i): HullPart[] => {
    const z = -8 + i * 3.8
    return [
      { id: `seam-port-${i}`, kind: 'box', group: 'hull', size: [0.06, 8.2, 0.14], pos: [-7.02, 0, z], color: PLATE_DARK },
      { id: `seam-stbd-${i}`, kind: 'box', group: 'hull', size: [0.06, 8.2, 0.14], pos: [7.02, 0, z], color: PLATE_DARK },
      { id: `seam-dorsal-${i}`, kind: 'box', group: 'hull', size: [10.2, 0.06, 0.14], pos: [0, 4.98, z], color: PLATE_DARK },
    ]
  }),

  // --- RCS quads: 12 thrusters, three per corner, each with a nozzle ------
  ...[
    [-1, 1, -1],
    [1, 1, -1],
    [-1, -1, -1],
    [1, -1, -1],
  ].flatMap(([sx, sy, sz], corner): HullPart[] => {
    const x = sx * 6.5
    const y = sy * 4.4
    const z = sz * 9.5
    const id = `rcs-${corner}`
    return [
      { id: `${id}-x`, kind: 'box', group: 'hull', size: [0.85, 0.7, 0.7], pos: [x, y, z], color: METAL },
      { id: `${id}-x-nozzle`, kind: 'cylinder', group: 'hull', size: [0.26, 0.34, 0.16], pos: [x + sx * 0.5, y, z], rot: [0, 0, (Math.PI / 2) * sx], color: METAL_DARK, openEnded: true },
      { id: `${id}-y`, kind: 'box', group: 'hull', size: [0.7, 0.85, 0.7], pos: [x - sx * 0.35, y + sy * 0.35, z], color: METAL },
      { id: `${id}-y-nozzle`, kind: 'cylinder', group: 'hull', size: [0.26, 0.34, 0.16], pos: [x - sx * 0.35, y + sy * 0.55, z], rot: [0, 0, 0], color: METAL_DARK, openEnded: true },
      { id: `${id}-z`, kind: 'box', group: 'hull', size: [0.7, 0.7, 0.85], pos: [x - sx * 0.35, y, z - sz * 0.4], color: METAL },
    ]
  }),

  // --- radiators: four wings, three panels each --------------------------
  ...RADIATOR_WINGS.flatMap(wingParts),
  { id: 'nozzle-glow', kind: 'cylinder', group: 'radiator', size: [3.4, 0.5, 3.4], pos: [0, 0, 21.1], rot: [Math.PI / 2, 0, 0], color: '#170a04' },

  // --- running lights -----------------------------------------------------
  { id: 'light-port', kind: 'box', group: 'light', size: [0.3, 0.3, 0.3], pos: [-7.05, 2.4, -9], color: LIGHT_R },
  { id: 'light-stbd', kind: 'box', group: 'light', size: [0.3, 0.3, 0.3], pos: [7.05, 2.4, -9], color: LIGHT_G },
  { id: 'light-mast', kind: 'box', group: 'light', size: [0.26, 0.26, 0.26], pos: [0, 9.25, -13.4], color: LIGHT_W },
  { id: 'light-dock-a', kind: 'box', group: 'light', size: [0.26, 0.26, 0.26], pos: [-7.3, 2.95, -4], color: LIGHT_A },
  { id: 'light-dock-b', kind: 'box', group: 'light', size: [0.26, 0.26, 0.26], pos: [-7.3, -0.75, -4], color: LIGHT_A },
  { id: 'light-spine-a', kind: 'box', group: 'light', size: [0.22, 0.22, 0.22], pos: [2.7, 5.95, 8.2], color: LIGHT_W },
  { id: 'light-spine-b', kind: 'box', group: 'light', size: [0.22, 0.22, 0.22], pos: [-2.7, 5.95, 8.2], color: LIGHT_W },
]

/** Landmarks a reviewer checks by eye (PRD §4). Positions are local metres. */
export const HULL_LANDMARKS = {
  nameplate: { pos: [0, 6.04, 4.4] as Vec3, size: [5.6, 1.1] as [number, number] },
  dockRing: { pos: [-7.2, 1.1, -4] as Vec3, radiusM: 2.3 },
  hatches: [
    { pos: [0, 6.1, -7] as Vec3, size: [3.8, 3.8] as [number, number] },
    { pos: [0, 6.1, 1.4] as Vec3, size: [3.8, 3.8] as [number, number] },
  ],
  /** Twelve panels, three per wing. */
  radiatorPanels: RADIATOR_WINGS.flatMap((w) => [0, 1, 2].map((i) => `rad-${w.id}-${i}`)),
  wingIds: RADIATOR_WINGS.map((w) => w.id),
  plumeExitZ: 22.3,
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
      const extent = p.kind === 'cylinder' ? (axis === 2 ? p.size[1] / 2 : half[axis]) : half[axis]
      min[axis] = Math.min(min[axis], p.pos[axis] - extent)
      max[axis] = Math.max(max[axis], p.pos[axis] + extent)
    }
  }
  return { min, max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] as Vec3 }
}
