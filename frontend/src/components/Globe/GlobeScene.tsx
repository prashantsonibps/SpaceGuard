'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Earth } from './Earth'
import { SatelliteMarkers } from './SatelliteMarkers'

function SceneContent() {
  return (
    <>
      {/* Lighting — neutral white, no colour cast */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />

      {/* Star field */}
      <Stars radius={300} depth={60} count={7000} factor={3} saturation={0} fade />

      {/* Earth + satellites */}
      <Suspense fallback={null}>
        <Earth />
        <SatelliteMarkers />
      </Suspense>

      {/* Camera controls */}
      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        minDistance={1.5}
        maxDistance={6}
      />

      {/* Subtle bloom — just enough to make dots glow */}
      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.5}
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
      style={{ background: '#000000', filter: 'saturate(0) brightness(1.05)' }}
      gl={{ antialias: true, alpha: false }}
    >
      <SceneContent />
    </Canvas>
  )
}
