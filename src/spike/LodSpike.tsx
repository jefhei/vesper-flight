import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { lodLevelFor, altitudeRadii, type LodLevel } from '../lib/bodies/lod'
import { VESPER_SYSTEM } from '../lib/world/systems'
import { Planet, Star } from './Bodies'
import { Panel, fmt } from './Panel'
import { useKeys } from './useKeys'

function Approach({
  bodyId,
  wireframe,
  onHud,
}: {
  bodyId: string
  wireframe: boolean
  onHud: (hud: { alt: number; lod: LodLevel; tris: number; distanceKm: number }) => void
}) {
  const body = VESPER_SYSTEM.bodies.find((b) => b.id === bodyId) ?? VESPER_SYSTEM.bodies[0]
  const radiusKm = body.radiusKm
  const camera = useThree((s) => s.camera)
  const keys = useKeys()
  const altRef = useRef(8)
  const lodRef = useRef<LodLevel>(0)
  const lastReport = useRef(0)

  useFrame((_, dt) => {
    if (keys.current.has('KeyR')) altRef.current = 8
    altRef.current = Math.max(1.02, altRef.current - dt * 0.28)

    const distanceKm = radiusKm * (1 + altRef.current)
    const lod = lodLevelFor(distanceKm, radiusKm, lodRef.current)
    lodRef.current = lod

    const distanceM = distanceKm * 1000
    camera.position.set(0, distanceM * 0.06, distanceM)
    camera.lookAt(0, 0, 0)

    const now = performance.now()
    if (now - lastReport.current > 100) {
      lastReport.current = now
      const tris = 6 * (8 * 2 ** lod) ** 2 * 2
      onHud({
        alt: altitudeRadii(distanceKm, radiusKm),
        lod,
        tris,
        distanceKm,
      })
    }
  })

  return (
    <>
      <ambientLight intensity={0.02} />
      <directionalLight position={[1, 0.25, 0.4]} intensity={3} color="#ffd9a8" />
      <Planet body={body} level={lodRef.current} positionM={[0, 0, 0]} wireframe={wireframe} />
      <Star radiusM={45_000_000} positionM={[-4e9, 1e8, -2e9]} />
    </>
  )
}

export function LodSpike({ bodyId }: { bodyId: string }) {
  const [wireframe, setWireframe] = useState(false)
  const [hud, setHud] = useState({ alt: 8, lod: 0 as LodLevel, tris: 768, distanceKm: 0 })

  return (
    <>
      <Canvas
        camera={{ fov: 50, near: 0.5, far: 2e9 }}
        gl={{ logarithmicDepthBuffer: true, antialias: true }}
      >
        <color attach="background" args={['#05070b']} />
        <Approach bodyId={bodyId} wireframe={wireframe} onHud={setHud} />
      </Canvas>
      <Panel
        title="M0-S2 · PLANET LOD"
        rows={[
          ['body', bodyId],
          ['altitude', `${hud.alt.toFixed(3)} radii`],
          ['distance', `${fmt(hud.distanceKm)} km`],
          ['lod level', `${hud.lod} (${8 * 2 ** hud.lod} div/face)`],
          ['triangles', fmt(hud.tris)],
          ['mode', wireframe ? 'wireframe' : 'shaded'],
        ]}
      >
        <div style={{ color: '#8d9aa8' }}>
          Automatic 12-step approach, loops slow → fast. R = restart, W = wireframe.
          {'\n'}Judge: popping, seam cracking, texture swim.
        </div>
      </Panel>
      <button
        onClick={() => setWireframe((w) => !w)}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 12,
          zIndex: 10,
          padding: '6px 12px',
          background: '#14181e',
          color: '#e9e4d8',
          border: '1px solid #2a2f36',
          borderRadius: 4,
          font: '12px ui-monospace, monospace',
        }}
      >
        wireframe (W)
      </button>
      <KeyWireframeToggle onToggle={() => setWireframe((w) => !w)} />
    </>
  )
}

function KeyWireframeToggle({ onToggle }: { onToggle: () => void }) {
  const keys = useKeys()
  const wasDown = useRef(false)
  useEffect(() => {
    const id = window.setInterval(() => {
      const down = keys.current.has('KeyW')
      if (down && !wasDown.current) onToggle()
      wasDown.current = down
    }, 60)
    return () => window.clearInterval(id)
  }, [keys, onToggle])
  return null
}
