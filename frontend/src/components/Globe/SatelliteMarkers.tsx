'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'
import { positionOnSphere, sampleOrbit } from '@/lib/orbital'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { ConjunctionEvent } from '@/components/Dashboard/EventsPanel'

const VIZ_SCALE = 0.98
const DOT_SIZE = 0.004

function probToColor(prob: number): string {
  if (prob >= 0.1)  return '#ef4444' // red    — ≥10%
  if (prob >= 0.01) return '#f97316' // orange — ≥1%
  if (prob >= 0.001) return '#eab308' // yellow — ≥0.1%
  return '#4ade80'                    // green  — <0.1%
}

// In a full production app, we would parse TLEs in the frontend to propagate the exact orbit.
// For the 3D visualization, we will generate placeholder satellites and highlight the real ones
// from the database if they are involved in conjunctions.
export function SatelliteMarkers({ selectedEventId }: { selectedEventId?: string | null }) {
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

  // Build a map of all active satellites with their probability color
  const allActiveSats = new Map<string, string>()
  events.forEach((evt) => {
    const color = probToColor(evt.collision_probability ?? 0)
    allActiveSats.set(evt.asset_id, color)
    allActiveSats.set(evt.secondary_id, color)
  })

  // Only show orbit lines for the selected event
  const selectedEvent = selectedEventId ? events.find((e) => e.id === selectedEventId) : null
  const selectedSatIds = new Set(
    selectedEvent ? [selectedEvent.asset_id, selectedEvent.secondary_id] : []
  )

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

      {/* Colored dots always visible; orbit lines only for selected event */}
      {Array.from(allActiveSats.entries()).map(([id, color], i) => (
        <ActiveSatelliteMarker
          key={id}
          id={id}
          color={color}
          index={i}
          showLine={selectedSatIds.has(id)}
        />
      ))}
    </group>
  )
}

function ActiveSatelliteMarker({
  id,
  color,
  index,
  showLine,
}: {
  id: string
  color: string
  index: number
  showLine: boolean
}) {
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
      {showLine && (
        <Line
          points={points}
          color={color}
          transparent
          opacity={0.35}
          lineWidth={1.5}
        />
      )}
      <Sphere position={[x, y, z]} args={[DOT_SIZE * 3, 16, 16]}>
        <meshBasicMaterial color={color} />
      </Sphere>
    </group>
  )
}
