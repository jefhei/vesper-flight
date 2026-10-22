import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import type { Group, PointLight } from 'three'
import type { ShipState } from '../types/flight'

const RADIATOR_COLOR = '#ff3b1f'

type WhiteBoxProps = {
  throttle?: number
  throttleRef?: RefObject<number>
  heat?: number
  ship?: ShipState
}

/** White-box stand-in for the Hound-class hull: the spike is about feel and
 *  light, not greebles. 45 m long, 14 m beam, drive aft at +Z. */
export function WhiteBoxShip({ throttle = 0, throttleRef, heat = 0, ship }: WhiteBoxProps) {
  const radiators = useMemo(
    () =>
      [
        { pos: [-9.5, 0, 2], rot: [0, 0, 0.25] },
        { pos: [9.5, 0, 2], rot: [0, 0, -0.25] },
        { pos: [0, 8.5, 2], rot: [0.25, 0, 0] },
        { pos: [0, -8.5, 2], rot: [-0.25, 0, 0] },
      ] as Array<{ pos: [number, number, number]; rot: [number, number, number] }>,
    [],
  )

  return (
    <group quaternion={ship ? ship.quat : [0, 0, 0, 1]}>
      <mesh>
        <boxGeometry args={[14, 10, 36]} />
        <meshStandardMaterial color="#8d939c" roughness={0.82} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0, -22]}>
        <boxGeometry args={[9, 6.5, 10]} />
        <meshStandardMaterial color="#7d838c" roughness={0.85} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 20]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[5, 6.5, 6, 24, 1, true]} />
        <meshStandardMaterial color="#5b5a57" roughness={0.6} metalness={0.6} side={2} />
      </mesh>
      <mesh position={[0, 5.06, 8]}>
        <boxGeometry args={[8, 0.12, 2.4]} />
        <meshStandardMaterial color="#d8d3c6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 5.06, 8]}>
        <planeGeometry args={[8, 1.6]} />
        <meshStandardMaterial color="#b8b2a2" roughness={0.9} />
      </mesh>
      {radiators.map((r, i) => (
        <mesh key={i} position={r.pos} rotation={r.rot}>
          <boxGeometry args={[4.5, 0.18, 14]} />
          <meshStandardMaterial
            color="#4c4a47"
            roughness={0.7}
            metalness={0.5}
            emissive={RADIATOR_COLOR}
            emissiveIntensity={Math.min(1, heat) * 1.6}
          />
        </mesh>
      ))}
      <Plume throttle={throttle} throttleRef={throttleRef} />
    </group>
  )
}

function Plume({ throttle, throttleRef }: { throttle: number; throttleRef?: RefObject<number> }) {
  const group = useRef<Group>(null)
  const light = useRef<PointLight>(null)

  useFrame(() => {
    const raw = throttleRef ? throttleRef.current ?? throttle : throttle
    const t = Math.max(0, Math.min(1, Math.abs(raw)))
    if (group.current) {
      group.current.scale.set(0.65 + t * 0.8, 0.65 + t * 0.8, 0.3 + t * 1.6)
      group.current.visible = t > 0.02
    }
    if (light.current) light.current.intensity = t * 3.2
  })

  return (
    <group ref={group} position={[0, 0, 30]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[4, 24, 20, 1, true]} />
        <meshBasicMaterial color="#ffb066" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1.9, 14, 16, 1, true]} />
        <meshBasicMaterial color="#fff0d0" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <pointLight ref={light} color="#ffa657" intensity={1.2} distance={260} position={[0, 0, -6]} />
    </group>
  )
}
