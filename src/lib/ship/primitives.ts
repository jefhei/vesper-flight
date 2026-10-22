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
