'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Earth } from './Earth'
import { SatelliteMarkers } from './SatelliteMarkers'

// Stars anchored to camera position so they behave like a proper skybox.
// depth=0 puts all stars on a single shell — no parallax between layers.
function SkyStars() {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(camera.position)
    }
  })

  return (
    <group ref={groupRef}>
      <Stars radius={100} depth={0} count={2000} factor={3} saturation={0} />
    </group>
  )
}

function SceneContent() {
  return (
    <>
      {/* Lighting — neutral white for black/white dotted aesthetic */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} color="#ffffff" />

      {/* Star field — anchored to camera, no depth spread */}
      <SkyStars />

      {/* Earth + satellites */}
      <Suspense fallback={null}>
        <Earth autoRotate={false} />
        <SatelliteMarkers />
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

export function GlobeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.5], fov: 50 }}
      style={{ background: '#000000' }}
      gl={{ antialias: true, alpha: false }}
    >
      <SceneContent />
    </Canvas>
  )
}
