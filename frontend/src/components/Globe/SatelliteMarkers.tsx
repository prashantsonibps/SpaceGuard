'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { satellites } from '@/data/satellites'
import { positionOnSphere } from '@/lib/orbital'

const VIZ_SCALE = 0.98
const DOT_SIZE = 0.004

interface SatRef {
  mesh: THREE.Mesh | null
}

export function SatelliteMarkers() {
  const satRefs = useRef<SatRef[]>(satellites.map(() => ({ mesh: null })))
  const startTime = useRef(Date.now())

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000

    satellites.forEach((sat, i) => {
      const ref = satRefs.current[i]
      if (!ref.mesh) return

      const phase0 = ((sat.phase0Deg ?? 0) * Math.PI) / 180
      const [x, y, z] = positionOnSphere(
        sat.altitudeKm,
        sat.inclinationDeg,
        sat.raanDeg,
        elapsed,
        phase0,
        VIZ_SCALE,
      )
      ref.mesh.position.set(x, y, z)
    })
  })

  return (
    <group>
      {satellites.map((sat, i) => (
        <Sphere
          key={`sat-${sat.id}`}
          ref={(mesh) => {
            satRefs.current[i].mesh = mesh
          }}
          args={[DOT_SIZE, 5, 5]}
        >
          <meshBasicMaterial color="#d0d8e4" />
        </Sphere>
      ))}
    </group>
  )
}
