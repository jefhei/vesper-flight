import type { Vec3 } from '../../types/math'

export const v3 = (x = 0, y = 0, z = 0): Vec3 => [x, y, z]

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]

export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s]

export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

export const length = (a: Vec3): number => Math.sqrt(dot(a, a))

export const distance = (a: Vec3, b: Vec3): number => length(sub(a, b))

export const normalize = (a: Vec3): Vec3 => {
  const len = length(a)
  return len < 1e-12 ? [0, 0, 0] : scale(a, 1 / len)
}

export const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

export const isFiniteVec = (a: Vec3): boolean =>
  Number.isFinite(a[0]) && Number.isFinite(a[1]) && Number.isFinite(a[2])

export const clamp = (x: number, lo: number, hi: number): number =>
  x < lo ? lo : x > hi ? hi : x
