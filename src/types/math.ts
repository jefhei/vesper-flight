/** Tuple math types. Kept free of any three.js dependency so `src/lib/` stays
 *  testable in plain node (see PRD §9 hard rule). */

export type Vec3 = [number, number, number]

/** Quaternion as [x, y, z, w]. */
export type Quat = [number, number, number, number]
