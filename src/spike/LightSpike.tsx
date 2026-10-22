import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { BarrowHull, HULL_DRAW_CALLS } from '../scene/ship/BarrowHull'
import { HULL_PARTS } from '../lib/ship/hullSpec'
import { Panel } from './Panel'
import { useKeys } from './useKeys'

function Scene({
  angle,
  throttle,
  radius,
  orbitStart,
  spin,
}: {
  angle: number
  throttle: number
  radius: number
  orbitStart: number
  spin: boolean
}) {
  const camera = useThree((s) => s.camera)
  const orbit = useRef(orbitStart)
  useFrame((_, dt) => {
    if (spin) orbit.current += dt * 0.1
    camera.position.set(Math.sin(orbit.current) * radius, radius * 0.28, Math.cos(orbit.current) * radius)
    camera.lookAt(0, 0, 0)
  })

  const dir = [Math.sin(angle), 0.22, Math.cos(angle)]

  return (
    <>
      {/* Single key light, cool starlight ambient. A warm key at high intensity
          turns the whole plate stack cardboard-brown — learned the hard way. */}
      <ambientLight intensity={0.03} color="#9fc6ff" />
      <directionalLight position={[dir[0] * 1000, dir[1] * 1000, dir[2] * 1000]} intensity={2.5} color="#fff2e0" />
      <BarrowHull throttle={throttle} />
      {/* 20 m reference cube — the hull must read as ~2× its length. */}
      <mesh position={[60, -20, 0]}>
        <boxGeometry args={[20, 20, 20]} />
        <meshStandardMaterial color="#8d939c" roughness={0.9} metalness={0.1} />
      </mesh>
    </>
  )
}

export function LightSpike() {
  const keys = useKeys()
  const [angle, setAngle] = useState(Math.PI * 0.5)
  const [throttle, setThrottle] = useState(0.35)
  const [radius, setRadius] = useState(78)
  // Fixed-angle mode for review screenshots: ?orbit=<rad>&pause=1
  const [orbitStart] = useState(() => {
    const v = Number(new URLSearchParams(window.location.search).get('orbit') ?? '0.6')
    return Number.isFinite(v) ? v : 0.6
  })
  const [spin] = useState(
    () => new URLSearchParams(window.location.search).get('pause') !== '1',
  )

  // Plain timer, not useFrame: this component lives OUTSIDE <Canvas>, where R3F
  // hooks throw. (Cost me a blank screen once — worth the comment.)
  useEffect(() => {
    const id = window.setInterval(() => {
      const k = keys.current
      const step = 0.1
      if (k.has('ArrowLeft')) setAngle((a) => a - step)
      if (k.has('ArrowRight')) setAngle((a) => a + step)
      if (k.has('ArrowUp')) setThrottle((t) => Math.min(1, t + step * 0.3))
      if (k.has('ArrowDown')) setThrottle((t) => Math.max(0, t - step * 0.3))
      if (k.has('BracketLeft')) setRadius((r) => Math.max(45, r - 2))
      if (k.has('BracketRight')) setRadius((r) => Math.min(170, r + 2))
    }, 60)
    return () => window.clearInterval(id)
  }, [keys])

  return (
    <>
      <Canvas camera={{ fov: 45, near: 0.5, far: 5000 }} gl={{ antialias: true }}>
        <color attach="background" args={['#04060a']} />
        <Scene angle={angle} throttle={throttle} radius={radius} orbitStart={orbitStart} spin={spin} />
      </Canvas>
      <Panel
        title="M2 · HULL — SINGLE LIGHT"
        rows={[
          ['star azimuth', `${((angle * 180) / Math.PI).toFixed(0)}°`],
          ['plume throttle', `${(throttle * 100).toFixed(0)} %`],
          ['orbit radius', `${radius} m`],
          ['hull parts', `${HULL_PARTS.length}`],
          ['draw calls', `${HULL_DRAW_CALLS} (budget 6)`],
          ['fill light', '0.03 ambient (starlight only)'],
        ]}
      >
        <div style={{ color: '#8d9aa8' }}>
          ←/→ star azimuth · ↑/↓ plume · [ ] zoom
          {'\n'}Judge the silhouette: prow wedge, dorsal spine + nameplate, drive bell,
          {'\n'}four deployed radiators. Is this the same ship torchship puts you inside?
        </div>
      </Panel>
    </>
  )
}
