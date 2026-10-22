import type { Quat, Vec3 } from './math'

export type AssistMode = 'cruise' | 'drift'

export type ShipState = {
  posKm: Vec3
  velKmS: Vec3
  quat: Quat
  /** Body-axis angular rate, rad/s: [pitch (x), yaw (y), roll (z)]. */
  angVelRadS: Vec3
  /** Commanded throttle, -1..1 (negative = retro burn). */
  throttle: number
  assist: AssistMode
  dock: boolean
}

/** One frame of pilot input. Axes are -1..1 unless noted. */
export type InputFrame = {
  throttle: number
  pitch: number
  yaw: number
  roll: number
  /** [lateral, vertical] RCS strafe, -1..1. */
  strafe: [number, number]
  fine: boolean
  toggleAssist?: boolean
}

/** Every tuning number the flight model has, in ONE place (PRD §7). */
export type FlightConfig = {
  /** Model-space top speed in km/s. The system is a scale model; so is this. */
  maxSpeedKmS: number
  /** Seconds to ~95% of commanded speed (time constant = accelRampS / 3). */
  accelRampS: number
  pitchYawRateRadS: number
  rollRateRadS: number
  /** Seconds for commanded angular rate to be reached. */
  rateRampS: number
  /** Cruise assist: time constant for killing lateral drift. */
  assistLateralDampS: number
  /** Cruise assist: time constant for coasting down with the throttle at zero. */
  assistCoastDecayS: number
  /** RCS strafe acceleration, model-space km/s². */
  rcsStrafeAccelKmS2: number
  /** Shift-key scale applied to all rates. */
  fineControlScale: number
}
