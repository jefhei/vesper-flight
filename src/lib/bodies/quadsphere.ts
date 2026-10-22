import type { Vec3 } from '../../types/math'

/** CPU-side quad-sphere generation, three-free so it is unit-testable.
 *  Six cube faces projected to a sphere, n×n quads each, plus an optional
 *  radial skirt ring on every face edge to hide LOD seams. */

export type MeshData = {
  positions: Float32Array
  normals: Float32Array
  uvs: Float32Array
  indices: Uint32Array
  triangleCount: number
}

/** Divisions per face edge for a LOD level: 8, 16, 32, 64. */
export function quadSphereDivisions(level: number): number {
  return 8 * 2 ** level
}

type Face = { normal: Vec3; right: Vec3; up: Vec3 }

const FACES: Face[] = [
  { normal: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0] },
  { normal: [-1, 0, 0], right: [0, 0, 1], up: [0, 1, 0] },
  { normal: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1] },
  { normal: [0, -1, 0], right: [1, 0, 0], up: [0, 0, 1] },
  { normal: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0] },
  { normal: [0, 0, -1], right: [-1, 0, 0], up: [0, 1, 0] },
]

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

export function quadSphere(
  level: number,
  radiusM: number,
  displace?: (dir: Vec3) => number,
  skirtDepthM = 0,
): MeshData {
  const n = quadSphereDivisions(level)
  const vertsPerFace = (n + 1) * (n + 1)
  const hasSkirt = skirtDepthM > 0
  // 4 edges × (n+1) skirt vertices per face
  const skirtPerFace = hasSkirt ? 4 * (n + 1) : 0

  const vertexCount = FACES.length * (vertsPerFace + skirtPerFace)
  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const uvs = new Float32Array(vertexCount * 2)
  const indices: number[] = []

  let vOut = 0
  let uvOut = 0

  for (const face of FACES) {
    const faceBase = vOut / 3

    for (let iv = 0; iv <= n; iv++) {
      for (let iu = 0; iu <= n; iu++) {
        const u = (iu / n) * 2 - 1
        const v = (iv / n) * 2 - 1
        const dir = normalize([
          face.normal[0] + face.right[0] * u + face.up[0] * v,
          face.normal[1] + face.right[1] * u + face.up[1] * v,
          face.normal[2] + face.right[2] * u + face.up[2] * v,
        ])
        const r = radiusM + (displace ? displace(dir) : 0)
        positions[vOut] = dir[0] * r
        positions[vOut + 1] = dir[1] * r
        positions[vOut + 2] = dir[2] * r
        normals[vOut] = dir[0]
        normals[vOut + 1] = dir[1]
        normals[vOut + 2] = dir[2]
        uvs[uvOut] = 0.5 + Math.atan2(dir[2], dir[0]) / (2 * Math.PI)
        uvs[uvOut + 1] = 0.5 - Math.asin(Math.max(-1, Math.min(1, dir[1]))) / Math.PI
        vOut += 3
        uvOut += 2
      }
    }

    const at = (iu: number, iv: number) => faceBase + iv * (n + 1) + iu
    for (let iv = 0; iv < n; iv++) {
      for (let iu = 0; iu < n; iu++) {
        const a = at(iu, iv)
        const b = at(iu + 1, iv)
        const c = at(iu + 1, iv + 1)
        const d = at(iu, iv + 1)
        // CCW when viewed from outside the sphere.
        indices.push(a, b, c, a, c, d)
      }
    }

    if (hasSkirt) {
      const skirtBase = vOut / 3
      const edgeVertices: Array<{ iu: number; iv: number }> = []
      for (let iu = 0; iu <= n; iu++) edgeVertices.push({ iu, iv: 0 })
      for (let iv = 1; iv <= n; iv++) edgeVertices.push({ iu: n, iv })
      for (let iu = n - 1; iu >= 0; iu--) edgeVertices.push({ iu, iv: n })
      for (let iv = n - 1; iv >= 0; iv--) edgeVertices.push({ iu: 0, iv })

      for (const { iu, iv } of edgeVertices) {
        const src = at(iu, iv) * 3
        const dir: Vec3 = [normals[src], normals[src + 1], normals[src + 2]]
        // The rim may be displaced; the skirt must hang off the ACTUAL rim
        // radius, or it shows as a lip exactly where it is meant to hide a seam.
        const rimRadius = radiusM + (displace ? displace(dir) : 0)
        const r = Math.max(rimRadius - skirtDepthM, rimRadius * 0.96)
        positions[vOut] = dir[0] * r
        positions[vOut + 1] = dir[1] * r
        positions[vOut + 2] = dir[2] * r
        normals[vOut] = dir[0]
        normals[vOut + 1] = dir[1]
        normals[vOut + 2] = dir[2]
        uvs[uvOut] = uvs[at(iu, iv) * 2]
        uvs[uvOut + 1] = uvs[at(iu, iv) * 2 + 1]
        vOut += 3
        uvOut += 2
      }

      const ring = edgeVertices.length
      for (let i = 0; i < ring; i++) {
        const a = at(edgeVertices[i].iu, edgeVertices[i].iv)
        const b = at(edgeVertices[(i + 1) % ring].iu, edgeVertices[(i + 1) % ring].iv)
        const c = skirtBase + ((i + 1) % ring)
        const d = skirtBase + i
        indices.push(a, b, c, a, c, d)
      }
    }
  }

  return {
    positions,
    normals,
    uvs,
    indices: new Uint32Array(indices),
    triangleCount: indices.length / 3,
  }
}

/** Fraction of triangles whose winding points outward. A correctly wound sphere
 *  reads 1.0; anything below ~0.99 means an inside-out face. */
export function outwardFraction(mesh: MeshData): number {
  const { positions, indices } = mesh
  let outward = 0
  const tris = indices.length / 3
  for (let t = 0; t < tris; t++) {
    const a = indices[t * 3] * 3
    const b = indices[t * 3 + 1] * 3
    const c = indices[t * 3 + 2] * 3
    const abx = positions[b] - positions[a]
    const aby = positions[b + 1] - positions[a + 1]
    const abz = positions[b + 2] - positions[a + 2]
    const acx = positions[c] - positions[a]
    const acy = positions[c + 1] - positions[a + 1]
    const acz = positions[c + 2] - positions[a + 2]
    const nx = aby * acz - abz * acy
    const ny = abz * acx - abx * acz
    const nz = abx * acy - aby * acx
    // Centroid direction doubles as the outward reference on a convex shell.
    const cx = positions[a] + positions[b] + positions[c]
    const cy = positions[a + 1] + positions[b + 1] + positions[c + 1]
    const cz = positions[a + 2] + positions[b + 2] + positions[c + 2]
    if (nx * cx + ny * cy + nz * cz > 0) outward++
  }
  return tris === 0 ? 1 : outward / tris
}

/** Peak radial gap between an actual vertex and the ideal sphere — the bake
 *  error, in metres. */
export function radialErrorM(mesh: MeshData, radiusM: number): number {
  let peak = 0
  const { positions } = mesh
  for (let i = 0; i < positions.length; i += 3) {
    const r = Math.hypot(positions[i], positions[i + 1], positions[i + 2])
    const error = Math.abs(r - radiusM)
    if (error > peak) peak = error
  }
  return peak
}
