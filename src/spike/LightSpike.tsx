import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { WhiteBoxShip } from './WhiteBoxShip'
import { Panel } from './Panel'
import { useKeys } from './useKeys'

function Scene({ angle, throttle }: { angle: number; throttle: number }) {
  const camera = useThree((s) => s.camera)
  const orbit = useRef(0.6)
  useFrame((_, dt) => {
    orbit.current += dt * 0.12
    const r = 95
    camera.position.set(Math.sin(orbit.current) * r, 26, Math.cos(orbit.current) * r)
    camera.lookAt(0, 0, 0)
  })

  const dir = [Math.sin(angle), 0.22, Math.cos(angle)]

  return (
    <>
      {/* Single light source. No fill, no ambient beyond a whisper of starlight. */}
      <ambientLight intensity={0.012} color="#9fc6ff" />
      <directionalLight position={[dir[0] * 1000, dir[1] * 1000, dir[2] * 1000]} intensity={3.2} color="#ffd9a8" />
      <WhiteBoxShip throttle={throttle} heat={0.7} />
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
    }, 60)
    return () => window.clearInterval(id)
  }, [keys])

  return (
    <>
      <Canvas camera={{ fov: 45, near: 0.5, far: 5000 }} gl={{ antialias: true }}>
        <color attach="background" args={['#04060a']} />
        <Scene angle={angle} throttle={throttle} />
      </Canvas>
      <Panel
        title="M0-S4 · SINGLE-LIGHT HULL"
        rows={[
          ['star azimuth', `${((angle * 180) / Math.PI).toFixed(0)}°`],
          ['plume throttle', `${(throttle * 100).toFixed(0)} %`],
          ['fill light', '0.012 ambient (starlight only)'],
        ]}
      >
        <div style={{ color: '#8d9aa8' }}>
          ←/→ move the star around the hull · ↑/↓ throttle the plume
          {'\n'}Judge: does the unlit side read as a ship, not a silhouette cut-out?
          {'\n'}Does the plume light the skirt and radiator roots convincingly?
        </div>
      </Panel>
    </>
  )
}
