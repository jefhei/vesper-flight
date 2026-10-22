import { AdditiveBlending, BackSide } from 'three'
import type { BodySpec } from '../types/world'
import { usePlanetAssets } from './usePlanetAssets'

type Vec3M = [number, number, number]

/** Planet mesh for the spikes. `positionM` is render-space metres. */
export function Planet({
  body,
  level,
  positionM,
  wireframe = false,
  mapWidth = 512,
}: {
  body: BodySpec
  level: 0 | 1 | 2 | 3
  positionM: Vec3M
  wireframe?: boolean
  mapWidth?: number
}) {
  const { geometry, texture } = usePlanetAssets(body, level, mapWidth)
  return (
    <group position={positionM}>
      <mesh geometry={geometry}>
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0} wireframe={wireframe} />
      </mesh>
      {body.atmosphere ? (
        <mesh geometry={geometry} scale={1.02}>
          <meshBasicMaterial
            color="#7fb6d6"
            transparent
            opacity={0.16}
            side={BackSide}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  )
}

/** Cheap star: emissive disc + corona-ish shell. No lens flare, by policy. */
export function Star({ radiusM, positionM }: { radiusM: number; positionM: Vec3M }) {
  return (
    <group position={positionM}>
      <mesh>
        <sphereGeometry args={[radiusM, 32, 24]} />
        <meshBasicMaterial color="#ffd2a1" />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[radiusM, 24, 18]} />
        <meshBasicMaterial color="#ff9d4d" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}
