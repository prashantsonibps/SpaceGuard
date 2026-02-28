'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'
import { conjunctionEvents } from '@/data/conjunctions'
import { satellites } from '@/data/satellites'
import { positionOnSphere } from '@/lib/orbital'

const VIZ_SCALE = 0.98

const riskColors: Record<string, string> = {
  CRITICAL: '#f43f5e',
  HIGH: '#fb923c',
  MEDIUM: '#facc15',
  LOW: '#4ade80',
}

interface AlertMarker {
  mesh: THREE.Mesh | null
  lineRef: THREE.Line | null
}

export function ConjunctionAlerts() {
  const markerRefs = useRef<AlertMarker[]>(
    conjunctionEvents.map(() => ({ mesh: null, lineRef: null })),
  )
  const linePositions = useRef<Float32Array[]>(
    conjunctionEvents.map(() => new Float32Array(6)),
  )
  const startTime = useRef(Date.now())

  const satMap = useMemo(
    () => Object.fromEntries(satellites.map((s) => [s.id, s])),
    [],
  )

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000

    conjunctionEvents.forEach((evt, i) => {
      const ref = markerRefs.current[i]
      const satA = satMap[evt.satA]
      const satB = satMap[evt.satB]
      if (!satA || !satB) return

      const posA = positionOnSphere(
        satA.altitudeKm, satA.inclinationDeg, satA.raanDeg, elapsed, 0, VIZ_SCALE,
      )
      const posB = positionOnSphere(
        satB.altitudeKm, satB.inclinationDeg, satB.raanDeg, elapsed, 0, VIZ_SCALE,
      )

      const mx = (posA[0] + posB[0]) / 2
      const my = (posA[1] + posB[1]) / 2
      const mz = (posA[2] + posB[2]) / 2

      // Place alert marker at midpoint
      if (ref.mesh) {
        ref.mesh.position.set(mx, my, mz)
      }

      // Update line positions
      const buf = linePositions.current[i]
      buf[0] = posA[0]; buf[1] = posA[1]; buf[2] = posA[2]
      buf[3] = posB[0]; buf[4] = posB[1]; buf[5] = posB[2]
    })
  })

  return (
    <group>
      {conjunctionEvents.map((evt, i) => {
        const color = riskColors[evt.riskLevel]
        const isHighRisk = evt.riskLevel === 'CRITICAL' || evt.riskLevel === 'HIGH'

        return (
          <group key={evt.id}>
            {/* Connection line between satellites (only for high-risk) */}
            {isHighRisk && (
              <Line
                points={[
                  [0, 0, 0],
                  [0.1, 0.1, 0.1],
                ]}
                color={color}
                lineWidth={1}
                transparent
                opacity={0.4}
                dashed
                dashSize={0.02}
                gapSize={0.01}
              />
            )}

            {/* Pulsing alert sphere at midpoint */}
            <Sphere
              ref={(mesh) => {
                markerRefs.current[i].mesh = mesh
              }}
              args={[isHighRisk ? 0.028 : 0.018, 12, 12]}
            >
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isHighRisk ? 4 : 2}
                transparent
                opacity={0.9}
              />
            </Sphere>
          </group>
        )
      })}
    </group>
  )
}
