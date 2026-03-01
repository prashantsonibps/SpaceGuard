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

const LERP = 0.6

export function Earth({ autoRotate = true, theme }: EarthProps) {
  const groupRef    = useRef<THREE.Group>(null)
  const innerRef    = useRef<THREE.MeshBasicMaterial>(null)
  const geometry    = useMemo(() => createDottedSphereGeometry(), [])
  const texture     = useLoader(THREE.TextureLoader, '/black_white_map.webp')

  // Current lerped colors (live) and target colors (set on theme change)
  const landCur   = useRef(new THREE.Color(globeColors[theme].earthLand))
  const oceanCur  = useRef(new THREE.Color(globeColors[theme].earthOcean))
  const innerCur  = useRef(new THREE.Color(globeColors[theme].earthInner))
  const landTgt   = useRef(new THREE.Color(globeColors[theme].earthLand))
  const oceanTgt  = useRef(new THREE.Color(globeColors[theme].earthOcean))
  const innerTgt  = useRef(new THREE.Color(globeColors[theme].earthInner))

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          tex:        { value: texture },
          dotSize:    { value: theme === 'light' ? 0.016 : 0.012 },
          landColor:  { value: landCur.current.clone() },
          oceanColor: { value: oceanCur.current.clone() },
        },
        vertexShader,
        fragmentShader,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [texture]
  )

  // On theme change, update targets only — useFrame lerps toward them
  useEffect(() => {
    landTgt.current.set(globeColors[theme].earthLand)
    oceanTgt.current.set(globeColors[theme].earthOcean)
    innerTgt.current.set(globeColors[theme].earthInner)
    material.uniforms.dotSize.value = theme === 'light' ? 0.016 : 0.012
  }, [theme, material])

  useFrame(() => {
    landCur.current.lerp(landTgt.current, LERP)
    oceanCur.current.lerp(oceanTgt.current, LERP)
    innerCur.current.lerp(innerTgt.current, LERP)

    material.uniforms.landColor.value.copy(landCur.current)
    material.uniforms.oceanColor.value.copy(oceanCur.current)
    if (innerRef.current) innerRef.current.color.copy(innerCur.current)

    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.001
    }
  })

  return (
    <group ref={groupRef} rotation={[0, Math.PI, 0]}>
      {/* Inner sphere — lerped color */}
      <mesh>
        <sphereGeometry args={[RADIUS - 0.001, 72, 36]} />
        <meshBasicMaterial ref={innerRef} color={globeColors[theme].earthInner} />
      </mesh>

      {/* 10 000 plane quads — only land quads are visible (minSize = 0) */}
      <mesh geometry={geometry} material={material} />
    </group>
  )
}
