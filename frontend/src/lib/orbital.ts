/**
 * Simplified circular orbit position calculator.
 * Maps satellite orbital parameters to a 3D position on the unit sphere
 * (scaled by altitude for visualization).
 */

const GM = 3.986004418e14  // Earth's gravitational parameter (m³/s²)
const EARTH_RADIUS_M = 6371000  // meters

/**
 * Angular velocity for a circular orbit at given altitude.
 * Returns radians per second.
 */
function orbitalAngularVelocity(altitudeKm: number): number {
  const r = EARTH_RADIUS_M + altitudeKm * 1000
  return Math.sqrt(GM / (r * r * r))
}

/**
 * Compute 3D unit-sphere position for a satellite at a given time.
 * Returns [x, y, z] where the radius scales with altitude.
 *
 * Orbital model: circular orbit with:
 * - inclinationDeg: tilt relative to equatorial plane
 * - raanDeg: right ascension of ascending node (longitude of orbit plane)
 * - phase0: initial true anomaly at t=0 (radians)
 */
export function positionOnSphere(
  altitudeKm: number,
  inclinationDeg: number,
  raanDeg: number,
  timeSeconds: number,
  phase0 = 0,
  vizScale = 1.0,
): [number, number, number] {
  const earthRadiusKm = 6371
  const orbitalRadiusNorm = (1 + altitudeKm / earthRadiusKm) * vizScale

  const omega = orbitalAngularVelocity(altitudeKm)
  const trueAnomaly = phase0 + omega * timeSeconds

  const inc = (inclinationDeg * Math.PI) / 180
  const raan = (raanDeg * Math.PI) / 180

  // Position in orbital plane (perifocal coordinates)
  const xOrb = Math.cos(trueAnomaly)
  const yOrb = Math.sin(trueAnomaly)

  // Rotate by inclination and RAAN to get ECI coordinates
  // R_z(-RAAN) * R_x(-inc) * [xOrb, yOrb, 0]
  const x = Math.cos(raan) * xOrb - Math.sin(raan) * Math.cos(inc) * yOrb
  const y = Math.sin(raan) * xOrb + Math.cos(raan) * Math.cos(inc) * yOrb
  const z = Math.sin(inc) * yOrb

  // Three.js uses Y-up; ECI Z maps to Three.js Y
  return [
    x * orbitalRadiusNorm,
    z * orbitalRadiusNorm,
    y * orbitalRadiusNorm,
  ]
}

/**
 * Pre-sample an orbit into N points for rendering orbit trails.
 */
export function sampleOrbit(
  altitudeKm: number,
  inclinationDeg: number,
  raanDeg: number,
  samples = 128,
  phase0 = 0,
  vizScale = 1.0,
): [number, number, number][] {
  const omega = orbitalAngularVelocity(altitudeKm)
  const period = (2 * Math.PI) / omega
  const points: [number, number, number][] = []
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * period
    points.push(positionOnSphere(altitudeKm, inclinationDeg, raanDeg, t, phase0, vizScale))
  }
  return points
}
