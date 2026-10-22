/** Three-free primitive geometry. All output is NON-INDEXED with flat face
 *  normals: the hull is merged from many parts, and non-indexed is the only
 *  form that merges cleanly across box/cylinder/wedge without index mismatches.
 *  Flat normals are also the right look — this is a welded metal hull, not a
 *  rounded organic mesh. */

export type PrimitiveMesh = {
  positions: Float32Array
  normals: Float32Array
  uvs: Float32Array
  triangleCount: number
}

type V3 = [number, number, number]

function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function norm(a: V3): V3 {
  const len = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / len, a[1] / len, a[2] / len]
}

/**
 * A tapered box: length along Z, cross-section interpolating from
 * `widthFront`×`heightFront` at -Z to `widthBack`×`heightBack` at +Z.
 * Centred on the origin. Used for the prow and the aft taper.
 */
export function wedgeGeometry(
  lengthM: number,
  widthFrontM: number,
  heightFrontM: number,
  widthBackM: number,
  heightBackM: number,
): PrimitiveMesh {
  const hz = lengthM / 2
  const wf = widthFrontM / 2
  const wb = widthBackM / 2
  const hf = heightFrontM / 2
  const hb = heightBackM / 2

  // 0..3 front (-Z), 4..7 back (+Z); within a face: BL, BR, TR, TL
  const v: V3[] = [
    [-wf, -hf, -hz],
    [wf, -hf, -hz],
    [wf, hf, -hz],
    [-wf, hf, -hz],
    [-wb, -hb, hz],
    [wb, -hb, hz],
    [wb, hb, hz],
    [-wb, hb, hz],
  ]

  const faces: Array<[number, number, number]> = [
    // front (-Z) — outward
    [0, 2, 1],
    [0, 3, 2],
    // back (+Z)
    [4, 5, 6],
    [4, 6, 7],
    // left (-X)
    [0, 4, 7],
    [0, 7, 3],
    // right (+X)
    [1, 2, 6],
    [1, 6, 5],
    // top (+Y)
    [3, 7, 6],
    [3, 6, 2],
    // bottom (-Y)
    [0, 1, 5],
    [0, 5, 4],
  ]

  const positions = new Float32Array(faces.length * 9)
  const normals = new Float32Array(faces.length * 9)
  const uvs = new Float32Array(faces.length * 6)

  faces.forEach((face, i) => {
    const [a, b, c] = face.map((idx) => v[idx]) as [V3, V3, V3]
    const n = norm(cross(sub(b, a), sub(c, a)))
    const verts: V3[] = [a, b, c]
    verts.forEach((p, k) => {
      const o = i * 9 + k * 3
      positions[o] = p[0]
      positions[o + 1] = p[1]
      positions[o + 2] = p[2]
      normals[o] = n[0]
      normals[o + 1] = n[1]
      normals[o + 2] = n[2]
      const uo = i * 6 + k * 2
      uvs[uo] = p[0] / Math.max(widthFrontM, widthBackM) + 0.5
      uvs[uo + 1] = p[2] / lengthM + 0.5
    })
  })

  return { positions, normals, uvs, triangleCount: faces.length }
}

/** Fraction of triangles whose flat normal points away from the centroid.
 *  A correctly wound convex solid reads 1.0. */
export function outwardFraction(mesh: PrimitiveMesh): number {
  const tris = mesh.triangleCount
  let outward = 0
  for (let t = 0; t < tris; t++) {
    const o = t * 9
    const n: V3 = [mesh.normals[o], mesh.normals[o + 1], mesh.normals[o + 2]]
    const cx = (mesh.positions[o] + mesh.positions[o + 3] + mesh.positions[o + 6]) / 3
    const cy = (mesh.positions[o + 1] + mesh.positions[o + 4] + mesh.positions[o + 7]) / 3
    const cz = (mesh.positions[o + 2] + mesh.positions[o + 5] + mesh.positions[o + 8]) / 3
    if (n[0] * cx + n[1] * cy + n[2] * cz > 0) outward++
  }
  return tris === 0 ? 1 : outward / tris
}

export type Profile2 = Array<[number, number]>

/** An octagonal hull cross-section, chamfered at the corners. This is the
 *  primitive that stops the ship reading as a four-sided box: real hulls meet
 *  their faces at a bevel, and the bevel is what catches light. */
export function octagonProfile(widthM: number, heightM: number, chamfer = 0.22): Profile2 {
  const x = widthM / 2
  const y = heightM / 2
  const cx = x * (1 - chamfer)
  const cy = y * (1 - chamfer)
  return [
    [cx, y],
    [-cx, y],
    [-x, cy],
    [-x, -cy],
    [-cx, -y],
    [cx, -y],
    [x, -cy],
    [x, cy],
  ]
}

/**
 * Extrude a convex 2D profile along Z, optionally tapering the front (-Z) and
 * back (+Z) rings independently. Cross-section is given in metres at full
 * scale; `frontScale`/`backScale` shrink it about the Z axis.
 */
export function prismGeometry(
  profile: Profile2,
  lengthM: number,
  frontScale = 1,
  backScale = 1,
): PrimitiveMesh {
  const n = profile.length
  const hz = lengthM / 2
  const tris: Array<[V3, V3, V3]> = []

  const ring = (scale: number, z: number): V3[] =>
    profile.map(([x, y]) => [x * scale, y * scale, z] as V3)

  const front = ring(frontScale, -hz)
  const back = ring(backScale, hz)

  // Sides. Profile is authored CCW seen from +Z; this winding faces outward.
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    tris.push([front[i], back[j], back[i]])
    tris.push([front[i], front[j], back[j]])
  }
  // Caps: fan triangulation (profiles are convex by contract).
  for (let i = 1; i < n - 1; i++) {
    tris.push([front[0], front[i + 1], front[i]])
    tris.push([back[0], back[i], back[i + 1]])
  }

  const positions = new Float32Array(tris.length * 9)
  const normals = new Float32Array(tris.length * 9)
  const uvs = new Float32Array(tris.length * 6)

  tris.forEach((tri, i) => {
    const [a, b, c] = tri
    const nrm = norm(cross(sub(b, a), sub(c, a)))
    const verts: V3[] = [a, b, c]
    verts.forEach((p, k) => {
      const o = i * 9 + k * 3
      positions[o] = p[0]
      positions[o + 1] = p[1]
      positions[o + 2] = p[2]
      normals[o] = nrm[0]
      normals[o + 1] = nrm[1]
      normals[o + 2] = nrm[2]
      const uo = i * 6 + k * 2
      uvs[uo] = p[0] / Math.max(width0(profile), 1) + 0.5
      uvs[uo + 1] = p[2] / lengthM + 0.5
    })
  })

  return { positions, normals, uvs, triangleCount: tris.length }
}

function width0(profile: Profile2): number {
  let w = 0
  for (const [x] of profile) w = Math.max(w, Math.abs(x))
  return w * 2
}
