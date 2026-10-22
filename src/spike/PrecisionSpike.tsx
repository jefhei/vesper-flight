import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { createOrigin, float32ErrorM, toRenderKm, updateOrigin, type OriginState } from '../lib/frame/origin'
import type { Vec3 } from '../types/math'
import { WhiteBoxShip } from './WhiteBoxShip'
import { Panel, fmt } from './Panel'
import { Star } from './Bodies'

const PRESETS: Array<{ label: string; km: number; key: string }> = [
  { label: 'dock (0 km)', km: 0, key: '1' },
  { label: '1,000 km', km: 1_000, key: '2' },
  { label: '100,000 km', km: 100_000, key: '3' },
  { label: '1,200,000 km (edge)', km: 1_200_000, key: '4' },
]

const STAR_RADIUS_M = 45_000_000

function Scene({ shipKm, origin }: { shipKm: Vec3; origin: OriginState }) {
  const camera = useThree((s) => s.camera)
  const renderKm = toRenderKm(shipKm, origin)
  const shipM: [number, number, number] = [renderKm[0] * 1000, renderKm[1] * 1000, renderKm[2] * 1000]
  const starRender = toRenderKm([0, 0, 0], origin)
  const starM: [number, number, number] = [starRender[0] * 1000, starRender[1] * 1000, starRender[2] * 1000]

  useEffect(() => {
    camera.position.set(shipM[0] + 0, shipM[1] + 80, shipM[2] + 160)
    camera.lookAt(shipM[0], shipM[1], shipM[2])
  }, [camera, shipM[0], shipM[1], shipM[2]])

  // A 1 m ruler 25 m off the hull: if precision is failing, this shimmers.
  const rungs = useMemo(() => Array.from({ length: 21 }, (_, i) => i - 10), [])

  return (
    <>
      <ambientLight intensity={0.02} />
      <directionalLight
        position={[starM[0] / 1000 || 1, starM[1] / 1000 || 1, starM[2] / 1000 || 1]}
        intensity={2.6}
        color="#ffd9a8"
      />
      <Star radiusM={STAR_RADIUS_M} positionM={starM} />
      <group position={shipM}>
        <WhiteBoxShip throttle={0.15} heat={0.4} />
      </group>
      <group position={[shipM[0], shipM[1] - 14, shipM[2] - 10]}>
        {rungs.map((i) => (
          <mesh key={i} position={[i, 0, 0]}>
            <boxGeometry args={[0.12, 0.6, 0.12]} />
            <meshStandardMaterial
              color={i % 5 === 0 ? '#ffcf8a' : '#d8d3c6'}
              emissive={i % 5 === 0 ? '#ffcf8a' : '#000000'}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}
      </group>
      <mesh position={[shipM[0], shipM[1], shipM[2] - 400]}>
        <boxGeometry args={[20, 20, 20]} />
        <meshStandardMaterial color="#5b8fb0" roughness={0.8} />
      </mesh>
    </>
  )
}

export function PrecisionSpike({ rebase }: { rebase: boolean }) {
  const [preset, setPreset] = useState(() => {
    const wanted = Number(new URLSearchParams(window.location.search).get('dist') ?? '0')
    const found = PRESETS.findIndex((p) => p.km === wanted)
    return found >= 0 ? found : 0
  })
  const [origin, setOrigin] = useState<OriginState>(() => createOrigin())

  const shipKm = useMemo<Vec3>(() => [PRESETS[preset].km * 1000, 0, 0], [preset])

  // Teleport ⇒ recompute the origin chain exactly as the live loop would.
  useEffect(() => {
    const cameraKm: Vec3 = [shipKm[0], shipKm[1] + 0.08, shipKm[2] + 0.16]
    setOrigin((prev) => (rebase ? updateOrigin(cameraKm, prev) : createOrigin()))
  }, [shipKm, rebase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const found = PRESETS.findIndex((p) => p.key === e.key)
      if (found >= 0) setPreset(found)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const renderKm = toRenderKm(shipKm, origin)
  const magnitudeM = Math.hypot(renderKm[0], renderKm[1], renderKm[2]) * 1000
  const errorM = float32ErrorM(renderKm)
  const worldDistanceKm = Math.hypot(...shipKm)

  return (
    <>
      <Canvas
        camera={{ fov: 55, near: 0.1, far: 3e9, position: [0, 0, 200] }}
        gl={{ logarithmicDepthBuffer: true, antialias: true }}
      >
        <color attach="background" args={['#05070b']} />
        <Scene shipKm={shipKm} origin={origin} />
      </Canvas>
      <Panel
        title="M0-S1 · PRECISION"
        rows={[
          ['world position', `${fmt(worldDistanceKm)} km`],
          ['origin serial', `${origin.rebaseSerial}`],
          ['render magnitude', `${fmt(magnitudeM, 2)} m`],
          ['float32 error', `${fmt(errorM * 1000, 3)} mm`],
          ['rebase', rebase ? 'on (8 km / 1 km grid)' : 'OFF — raw world space'],
          ['preset', PRESETS[preset].label],
        ]}
      >
        <div style={{ color: '#8d9aa8' }}>
          {PRESETS.map((p) => `${p.key} = ${p.label}`).join('   ')}
          {'\n'}1 m rungs below the hull: watch for shimmer / jitter.
        </div>
      </Panel>
    </>
  )
}
