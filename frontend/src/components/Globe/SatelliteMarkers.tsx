'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'
import { positionOnSphere, sampleOrbit } from '@/lib/orbital'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { ConjunctionEvent, RiskLevel } from '@/components/Dashboard/EventsPanel'

const VIZ_SCALE = 0.98
const DOT_SIZE = 0.004

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#4ade80',
}

// In a full production app, we would parse TLEs in the frontend to propagate the exact orbit.
// For the 3D visualization, we will generate placeholder satellites and highlight the real ones
// from the database if they are involved in conjunctions.
export function SatelliteMarkers() {
  const [events, setEvents] = useState<ConjunctionEvent[]>([])
  
  // Create 500 background "dots" to simulate the satellite cloud
  const [backgroundSats] = useState(() => {
    const sats = []
    for (let i = 0; i < 500; i++) {
      sats.push({
        id: `bg-${i}`,
        altitudeKm: 400 + Math.random() * 1000,
        inclinationDeg: Math.random() * 180,
        raanDeg: Math.random() * 360,
        phase0Deg: Math.random() * 360,
        speedFactor: 0.5 + Math.random()
      })
    }
    return sats
  })

  // Listen to live conjunctions from Firebase
  useEffect(() => {
    const q = query(collection(db, 'conjunction_events'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEvents: ConjunctionEvent[] = []
      snapshot.forEach((doc) => {
        newEvents.push({ id: doc.id, ...doc.data() } as ConjunctionEvent)
      })
      setEvents(newEvents)
    })
    return () => unsubscribe()
  }, [])

  const satRefs = useRef<(THREE.Mesh | null)[]>([])
  const startTime = useRef(Date.now())

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000

    backgroundSats.forEach((sat, i) => {
      const mesh = satRefs.current[i]
      if (!mesh) return

      const phase0 = ((sat.phase0Deg ?? 0) * Math.PI) / 180
      const [x, y, z] = positionOnSphere(
        sat.altitudeKm,
        sat.inclinationDeg,
        sat.raanDeg,
        elapsed * sat.speedFactor,
        phase0,
        VIZ_SCALE,
      )
      mesh.position.set(x, y, z)
    })
  })

  // We want to specifically render and highlight the satellites involved in conjunctions
  const activeSatellites = new Map<string, RiskLevel>()
  events.forEach(evt => {
    activeSatellites.set(evt.asset_id, evt.risk_level)
    activeSatellites.set(evt.secondary_id, evt.risk_level)
  })

  return (
    <group>
      {/* Background Satellites */}
      {backgroundSats.map((sat, i) => (
        <Sphere
          key={sat.id}
          ref={(mesh) => {
            satRefs.current[i] = mesh
          }}
          args={[DOT_SIZE, 8, 8]}
        >
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </Sphere>
      ))}

      {/* High-Risk Satellites (Rendered dynamically based on DB) */}
      {Array.from(activeSatellites.entries()).map(([id, risk], i) => (
        <ActiveSatelliteMarker
          key={id}
          id={id}
          risk={risk}
          index={i}
        />
      ))}
    </group>
  )
}

function ActiveSatelliteMarker({
  id,
  risk,
  index,
}: {
  id: string
  risk: RiskLevel
  index: number
}) {
  // Position them statically for the demo or give them a fixed orbit path
  // so they stand out in the 3D globe.
  const alt = 450 + index * 10
  const inclination = 51.6
  const raan = index * 45

  const points = useMemo(
    () => sampleOrbit(alt, inclination, raan, 128, 0, VIZ_SCALE),
    [alt, inclination, raan]
  )

  const [x, y, z] = positionOnSphere(alt, inclination, raan, 0, 0, VIZ_SCALE)

  return (
    <group>
      <Line
        points={points}
        color={RISK_COLORS[risk] || '#ffffff'}
        transparent
        opacity={0.3}
        lineWidth={1}
      />
      <Sphere position={[x, y, z]} args={[DOT_SIZE * 3, 16, 16]}>
        <meshBasicMaterial color={RISK_COLORS[risk] || '#ffffff'} />
      </Sphere>
    </group>
  )
}
