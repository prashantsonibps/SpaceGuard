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

// ── Fallback: procedural dark grey sphere (no texture needed) ──────────────
function EarthFallback() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05
  })
  return (
    <Sphere ref={ref} args={[1, 64, 64]}>
      <meshStandardMaterial color="#888888" roughness={0.9} metalness={0} />
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
      <meshStandardMaterial
        map={texture}
        color="#aaaaaa"
        roughness={0.95}
        metalness={0}
      />
    </Sphere>
  )
}

// ── Public export: texture + wireframe grid + subtle atmosphere ────────────
export function Earth() {
  return (
    <group>
      <EarthErrorBoundary fallback={<EarthFallback />}>
        <Suspense fallback={<EarthFallback />}>
          <EarthSphere />
        </Suspense>
      </EarthErrorBoundary>

      {/* Wireframe grid overlay — gives the ASCII/terminal aesthetic */}
      <Sphere args={[1.001, 24, 12]}>
        <meshBasicMaterial
          wireframe
          color="#ffffff"
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </Sphere>

      {/* Atmosphere glow — subtle white rim */}
      <Sphere args={[1.03, 32, 32]}>
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.035}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
    </group>
  )
}
