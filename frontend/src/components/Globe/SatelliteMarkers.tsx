'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { satellites } from '@/data/satellites'
import { conjunctionEvents, RiskLevel } from '@/data/conjunctions'
import { positionOnSphere } from '@/lib/orbital'

const VIZ_SCALE = 0.98
const DOT_SIZE = 0.004

// Build satellite ID → highest risk level from conjunction events
const riskPriority: Record<RiskLevel, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
const satRiskMap = new Map<string, RiskLevel>()
for (const evt of conjunctionEvents) {
  for (const satId of [evt.satA, evt.satB]) {
    const existing = satRiskMap.get(satId)
    if (!existing || riskPriority[evt.riskLevel] > riskPriority[existing]) {
      satRiskMap.set(satId, evt.riskLevel)
    }
  }
}

const RISK_COLORS: Record<RiskLevel, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#ffffff',
}

function satColor(id: string): string {
  const risk = satRiskMap.get(id)
  return risk ? RISK_COLORS[risk] : '#ffffff'
}

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
          args={[DOT_SIZE, 16, 16]}
        >
          <meshBasicMaterial color={satColor(sat.id)} />
        </Sphere>
      ))}
    </group>
  )
}
