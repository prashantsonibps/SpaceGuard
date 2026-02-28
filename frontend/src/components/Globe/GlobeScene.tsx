'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Earth } from './Earth'
import { SatelliteMarkers } from './SatelliteMarkers'
import { ConjunctionAlerts } from './ConjunctionAlerts'

function SceneContent() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} />
      <pointLight position={[-5, -3, -5]} intensity={0.2} color="#1e40af" />

      {/* Star field */}
      <Stars radius={300} depth={60} count={6000} factor={4} saturation={0} fade />

      {/* Earth + satellites */}
      <Suspense fallback={null}>
        <Earth />
        <SatelliteMarkers />
        <ConjunctionAlerts />
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

      {/* Post-processing bloom for satellite glow */}
      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.3}
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
      style={{ background: '#020817' }}
      gl={{ antialias: true, alpha: false }}
    >
      <SceneContent />
    </Canvas>
  )
}
