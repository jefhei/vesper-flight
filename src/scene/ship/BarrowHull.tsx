import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  Matrix4,
  SRGBColorSpace,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  type PointLight,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  HULL_LANDMARKS,
  HULL_PARTS,
  type HullPart,
  type PartGroup,
} from '../../lib/ship/hullSpec'
import { wedgeGeometry } from '../../lib/ship/primitives'
import type { ShipState } from '../../types/flight'

/** Draw calls this hull costs: hull merge, radiators, lights, nameplate, two
 *  plume cones. PRD §10 allows ≤ 6 for the whole ship. */
export const HULL_DRAW_CALLS = 6

function baseGeometry(part: HullPart): BufferGeometry {
  if (part.kind === 'wedge') {
    const [widthFront, heightFront] = part.taperFront ?? [part.size[0], part.size[1]]
    const mesh = wedgeGeometry(part.size[2], widthFront, heightFront, part.size[0], part.size[1])
    const geom = new BufferGeometry()
    geom.setAttribute('position', new BufferAttribute(mesh.positions, 3))
    geom.setAttribute('uv', new BufferAttribute(mesh.uvs, 2))
    geom.setIndex(
      Array.from({ length: mesh.triangleCount * 3 }, (_, i) => i),
    )
    const indexed = geom.toNonIndexed()
    geom.dispose()
    return indexed
  }
  if (part.kind === 'cylinder') {
    const radiusBottom = part.size[0]
    const radiusTop = radiusBottom * (part.radiusTopRatio ?? 1)
    return new CylinderGeometry(
      radiusTop,
      radiusBottom,
      part.size[1],
      24,
      1,
      part.openEnded ?? false,
    ).toNonIndexed()
  }
  return new BoxGeometry(part.size[0], part.size[1], part.size[2]).toNonIndexed()
}

/** Parts → one merged geometry per group, each carrying per-vertex colour so a
 *  single material covers the whole plated hull (one draw call). */
function buildGroup(parts: HullPart[]): BufferGeometry | null {
  const geometries: BufferGeometry[] = []
  const color = new Color()

  for (const part of parts) {
    const geom = baseGeometry(part)
    const euler = new Euler(...(part.rot ?? [0, 0, 0]))
    const matrix = new Matrix4().makeRotationFromEuler(euler)
    matrix.setPosition(part.pos[0], part.pos[1], part.pos[2])
    geom.applyMatrix4(matrix)
    geom.computeVertexNormals()

    color.setStyle(part.color, SRGBColorSpace)
    const count = geom.getAttribute('position').count
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    geom.setAttribute('color', new BufferAttribute(colors, 3))
    geometries.push(geom)
  }

  if (geometries.length === 0) return null
  const merged = mergeGeometries(geometries, false)
  // Merge copies the data; the sources own their buffers and must go.
  for (const g of geometries) g.dispose()
  return merged
}

function nameplateTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 210
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#15171a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#6a6a63'
  ctx.lineWidth = 8
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24)

  ctx.fillStyle = '#d8d3c6'
  ctx.font = 'bold 104px ui-monospace, Menlo, monospace'
  ctx.textBaseline = 'middle'
  ctx.fillText('BARROW', 56, 96)

  ctx.fillStyle = '#9c9a90'
  ctx.font = '58px ui-monospace, Menlo, monospace'
  ctx.fillText('HD-441', 640, 108)

  // Grime streaks so the plate does not read as a perfect rectangle.
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#000000'
  for (let i = 0; i < 40; i++) {
    const x = (i * 137) % canvas.width
    ctx.fillRect(x, 0, 2 + (i % 5), canvas.height * (0.3 + ((i * 7) % 10) / 20))
  }
  ctx.globalAlpha = 1

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function useMerged() {
  const hull = useMemo(
    () => buildGroup(HULL_PARTS.filter((p) => p.group === 'hull')),
    [],
  )
  const radiators = useMemo(
    () => buildGroup(HULL_PARTS.filter((p) => p.group === 'radiator')),
    [],
  )
  const lights = useMemo(
    () => buildGroup(HULL_PARTS.filter((p) => p.group === 'light')),
    [],
  )

  useEffect(() => {
    return () => {
      hull?.dispose()
      radiators?.dispose()
      lights?.dispose()
    }
  }, [hull, radiators, lights])

  return { hull, radiators, lights }
}

