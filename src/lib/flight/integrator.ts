import type { FlightConfig, InputFrame, ShipState } from '../../types/flight'
import type { Vec3 } from '../../types/math'
import { quatIntegrate, quatRotateVec } from '../math/quat'
import { add, clamp, dot, isFiniteVec, scale, sub } from '../math/vec3'

/** Fixed integration step. All flight state advances at this rate or not at all. */
export const FIXED_DT_S = 1 / 120

export const SHIP_FORWARD: Vec3 = [0, 0, -1]
export const SHIP_RIGHT: Vec3 = [1, 0, 0]
export const SHIP_UP: Vec3 = [0, 1, 0]

export function velocityLateralKmS(state: ShipState): Vec3 {
  const forward = quatRotateVec(state.quat, SHIP_FORWARD)
  const fwd = dot(state.velKmS, forward)
  return sub(state.velKmS, scale(forward, fwd))
}

export function speedKmS(state: ShipState): number {
  return Math.hypot(state.velKmS[0], state.velKmS[1], state.velKmS[2])
}

/** One fixed step. Pure: returns a new state, never mutates the input. */
export function stepShip(
  state: ShipState,
  input: InputFrame,
  config: FlightConfig,
  dtS: number,
): ShipState {
  const assist = input.toggleAssist
    ? state.assist === 'cruise'
      ? 'drift'
      : 'cruise'
    : state.assist
  const fine = input.fine ? config.fineControlScale : 1

  // --- rotation: commanded RATE, ramped in over rateRampS -------------------
  const cmd = [
    clamp(input.pitch, -1, 1) * config.pitchYawRateRadS * fine,
    clamp(input.yaw, -1, 1) * config.pitchYawRateRadS * fine,
    clamp(input.roll, -1, 1) * config.rollRateRadS * fine,
  ] as Vec3
  const k = config.rateRampS <= 0 ? 1 : 1 - Math.exp(-dtS / config.rateRampS)
  const angVel: Vec3 = [
    state.angVelRadS[0] + (cmd[0] - state.angVelRadS[0]) * k,
    state.angVelRadS[1] + (cmd[1] - state.angVelRadS[1]) * k,
    state.angVelRadS[2] + (cmd[2] - state.angVelRadS[2]) * k,
  ]
  const quat = quatIntegrate(state.quat, angVel, dtS)

  // --- translation ---------------------------------------------------------
  const forward = quatRotateVec(quat, SHIP_FORWARD)
  const right = quatRotateVec(quat, SHIP_RIGHT)
  const up = quatRotateVec(quat, SHIP_UP)

  const throttle = clamp(input.throttle, -1, 1)
  const targetFwd = throttle * config.maxSpeedKmS
  const fwdSpeed = dot(state.velKmS, forward)
  const coasting = assist === 'cruise' && Math.abs(throttle) < 1e-3
  const tau = (coasting ? config.assistCoastDecayS : config.accelRampS / 3) || 1e-6
  const dFwd = ((targetFwd - fwdSpeed) / tau) * dtS

  let vel = add(state.velKmS, scale(forward, dFwd))

  if (assist === 'cruise') {
    const vf = dot(vel, forward)
    const lateral = sub(vel, scale(forward, vf))
    const decay = Math.exp(-dtS / config.assistLateralDampS)
    vel = add(scale(forward, vf), scale(lateral, decay))
  }

  // RCS strafe (docking / fine positioning).
  const rcs = config.rcsStrafeAccelKmS2 * fine * dtS
  vel = add(
    vel,
    add(scale(right, clamp(input.strafe[0], -1, 1) * rcs), scale(up, clamp(input.strafe[1], -1, 1) * rcs)),
  )

  const posKm = add(state.posKm, scale(vel, dtS))

  const next: ShipState = {
    posKm,
    velKmS: vel,
    quat,
    angVelRadS: angVel,
    throttle,
    assist,
    dock: state.dock,
  }

  // Never let a NaN into the ship: hold the last good state instead.
  if (
    !isFiniteVec(next.posKm) ||
    !isFiniteVec(next.velKmS) ||
    !isFiniteVec(next.angVelRadS) ||
    !next.quat.every(Number.isFinite)
  ) {
    return { ...state, throttle, assist }
  }
  return next
}

/** Advance the ship by `dtTotalS` in fixed steps, dropping any remainder.
 *  For one-shot/tests. A live flight loop MUST use `advanceAccumulated`, which
 *  carries the remainder across frames — that is what makes the trajectory
 *  frame-rate independent rather than merely frame-rate tolerant. */
export function advance(
  state: ShipState,
  input: InputFrame,
  config: FlightConfig,
  dtTotalS: number,
): ShipState {
  let remaining = Math.max(0, dtTotalS)
  let next = state
  let guard = 0
  while (remaining > 1e-9 && guard < 10_000) {
    const dt = Math.min(FIXED_DT_S, remaining)
    next = stepShip(next, input, config, dt)
    remaining -= dt
    guard++
  }
  return next
}

export type FlightAccumulator = { state: ShipState; carryS: number }

export function createAccumulator(state: ShipState): FlightAccumulator {
  return { state, carryS: 0 }
}

/** The live-loop entry point. Every step is exactly FIXED_DT_S long, and the
 *  leftover time is carried into the next frame, so 30/60/144 fps produce the
 *  same trajectory rather than three similar ones. */
export function advanceAccumulated(
  acc: FlightAccumulator,
  input: InputFrame,
  config: FlightConfig,
  dtTotalS: number,
): FlightAccumulator {
  let carry = acc.carryS + Math.max(0, dtTotalS)
  let state = acc.state
  let guard = 0
  while (carry >= FIXED_DT_S && guard < 10_000) {
    state = stepShip(state, input, config, FIXED_DT_S)
    carry -= FIXED_DT_S
    guard++
  }
  return { state, carryS: carry }
}

export function shipForward(state: ShipState): Vec3 {
  return quatRotateVec(state.quat, SHIP_FORWARD)
}
