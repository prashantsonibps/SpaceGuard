'use client'

import { Component, ReactNode, useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, Sphere } from '@react-three/drei'
import * as THREE from 'three'

// ── Error boundary (catches useTexture suspension errors) ──────────────────
class EarthErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

// ── Fallback: procedural blue sphere (no texture needed) ───────────────────
function EarthFallback() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05
  })
  return (
    <Sphere ref={ref} args={[1, 64, 64]}>
      <meshStandardMaterial color="#1a5276" roughness={0.7} metalness={0.1} />
    </Sphere>
  )
}

// ── Inner component that suspends while loading the texture ────────────────
const EARTH_TEXTURE_URL =
  'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg'

function EarthSphere() {
  const ref = useRef<THREE.Mesh>(null)
  const texture = useTexture(EARTH_TEXTURE_URL)

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05
  })

  return (
    <Sphere ref={ref} args={[1, 64, 64]}>
      <meshStandardMaterial map={texture} roughness={0.8} metalness={0.1} />
    </Sphere>
  )
}

// ── Public export: texture + atmosphere glow ───────────────────────────────
export function Earth() {
  return (
    <group>
      <EarthErrorBoundary fallback={<EarthFallback />}>
        <Suspense fallback={<EarthFallback />}>
          <EarthSphere />
        </Suspense>
      </EarthErrorBoundary>

      {/* Atmosphere glow — inner */}
      <Sphere args={[1.02, 32, 32]}>
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>

      {/* Atmosphere glow — outer ring */}
      <Sphere args={[1.08, 32, 32]}>
        <meshBasicMaterial
          color="#1e40af"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
    </group>
  )
}