export function BarrowHull({
  ship,
  throttle = 0,
  throttleRef,
  heat = 0.35,
}: {
  ship?: ShipState
  throttle?: number
  throttleRef?: RefObject<number>
  heat?: number
}) {
  const { hull, radiators, lights } = useMerged()
  const radMaterial = useRef<MeshStandardMaterial>(null)
  const plate = useRef<Mesh>(null)
  const plateTexture = useMemo(() => nameplateTexture(), [])
  const heatRef = useRef(heat)
  const [nx, ny, nz] = HULL_LANDMARKS.nameplate.pos

  useEffect(() => {
    return () => {
      plateTexture?.dispose()
    }
  }, [plateTexture])

  useFrame((_, dt) => {
    const raw = throttleRef ? (throttleRef.current ?? throttle) : throttle
    const command = Math.abs(raw)
    // Radiators heat with sustained thrust and cool when coasting.
    const target = Math.min(1, command * 1.15)
    const rate = target > heatRef.current ? 0.55 : 0.18
    heatRef.current += (target - heatRef.current) * Math.min(1, dt * rate * 3)
    if (radMaterial.current) {
      radMaterial.current.emissiveIntensity = 0.01 + heatRef.current * 0.16
    }
    if (plate.current && plateTexture) {
      // Keep the nameplate square to the hull; nothing else to animate yet.
      plate.current.visible = true
    }
  })

  return (
    <group quaternion={ship ? ship.quat : [0, 0, 0, 1]}>
      {hull ? (
        <mesh geometry={hull}>
          <meshStandardMaterial vertexColors roughness={0.84} metalness={0.3} />
        </mesh>
      ) : null}
      {radiators ? (
        <mesh geometry={radiators}>
          <meshStandardMaterial
            ref={radMaterial}
            vertexColors
            roughness={0.68}
            metalness={0.45}
            emissive="#8c2408"
            emissiveIntensity={0.01}
          />
        </mesh>
      ) : null}
      {lights ? (
        <mesh geometry={lights}>
          <meshBasicMaterial vertexColors toneMapped={false} />
        </mesh>
      ) : null}
      {plateTexture ? (
        <mesh ref={plate} position={[nx, ny, nz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[HULL_LANDMARKS.nameplate.size[0], HULL_LANDMARKS.nameplate.size[1]]} />
          <meshStandardMaterial map={plateTexture} roughness={0.9} metalness={0.1} />
        </mesh>
      ) : null}
      <TorchPlume throttle={throttle} throttleRef={throttleRef} />
    </group>
  )
}

/** Additive torch plume from the nozzle lip (+Z). Two cones: a wide amber
 *  envelope and a hot core. Length and brightness track throttle. */
function TorchPlume({ throttle, throttleRef }: { throttle: number; throttleRef?: RefObject<number> }) {
  const group = useRef<Group>(null)
  const light = useRef<PointLight>(null)

  useFrame(() => {
    const raw = throttleRef ? (throttleRef.current ?? throttle) : throttle
    const t = Math.max(0, Math.min(1, Math.abs(raw)))
    if (group.current) {
      group.current.scale.set(0.55 + t * 1.1, 0.55 + t * 1.1, 0.25 + t * 2.2)
      group.current.visible = t > 0.02
    }
    if (light.current) light.current.intensity = t * 4.2
  })

  return (
    <group ref={group} position={[0, 0, HULL_LANDMARKS.plumeExitZ + 13]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[4.6, 26, 24, 1, true]} />
        <meshBasicMaterial
          color="#ff9a45"
          transparent
          opacity={0.42}
          depthWrite={false}
          side={DoubleSide}
          blending={2}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1.9, 15, 18, 1, true]} />
        <meshBasicMaterial
          color="#ffe6a8"
          transparent
          opacity={0.32}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <pointLight ref={light} color="#ffa657" intensity={1.6} distance={320} position={[0, 0, -6]} />
    </group>
  )
}

/** Kept explicit so the parts list and the group names cannot drift apart. */
export const HULL_GROUPS: PartGroup[] = ['hull', 'radiator', 'light']
