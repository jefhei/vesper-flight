import type { Quat, Vec3 } from '../../types/math'
import { cross, normalize } from './vec3'

export const QUAT_IDENTITY: Quat = [0, 0, 0, 1]

export function quatMultiply(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a
  const [bx, by, bz, bw] = b
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ]
}

export function quatNormalize(q: Quat): Quat {
  const len = Math.hypot(q[0], q[1], q[2], q[3])
  if (len < 1e-12) return [...QUAT_IDENTITY]
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len]
}

export function quatFromAxisAngle(axis: Vec3, angleRad: number): Quat {
  const len = Math.hypot(axis[0], axis[1], axis[2])
  if (len < 1e-12) return [...QUAT_IDENTITY]
  const half = angleRad / 2
  const s = Math.sin(half) / len
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(half)]
}

/** Rotate `v` by `q` (q assumed unit-length). */
export function quatRotateVec(q: Quat, v: Vec3): Vec3 {
  const [x, y, z, w] = q
  const [vx, vy, vz] = v
  // t = 2 * cross(q.xyz, v); v' = v + w * t + cross(q.xyz, t)
  const tx = 2 * (y * vz - z * vy)
  const ty = 2 * (z * vx - x * vz)
  const tz = 2 * (x * vy - y * vx)
  return [
    vx + w * tx + (y * tz - z * ty),
    vy + w * ty + (z * tx - x * tz),
    vz + w * tz + (x * ty - y * tx),
  ]
}

/** Integrate a LOCAL-frame angular velocity over dt: q' = normalize(q + 0.5·ω⊗q·dt). */
export function quatIntegrate(q: Quat, omegaLocal: Vec3, dtS: number): Quat {
  const [wx, wy, wz] = omegaLocal
  const half: Quat = [wx * 0.5, wy * 0.5, wz * 0.5, 0]
  const dq = quatMultiply(half, q)
  return quatNormalize([
    q[0] + dq[0] * dtS,
    q[1] + dq[1] * dtS,
    q[2] + dq[2] * dtS,
    q[3] + dq[3] * dtS,
  ])
}

export function quatFromBasis(xAxis: Vec3, yAxis: Vec3, zAxis: Vec3): Quat {
  // Columns of the rotation matrix are the basis vectors.
  const m00 = xAxis[0]
  const m01 = yAxis[0]
  const m02 = zAxis[0]
  const m10 = xAxis[1]
  const m11 = yAxis[1]
  const m12 = zAxis[1]
  const m20 = xAxis[2]
  const m21 = yAxis[2]
  const m22 = zAxis[2]
  const trace = m00 + m11 + m22
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2
    return [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, 0.25 * s]
  }
  if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2
    return [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]
  }
  if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2
    return [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s]
  }
  const s = Math.sqrt(1 + m22 - m00 - m11) * 2
  return [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s]
}

/** Orientation whose FORWARD (-Z, the ship convention) points along `dir`. */
export function quatLookAlong(dir: Vec3, up: Vec3 = [0, 1, 0]): Quat {
  const zAxis = normalize([-dir[0], -dir[1], -dir[2]])
  let xAxis = cross(up, zAxis)
  if (Math.hypot(...xAxis) < 1e-6) xAxis = cross([0, 0, 1], zAxis)
  xAxis = normalize(xAxis)
  const yAxis = cross(zAxis, xAxis)
  return quatNormalize(quatFromBasis(xAxis, yAxis, zAxis))
}

export function quatSlerp(a: Quat, b: Quat, t: number): Quat {
  let cos = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
  let target: Quat = [...b]
  if (cos < 0) {
    cos = -cos
    target = [-b[0], -b[1], -b[2], -b[3]]
  }
  if (cos > 0.9995) {
    return quatNormalize([
      a[0] + (target[0] - a[0]) * t,
      a[1] + (target[1] - a[1]) * t,
      a[2] + (target[2] - a[2]) * t,
      a[3] + (target[3] - a[3]) * t,
    ])
  }
  const theta = Math.acos(cos)
  const sin = Math.sin(theta)
  const wa = Math.sin((1 - t) * theta) / sin
  const wb = Math.sin(t * theta) / sin
  return quatNormalize([
    a[0] * wa + target[0] * wb,
    a[1] * wa + target[1] * wb,
    a[2] * wa + target[2] * wb,
    a[3] * wa + target[3] * wb,
  ])
}
