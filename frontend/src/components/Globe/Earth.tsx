'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three-stdlib'
import { globeColors } from '@/lib/theme'

const DOT_COUNT = 10000
const RADIUS = 1

// ─── Vertex shader ────────────────────────────────────────────────────────────
// Samples the world-map texture at each dot's baseUv.
// The map is white = ocean, black = land, so we invert luminance:
//   land   (lum ≈ 0) → size ≈ maxSize  (large dot, visible)
//   ocean  (lum ≈ 1) → size ≈ minSize  (zero → invisible)
// Each PlaneGeometry(1,1) vertex is scaled relative to its sphere-surface center.
const vertexShader = /* glsl */ `
  attribute vec3 center;
  attribute vec2 baseUv;

  uniform float dotSize;

  varying vec2 vUv;
  varying vec2 vBaseUv;

  void main() {
    vUv     = uv;
    vBaseUv = baseUv;

    // All dots are the same fixed size — land vs ocean decided in fragment shader
    vec3 pos = center + (position - center) * dotSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// ─── Fragment shader ──────────────────────────────────────────────────────────
const fragmentShader = /* glsl */ `
  uniform sampler2D tex;
  uniform vec3 landColor;
  uniform vec3 oceanColor;

  varying vec2 vUv;
  varying vec2 vBaseUv;

  void main() {
    // Clip to circle
    if (length(vUv - 0.5) > 0.5) discard;

    // white = ocean (lum≈1), black = land (lum≈0)
    vec4  c      = texture2D(tex, vBaseUv);
    float lum    = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    float isOcean = step(0.5, lum);
    vec3 color   = mix(landColor, oceanColor, isOcean);

    gl_FragColor = vec4(color, 1.0);
  }
`

// ─── Geometry ─────────────────────────────────────────────────────────────────
function createDottedSphereGeometry(): THREE.BufferGeometry {
  const sph      = new THREE.Spherical()
  const dummyObj = new THREE.Object3D()
  const p        = new THREE.Vector3()
  const geoms: THREE.BufferGeometry[] = []

  const dlong = Math.PI * (3 - Math.sqrt(5))
  const dz    = 2 / DOT_COUNT
  let long = 0
  let z    = 1 - dz / 2

  for (let i = 0; i < DOT_COUNT; i++) {
    const r = Math.sqrt(1 - z * z)
    p.set(Math.cos(long) * r, z, -Math.sin(long) * r).multiplyScalar(RADIUS)
    z    -= dz
    long += dlong

    sph.setFromVector3(p)

    dummyObj.lookAt(p)
    dummyObj.updateMatrix()

    const g = new THREE.PlaneGeometry(1, 1)
    g.applyMatrix4(dummyObj.matrix)
    g.translate(p.x, p.y, p.z)

    const cx = p.x, cy = p.y, cz = p.z
    g.setAttribute('center', new THREE.Float32BufferAttribute(
      [cx, cy, cz, cx, cy, cz, cx, cy, cz, cx, cy, cz], 3
    ))

    const u = (sph.theta + Math.PI) / (Math.PI * 2)
    const v = 1 - sph.phi / Math.PI
    g.setAttribute('baseUv', new THREE.Float32BufferAttribute(
      [u, v, u, v, u, v, u, v], 2
    ))

    geoms.push(g)
  }

  const merged = mergeBufferGeometries(geoms)
  if (!merged) throw new Error('Failed to merge dot geometries')
  return merged
}

// ─── Component ────────────────────────────────────────────────────────────────
interface EarthProps {
  autoRotate?: boolean
  theme: 'dark' | 'light'
}

export function Earth({ autoRotate = true, theme }: EarthProps) {
  const groupRef = useRef<THREE.Group>(null)
  const geometry = useMemo(() => createDottedSphereGeometry(), [])
  const texture  = useLoader(THREE.TextureLoader, '/black_white_map.webp')

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          tex:        { value: texture },
          dotSize:    { value: 0.012 },
          landColor:  { value: new THREE.Color(globeColors[theme].earthLand) },
          oceanColor: { value: new THREE.Color(globeColors[theme].earthOcean) },
        },
        vertexShader,
        fragmentShader,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [texture] // only recreate when texture changes
  )

  // Update material colors reactively when theme changes
  useEffect(() => {
    material.uniforms.landColor.value.set(globeColors[theme].earthLand)
    material.uniforms.oceanColor.value.set(globeColors[theme].earthOcean)
  }, [theme, material])

  useFrame(() => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.001
    }
  })

  return (
    <group ref={groupRef} rotation={[0, Math.PI, 0]}>
      {/* Inner sphere — color adapts to theme */}
      <mesh>
        <sphereGeometry args={[RADIUS - 0.001, 72, 36]} />
        <meshBasicMaterial color={globeColors[theme].earthInner} />
      </mesh>

      {/* 10 000 plane quads — only land quads are visible (minSize = 0) */}
      <mesh geometry={geometry} material={material} />
    </group>
  )
}
