'use client'

import { Suspense, useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Earth } from './Earth'
import { SatelliteMarkers } from './SatelliteMarkers'
import { globeColors } from '@/lib/theme'
import { useTheme } from '@/lib/ThemeContext'

// Custom star field — anchored to camera (skybox behaviour), full control over size/color.
function SkyStars({ theme }: { theme: 'dark' | 'light' }) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  const positions = useMemo(() => {
    const arr = new Float32Array(2000 * 3)
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      arr[i * 3]     = 100 * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = 100 * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = 100 * Math.cos(phi)
    }
    return arr
  }, [])

  useFrame(() => {
    if (groupRef.current) groupRef.current.position.copy(camera.position)
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.18} color={globeColors[theme].stars} sizeAttenuation />
      </points>
    </group>
  )
}

function AnimatedBackground({ targetHex }: { targetHex: string }) {
  const { scene } = useThree()
  const current = useRef(new THREE.Color(targetHex))
  const target  = useRef(new THREE.Color(targetHex))

  useEffect(() => { target.current.set(targetHex) }, [targetHex])

  useFrame(() => {
    current.current.lerp(target.current, 0.6)
    scene.background = current.current
  })

  return null
}

function SceneContent({
  selectedEventId,
  onSelectEvent,
  theme,
}: {
  selectedEventId?: string | null
  onSelectEvent?: (id: string | null) => void
  theme: 'dark' | 'light'
}) {
  const canvas = globeColors[theme].canvas
  return (
    <>
      {/* Smoothly lerp the WebGL clear color on theme change */}
      <AnimatedBackground targetHex={canvas} />

      {/* Lighting — neutral white for black/white dotted aesthetic */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} color="#ffffff" />

      {/* Star field — anchored to camera, no depth spread */}
      <SkyStars theme={theme} />

      {/* Earth + satellites */}
      <Suspense fallback={null}>
        <Earth autoRotate={false} theme={theme} />
        <SatelliteMarkers selectedEventId={selectedEventId} onSelectEvent={onSelectEvent} theme={theme} />
      </Suspense>

      {/* Camera controls — damping disabled for instant response */}
      <OrbitControls
        enableZoom
        enablePan={false}
        enableDamping={false}
        minDistance={1.5}
        maxDistance={6}
      />

      {/* Subtle bloom — makes white dots glow slightly */}
      <EffectComposer>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </>
  )
}

export function GlobeScene({
  selectedEventId,
  onSelectEvent,
}: {
  selectedEventId?: string | null
  onSelectEvent?: (id: string | null) => void
}) {
  const { theme } = useTheme()
  const [visible, setVisible] = useState(false)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease-in',
      }}
    >
      <Canvas
        camera={{ position: [3.2, 2.0, 0.4], fov: 50 }}
        style={{ background: globeColors[theme].canvas }}
        gl={{ antialias: true, alpha: false }}
        onCreated={() => setVisible(true)}
      >
        <SceneContent selectedEventId={selectedEventId} onSelectEvent={onSelectEvent} theme={theme} />
      </Canvas>
    </div>
  )
}
