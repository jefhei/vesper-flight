import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Group } from 'three'
import type { InputFrame, ShipState } from '../types/flight'
import type { Vec3 } from '../types/math'
import { DEFAULT_FLIGHT_CONFIG } from '../lib/flight/config'
import {
  advanceAccumulated,
  createAccumulator,
  shipForward,
  speedKmS,
  velocityLateralKmS,
} from '../lib/flight/integrator'
import { quatLookAlong, quatRotateVec } from '../lib/math/quat'
import { bodyPositionKm } from '../lib/world/ephemeris'
import type { SystemSpec } from '../types/world'
import { Planet, Star } from './Bodies'
import { Panel, fmt } from './Panel'
import { axis, useKeys } from './useKeys'
import { WhiteBoxShip } from './WhiteBoxShip'

type Hud = {
  speed: number
  throttle: number
  assist: string
  lateral: number
  altitude: number
  fps: number
}

function FlightLoop({ system, onHud }: { system: SystemSpec; onHud: (hud: Hud) => void }) {
  const keys = useKeys()
  const camera = useThree((s) => s.camera)
  const planet = system.bodies.find((b) => b.id === 'halcyon') ?? system.bodies[0]
  const planetKm = useMemo(() => bodyPositionKm(planet.id, system, 0), [planet.id, system])

  // Start between the star and the planet: nose at the planet, camera behind
  // the ship — which puts the star behind the camera, so the hull is lit in the
  // first frame instead of presenting its night side.
  const start = useMemo(() => {
    const len = Math.hypot(...planetKm) || 1
    const toStar: Vec3 = [-planetKm[0] / len, -planetKm[1] / len, -planetKm[2] / len]
    const dist = planet.radiusKm + 9000
    const posKm: Vec3 = [
      planetKm[0] + toStar[0] * dist,
      planetKm[1] + toStar[1] * dist,
      planetKm[2] + toStar[2] * dist,
    ]
    const toPlanet: Vec3 = [-toStar[0], -toStar[1], -toStar[2]]
    return { posKm, quat: quatLookAlong(toPlanet) }
  }, [planetKm, planet.radiusKm])

  const shipRef = useRef<ShipState>({
    posKm: start.posKm,
    velKmS: [0, 0, 0],
    quat: start.quat,
    angVelRadS: [0, 0, 0],
    throttle: 0,
    assist: 'cruise',
    dock: false,
  })
  const accRef = useRef(createAccumulator(shipRef.current))
  const camPosRef = useRef<Vec3 | null>(null)
  const throttleRef = useRef(0)
  const assistLatch = useRef(false)
  const fpsRef = useRef(60)
  const lastReport = useRef(0)
  const shipGroup = useRef<Group>(null)

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1)
    const k = keys.current

    if (k.has('KeyW')) throttleRef.current = Math.min(1, throttleRef.current + dt * 0.7)
    if (k.has('KeyS')) throttleRef.current = Math.max(-1, throttleRef.current - dt * 0.7)

    const toggleDown = k.has('KeyX')
    const input: InputFrame = {
      throttle: throttleRef.current,
      pitch: axis(k, 'ArrowDown', 'ArrowUp'),
      yaw: axis(k, 'KeyD', 'KeyA'),
      roll: axis(k, 'KeyE', 'KeyQ'),
      strafe: [0, 0],
      fine: k.has('ShiftLeft') || k.has('ShiftRight'),
      toggleAssist: toggleDown && !assistLatch.current,
    }
    assistLatch.current = toggleDown

    const next = advanceAccumulated(accRef.current, input, DEFAULT_FLIGHT_CONFIG, dt)
    accRef.current = next
    shipRef.current = next.state
    const ship = next.state

    if (shipGroup.current) {
      shipGroup.current.position.set(
        ship.posKm[0] * 1000,
        ship.posKm[1] * 1000,
        ship.posKm[2] * 1000,
      )
      shipGroup.current.quaternion.set(ship.quat[0], ship.quat[1], ship.quat[2], ship.quat[3])
    }

    const posM: Vec3 = [ship.posKm[0] * 1000, ship.posKm[1] * 1000, ship.posKm[2] * 1000]
    const offset = quatRotateVec(ship.quat, [0, 12, 52])
    const desired: Vec3 = [posM[0] + offset[0], posM[1] + offset[1], posM[2] + offset[2]]
    const cam = camPosRef.current
    if (!cam) {
      camPosRef.current = desired
    } else {
      const a = 1 - Math.exp(-dt / 0.16)
      camPosRef.current = [
        cam[0] + (desired[0] - cam[0]) * a,
        cam[1] + (desired[1] - cam[1]) * a,
        cam[2] + (desired[2] - cam[2]) * a,
      ]
    }
    const cp = camPosRef.current
    camera.position.set(cp[0], cp[1], cp[2])
    const forward = shipForward(ship)
    camera.lookAt(posM[0] + forward[0] * 30, posM[1] + forward[1] * 30, posM[2] + forward[2] * 30)

    const now = performance.now()
    if (now - lastReport.current > 120) {
      lastReport.current = now
      const altitudeKm =
        Math.hypot(
          ship.posKm[0] - planetKm[0],
          ship.posKm[1] - planetKm[1],
          ship.posKm[2] - planetKm[2],
        ) - planet.radiusKm
      onHud({
        speed: speedKmS(ship),
        throttle: ship.throttle,
        assist: ship.assist,
        lateral: Math.hypot(...velocityLateralKmS(ship)) * 1000,
        altitude: altitudeKm,
        fps: fpsRef.current,
      })
      fpsRef.current = fpsRef.current * 0.9 + (1 / Math.max(dt, 1e-4)) * 0.1
    }
  })

  const planetRenderM: [number, number, number] = [
    planetKm[0] * 1000,
    planetKm[1] * 1000,
    planetKm[2] * 1000,
  ]

  // Light comes FROM the star (at the world origin) TO the ship: a directional
  // light shines along (target − position), so position must sit on the far
  // side of the ship from the star.
  const lightDir = useMemo<[number, number, number]>(() => {
    const start = shipRef.current.posKm
    const len = Math.hypot(...start) || 1
    return [(-start[0] / len) * 1e8, (-start[1] / len) * 1e8, (-start[2] / len) * 1e8]
  }, [])

  return (
    <>
      <ambientLight intensity={0.015} />
      <directionalLight position={lightDir} intensity={3.2} color="#ffd9a8" />
      <Star radiusM={45_000_000} positionM={[0, 0, 0]} />
      <Planet body={planet} level={2} positionM={planetRenderM} mapWidth={1024} />
      <group ref={shipGroup}>
        <WhiteBoxShip throttleRef={throttleRef as RefObject<number>} heat={0.5} />
      </group>
    </>
  )
}

