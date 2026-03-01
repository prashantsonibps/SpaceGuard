'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'
import { positionOnSphere } from '@/lib/orbital'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { ConjunctionEvent } from '@/components/Dashboard/EventsPanel'
import { riskClasses } from '@/lib/theme'

const VIZ_SCALE = 0.98

interface AlertMarker {
  mesh: THREE.Mesh | null
  lineRef: THREE.Line | null
}

export function ConjunctionAlerts({ theme }: { theme: 'dark' | 'light' }) {
  const [events, setEvents] = useState<ConjunctionEvent[]>([])

  const riskColors: Record<string, string> = {
    CRITICAL: riskClasses[theme].CRITICAL.hex,
    HIGH: riskClasses[theme].HIGH.hex,
    MEDIUM: riskClasses[theme].MEDIUM.hex,
    LOW: riskClasses[theme].LOW.hex,
  }

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

  const markerRefs = useRef<AlertMarker[]>([])
  const linePositions = useRef<Float32Array[]>([])

  useEffect(() => {
    markerRefs.current = events.map(() => ({ mesh: null, lineRef: null }))
    linePositions.current = events.map(() => new Float32Array(6))
  }, [events])

  const startTime = useRef(Date.now())

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000

    events.forEach((evt, i) => {
      const ref = markerRefs.current[i]
      if (!ref) return

      const altA = 450 + (i * 10)
      const altB = 455 + (i * 10)

      const posA = positionOnSphere(altA, 51.6, i * 45, elapsed, 0, VIZ_SCALE)
      const posB = positionOnSphere(altB, 51.6, i * 45, elapsed, Math.PI / 32, VIZ_SCALE)

      const mx = (posA[0] + posB[0]) / 2
      const my = (posA[1] + posB[1]) / 2
      const mz = (posA[2] + posB[2]) / 2

      if (ref.mesh) {
        ref.mesh.position.set(mx, my, mz)
      }

      if (linePositions.current[i]) {
        const buf = linePositions.current[i]
        buf[0] = posA[0]; buf[1] = posA[1]; buf[2] = posA[2]
        buf[3] = posB[0]; buf[4] = posB[1]; buf[5] = posB[2]
      }
    })
  })

  return (
    <group>
      {events.map((evt, i) => {
        const color = riskColors[evt.risk_level] || '#ffffff'
        const isHighRisk = evt.risk_level === 'CRITICAL' || evt.risk_level === 'HIGH'

        return (
          <group key={evt.id}>
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

            <Sphere
              ref={(mesh) => {
                if (markerRefs.current[i]) {
                  markerRefs.current[i].mesh = mesh
                }
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
