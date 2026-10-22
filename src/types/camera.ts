import type { Quat, Vec3 } from './math'
import type { ShipState } from './flight'

export type CameraMode = 'chase' | 'orbit' | 'free'

export type CameraRig = {
  mode: CameraMode
  armM: number
  heightM: number
  lookAheadM: number
  /** 0 = no roll follow, 1 = rigid with the hull. */
  rollFollow: number
  fovBaseDeg: number
  fovSpeedDeg: number
  /** Free-look offsets in radians, decaying back to zero on release. */
  freeYawRad: number
  freePitchRad: number
}

export type CameraState = {
  posKm: Vec3
  quat: Quat
  fovDeg: number
}

/** Everything the R3F layer draws comes from here. PRD §7 contract #6. */
export type RenderFrame = {
  originKm: Vec3
  rebaseSerial: number
  ship: ShipState
  camera: CameraState
}