export function FeelSpike({ system }: { system: SystemSpec }) {
  const [hud, setHud] = useState<Hud>({
    speed: 0,
    throttle: 0,
    assist: 'cruise',
    lateral: 0,
    altitude: 0,
    fps: 60,
  })

  return (
    <>
      <Canvas
        camera={{ fov: 55, near: 0.5, far: 2e9 }}
        gl={{ logarithmicDepthBuffer: true, antialias: true }}
      >
        <color attach="background" args={['#05070b']} />
        <FlightLoop system={system} onHud={setHud} />
      </Canvas>
      <Panel
        title="M0-S3 · FLIGHT FEEL"
        rows={[
          ['speed', `${fmt(hud.speed, 1)} km/s`],
          ['throttle', `${fmt(hud.throttle * 100)} %`],
          ['assist', hud.assist],
          ['lateral drift', `${fmt(hud.lateral, 1)} m/s`],
          ['altitude', `${fmt(hud.altitude)} km`],
          ['fps', fmt(hud.fps)],
        ]}
      >
        <div style={{ color: '#8d9aa8' }}>
          W/S throttle · ↑↓ pitch · A/D yaw · Q/E roll · X assist · Shift fine
          {'\n'}Fly it for a while. Judge: does it carry mass, and does speed read?
        </div>
      </Panel>
    </>
  )
}
