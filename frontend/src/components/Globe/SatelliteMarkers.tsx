'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { satellites } from '@/data/satellites'
import { positionOnSphere } from '@/lib/orbital'

const VIZ_SCALE = 0.98

// Satellites involved in conjunction events — rendered slightly brighter
const FLAGGED_IDS = new Set(['ISS', 'SL-1492', 'DEB-2847', 'COSMOS-2251', 'GPS-IIF-3', 'SL-2891', 'NOAA-19', 'DEB-901', 'SL-0341-DEB'])

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

      const [x, y, z] = positionOnSphere(
        sat.altitudeKm,
        sat.inclinationDeg,
        sat.raanDeg,
        elapsed,
        0,
        VIZ_SCALE,
      )
      ref.mesh.position.set(x, y, z)
    })
  })

  return (
    <group>
      {satellites.map((sat, i) => {
        const size = 0.006 * (sat.size ?? 1)
        // All satellites render as neutral white/grey dots — color lives on conjunction markers only
        const dotColor = sat.type === 'debris' ? '#475569' : '#c8d3e0'
        return (
          <Sphere
            key={`sat-${sat.id}`}
            ref={(mesh) => {
              satRefs.current[i].mesh = mesh
            }}
            args={[size, 6, 6]}
          >
            <meshStandardMaterial
              color={dotColor}
              emissive={dotColor}
              emissiveIntensity={FLAGGED_IDS.has(sat.id) ? 1.2 : 0.6}
            />
          </Sphere>
        )
      })}
    </group>
  )
}
