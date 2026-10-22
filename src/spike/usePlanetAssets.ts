import { useEffect, useMemo } from 'react'
import { BufferAttribute, BufferGeometry } from 'three'
import { quadSphere } from '../lib/bodies/quadsphere'
import { displacementSampler, generateSurfaceMap } from '../lib/bodies/surface'
import type { BodySpec } from '../types/world'
import { DataTexture, RGBAFormat, RepeatWrapping, SRGBColorSpace } from 'three'

/** White-box planet for the M0 spikes: quad-sphere LOD + baked equirect albedo. */
export function usePlanetAssets(body: BodySpec, level: number, mapWidth = 512) {
  const height = Math.max(8, Math.round(mapWidth / 2))
  const bake = useMemo(
    () => generateSurfaceMap(body.surface, mapWidth, height),
    [body.surface, mapWidth, height],
  )

  const texture = useMemo(() => {
    const tex = new DataTexture(bake.rgba, bake.width, bake.height, RGBAFormat)
    tex.colorSpace = SRGBColorSpace
    tex.wrapS = RepeatWrapping
    tex.needsUpdate = true
    return tex
  }, [bake])

  const geometry = useMemo(() => {
    const radiusM = body.radiusKm * 1000
    const displace = displacementSampler(bake, radiusM * 0.012)
    const mesh = quadSphere(level, radiusM, displace, radiusM * 0.01)
    const geom = new BufferGeometry()
    geom.setAttribute('position', new BufferAttribute(mesh.positions, 3))
    geom.setAttribute('normal', new BufferAttribute(mesh.normals, 3))
    geom.setAttribute('uv', new BufferAttribute(mesh.uvs, 2))
    geom.setIndex(new BufferAttribute(mesh.indices, 1))
    geom.computeBoundingSphere()
    return geom
  }, [body.radiusKm, bake, level])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  return { geometry, texture }
}
