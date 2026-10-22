import { describe, expect, it } from 'vitest'
import { advance, advanceAccumulated, createAccumulator, FIXED_DT_S, shipForward, speedKmS, stepShip, velocityLateralKmS } from './integrator'
import { DEFAULT_FLIGHT_CONFIG } from './config'
import type { InputFrame, ShipState } from '../../types/flight'
import type { Vec3 } from '../../types/math'
import { QUAT_IDENTITY } from '../math/quat'
import { distance, length } from '../math/vec3'
import { mulberry32 } from '../bodies/noise'

const NEUTRAL: InputFrame = { throttle: 0, pitch: 0, yaw: 0, roll: 0, strafe: [0, 0], fine: false }

function ship(overrides: Partial<ShipState> = {}): ShipState {
  return {
    posKm: [0, 0, 0],
    velKmS: [0, 0, 0],
    quat: [...QUAT_IDENTITY],
    angVelRadS: [0, 0, 0],
    throttle: 0,
    assist: 'cruise',
    dock: false,
    ...overrides,
  }
}

describe('flight integrator', () => {
  it('advances in fixed steps regardless of the caller frame rate', () => {
    const input: InputFrame = { ...NEUTRAL, throttle: 1, pitch: 0.4, yaw: -0.2 }
    const run = (fps: number): { pos: Vec3; steps: number } => {
      let acc = createAccumulator(ship())
      const before = acc.state.posKm
      let steps = 0
      void before
      for (let i = 0; i < 60 * fps; i++) {
        const next = advanceAccumulated(acc, input, DEFAULT_FLIGHT_CONFIG, 1 / fps)
        steps += Math.round((acc.carryS + 1 / fps - next.carryS) / FIXED_DT_S)
        acc = next
      }
      return { pos: acc.state.posKm, steps }
    }
    const at30 = run(30)
    const at60 = run(60)
    const at144 = run(144)
    // Same number of fixed steps (within rounding), therefore the same path.
    expect(Math.abs(at30.steps - at144.steps)).toBeLessThanOrEqual(1)
    expect(Math.abs(at60.steps - at144.steps)).toBeLessThanOrEqual(1)
    // And no divergence beyond the distance covered in ONE step at cruise.
    const oneStepKm = DEFAULT_FLIGHT_CONFIG.maxSpeedKmS * FIXED_DT_S
    expect(distance(at30.pos, at60.pos)).toBeLessThanOrEqual(oneStepKm)
    expect(distance(at60.pos, at144.pos)).toBeLessThanOrEqual(oneStepKm)
  })

  it('kills lateral drift inside 5 s in cruise', () => {
    let s = ship({ velKmS: [400, 0, 0] }) // 400 km/s sideways, nose on -Z
    for (let i = 0; i < 5 * 60; i++) s = advance(s, NEUTRAL, DEFAULT_FLIGHT_CONFIG, 1 / 60)
    expect(length(velocityLateralKmS(s))).toBeLessThan(0.001) // < 1 m/s
  })

  it('preserves drift in drift mode', () => {
    let s = ship({ velKmS: [400, 0, 0], assist: 'drift' })
    for (let i = 0; i < 10 * 60; i++) s = advance(s, NEUTRAL, DEFAULT_FLIGHT_CONFIG, 1 / 60)
    expect(speedKmS(s)).toBeCloseTo(400, 6)
  })

  it('ramps to ~95% of commanded speed in accelRampS', () => {
    let s = ship()
    const input: InputFrame = { ...NEUTRAL, throttle: 1 }
    for (let i = 0; i < 18 * 60; i++) s = advance(s, input, DEFAULT_FLIGHT_CONFIG, 1 / 60)
    const target = DEFAULT_FLIGHT_CONFIG.maxSpeedKmS
    expect(speedKmS(s)).toBeGreaterThan(target * 0.94)
    expect(speedKmS(s)).toBeLessThanOrEqual(target * 1.001)
    // Nose is -Z, so the velocity is on -Z.
    expect(shipForward(s)[2]).toBeLessThan(-0.99)
    expect(s.velKmS[2]).toBeLessThan(0)
  })

  it('reaches the commanded pitch rate and turns the ship', () => {
    let s = ship()
    const input: InputFrame = { ...NEUTRAL, pitch: 1 }
    for (let i = 0; i < 120; i++) s = stepShip(s, input, DEFAULT_FLIGHT_CONFIG, FIXED_DT_S)
    expect(Math.abs(s.angVelRadS[0])).toBeGreaterThan(DEFAULT_FLIGHT_CONFIG.pitchYawRateRadS * 0.9)
    expect(Math.abs(s.angVelRadS[0])).toBeLessThanOrEqual(DEFAULT_FLIGHT_CONFIG.pitchYawRateRadS * 1.001)
    // Forward vector has rotated away from -Z.
    expect(Math.abs(shipForward(s)[2])).toBeLessThan(0.9999)
  })

  it('toggles assist exactly once per requested toggle', () => {
    let s = ship()
    s = stepShip(s, { ...NEUTRAL, toggleAssist: true }, DEFAULT_FLIGHT_CONFIG, FIXED_DT_S)
    expect(s.assist).toBe('drift')
    s = stepShip(s, { ...NEUTRAL, toggleAssist: true }, DEFAULT_FLIGHT_CONFIG, FIXED_DT_S)
    expect(s.assist).toBe('cruise')
  })

  it('never produces a NaN across ten minutes of random input', () => {
    const rand = mulberry32(20261022)
    let s = ship()
    for (let i = 0; i < 600 * 60; i++) {
      const input: InputFrame = {
        throttle: rand() * 2 - 1,
        pitch: rand() * 2 - 1,
        yaw: rand() * 2 - 1,
        roll: rand() * 2 - 1,
        strafe: [rand() * 2 - 1, rand() * 2 - 1],
        fine: rand() > 0.8,
        toggleAssist: rand() > 0.995,
      }
      s = advance(s, input, DEFAULT_FLIGHT_CONFIG, 1 / 60)
    }
    expect(s.posKm.every(Number.isFinite)).toBe(true)
    expect(s.velKmS.every(Number.isFinite)).toBe(true)
    expect(s.quat.every(Number.isFinite)).toBe(true)
    expect(Math.abs(Math.hypot(...s.quat) - 1)).toBeLessThan(1e-6)
  })
})
