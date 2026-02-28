'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'
import { satellites } from '@/data/satellites'
import { positionOnSphere, sampleOrbit } from '@/lib/orbital'

const VIZ_SCALE = 0.98  // slightly inside atmosphere to avoid z-fighting

const PULSING_IDS = new Set(['ISS', 'SL-1492', 'DEB-2847', 'COSMOS-2251'])

interface SatRef {
  mesh: THREE.Mesh | null
}

export function SatelliteMarkers() {
  const satRefs = useRef<SatRef[]>(satellites.map(() => ({ mesh: null })))
  const startTime = useRef(Date.now())

  // Pre-compute static orbit paths
  const orbitPaths = useMemo(
    () =>
      satellites.map((sat) =>
        sampleOrbit(sat.altitudeKm, sat.inclinationDeg, sat.raanDeg, 128, 0, VIZ_SCALE),
      ),
    [],
  )

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

      // Pulse critical/high satellites
      if (PULSING_IDS.has(sat.id)) {
        const pulse = 1 + Math.sin(elapsed * 3) * 0.3
        ref.mesh.scale.setScalar(pulse)
      }
    })
  })

  return (
    <group>
      {/* Orbit lines */}
      {satellites.map((sat, i) => (
        <Line
          key={`orbit-${sat.id}`}
          points={orbitPaths[i]}
          color={sat.color}
          lineWidth={0.5}
          transparent
          opacity={0.2}
        />
      ))}

      {/* Satellite dots */}
      {satellites.map((sat, i) => {
        const size = 0.012 * (sat.size ?? 1)
        return (
          <Sphere
            key={`sat-${sat.id}`}
            ref={(mesh) => {
              satRefs.current[i].mesh = mesh
            }}
            args={[size, 8, 8]}
          >
            <meshStandardMaterial
              color={sat.color}
              emissive={sat.color}
              emissiveIntensity={2}
            />
          </Sphere>
        )
      })}
    </group>
  )
}
