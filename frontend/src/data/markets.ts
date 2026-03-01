import type { RiskLevel } from '@/components/Dashboard/EventsPanel'

export type MarketCategory = 'COLLISION' | 'MANEUVER' | 'HEDGE' | 'DEBRIS' | 'NEO'
export type MarketStatus = 'LIVE' | 'RESOLVED_YES' | 'RESOLVED_NO' | 'CLOSED'

export interface PricePoint {
  timestamp: number
  yesPrice: number
}

export interface Market {
  id: string
  question: string
  category: MarketCategory
  riskLevel: RiskLevel
  yesPrice: number       // 0–100 cents; noPrice = 100 - yesPrice
  volume24h: number
  totalVolume: number
  closeTime: number      // Unix ms
  status: MarketStatus
  priceHistory: PricePoint[]   // ~24 points (hourly)
  outcome?: 'YES' | 'NO'
  linkedEventId?: string
  details: string
}

/** Generate ~24 hourly price points starting from `hoursAgo` hours ago */
function makeHistory(
  hoursAgo: number,
  startPrice: number,
  waypoints: Array<[number, number]>, // [hourOffset, price]
): PricePoint[] {
  const now = Date.now()
  const origin = now - hoursAgo * 3600_000
  const points: PricePoint[] = []
  const allWaypoints: Array<[number, number]> = [[0, startPrice], ...waypoints]

  for (let i = 0; i <= hoursAgo; i++) {
    // Interpolate between nearest waypoints
    let lo = allWaypoints[0]
    let hi = allWaypoints[allWaypoints.length - 1]
    for (let w = 0; w < allWaypoints.length - 1; w++) {
      if (allWaypoints[w][0] <= i && allWaypoints[w + 1][0] >= i) {
        lo = allWaypoints[w]
        hi = allWaypoints[w + 1]
        break
      }
    }
    const t = hi[0] === lo[0] ? 1 : (i - lo[0]) / (hi[0] - lo[0])
    const interpolated = lo[1] + (hi[1] - lo[1]) * t
    // Add small noise
    const noise = (Math.sin(i * 2.7 + startPrice) * 1.5)
    const price = Math.min(99, Math.max(1, Math.round((interpolated + noise) * 10) / 10))
    points.push({ timestamp: origin + i * 3600_000, yesPrice: price })
  }
  return points
}

const now = Date.now()

export const MARKETS: Market[] = [
  {
    id: 'MKT-001',
    question: 'Will ISS × Debris-2847 have a close approach within 1km before 24h?',
    category: 'COLLISION',
    riskLevel: 'CRITICAL',
    yesPrice: 73,
    volume24h: 84_200,
    totalVolume: 210_500,
    closeTime: now + 6.5 * 3600_000,
    status: 'LIVE',
    linkedEventId: 'evt-iss-2847',
    details:
      'ISS is tracking debris object 2847 from the 2021 ASAT test. Current miss distance: 0.8 km. Skyfield propagation shows 73% probability of conjunction within the 1 km safety threshold over the next 24h window. NASA flight controllers are monitoring for maneuver go/no-go decision.',
    priceHistory: makeHistory(24, 32, [
      [6, 40], [12, 55], [18, 68], [22, 71], [24, 73],
    ]),
  },
  {
    id: 'MKT-002',
    question: 'Will Starlink-2193 × Cosmos-1408 debris conjunction probability exceed 1 in 1000?',
    category: 'COLLISION',
    riskLevel: 'HIGH',
    yesPrice: 45,
    volume24h: 51_800,
    totalVolume: 98_300,
    closeTime: now + 18 * 3600_000,
    status: 'LIVE',
    linkedEventId: 'evt-sl2193-c1408',
    details:
      'Starlink-2193 is approaching the Cosmos-1408 debris cloud. Conjunction probability is currently 1-in-3000 but rising. SpaceX has a 12h decision window for a collision avoidance maneuver. Market resolves YES if probability reaches 0.1% (1-in-1000) threshold.',
    priceHistory: makeHistory(24, 28, [
      [4, 30], [8, 35], [14, 42], [20, 44], [24, 45],
    ]),
  },
  {
    id: 'MKT-003',
    question: 'Will a new trackable debris field (>10 objects) form in LEO within 7 days?',
    category: 'DEBRIS',
    riskLevel: 'MEDIUM',
    yesPrice: 28,
    volume24h: 23_600,
    totalVolume: 67_200,
    closeTime: now + 7 * 24 * 3600_000,
    status: 'LIVE',
    details:
      'Several aging rocket bodies in LEO are experiencing increased thermal stress. LeoLabs radar is tracking 3 objects with anomalous radar cross-section signatures. Market resolves YES if Space-Track catalogues ≥10 new objects attributable to a single fragmentation event within 7 days.',
    priceHistory: makeHistory(24, 22, [
      [6, 25], [12, 30], [16, 28], [20, 27], [24, 28],
    ]),
  },
  {
    id: 'MKT-004',
    question: 'Will the Iridium constellation experience >3 conjunction alerts within 6h?',
    category: 'DEBRIS',
    riskLevel: 'HIGH',
    yesPrice: 58,
    volume24h: 37_100,
    totalVolume: 89_400,
    closeTime: now + 5.8 * 3600_000,
    status: 'LIVE',
    details:
      'Iridium planes are crossing through the high-density Fengyun-1C debris belt. The constellation\'s altitude of 780 km coincides with peak debris density. Historically, 2-3 conjunction alerts per 6h pass are observed; market resolves YES if the count exceeds 3 in the next 6h window.',
    priceHistory: makeHistory(24, 45, [
      [4, 48], [8, 54], [12, 58], [16, 55], [20, 57], [24, 58],
    ]),
  },
  {
    id: 'MKT-005',
    question: 'Will ISS execute a debris avoidance maneuver (DAM) within 48h?',
    category: 'MANEUVER',
    riskLevel: 'HIGH',
    yesPrice: 62,
    volume24h: 61_300,
    totalVolume: 143_700,
    closeTime: now + 47 * 3600_000,
    status: 'LIVE',
    linkedEventId: 'evt-iss-2847',
    details:
      'Following the ISS × Debris-2847 conjunction alert, NASA Mission Control is evaluating a DAM. The go/no-go decision window opens in ~8h. A maneuver burn of ~1 m/s ΔV would shift the ISS orbital plane by 0.5 km. Market resolves YES if NASA HALO confirms a DAM execution.',
    priceHistory: makeHistory(24, 25, [
      [6, 35], [12, 50], [18, 60], [22, 61], [24, 62],
    ]),
  },
  {
    id: 'MKT-006',
    question: 'Will AEHF-6 complete its scheduled orbital raising maneuver by 18:00 UTC?',
    category: 'MANEUVER',
    riskLevel: 'LOW',
    yesPrice: 97,
    volume24h: 8_200,
    totalVolume: 44_100,
    closeTime: now - 2 * 3600_000,
    status: 'RESOLVED_YES',
    outcome: 'YES',
    details:
      'AEHF-6 (USA-312) executed the final apogee kick motor burn to achieve operational GEO orbit. The maneuver was confirmed at 17:43 UTC. All telemetry nominal. This market has resolved YES.',
    priceHistory: makeHistory(24, 78, [
      [4, 82], [8, 88], [12, 92], [18, 95], [22, 97], [24, 97],
    ]),
  },
  {
    id: 'MKT-007',
    question: 'Will the SpaceGuard AI agent trigger a portfolio hedge >$500k within 12h?',
    category: 'HEDGE',
    riskLevel: 'MEDIUM',
    yesPrice: 35,
    volume24h: 29_400,
    totalVolume: 72_800,
    closeTime: now + 11 * 3600_000,
    status: 'LIVE',
    details:
      'The SpaceGuard AI risk agent monitors conjunction probability thresholds and auto-executes hedges when risk exceeds configured levels. A hedge of >$500k would require at least one CRITICAL-level conjunction event in the next 12h. Current portfolio exposure: $2.4B. Agent confidence threshold: 85%.',
    priceHistory: makeHistory(24, 20, [
      [6, 25], [12, 32], [16, 38], [20, 36], [24, 35],
    ]),
  },
  {
    id: 'MKT-008',
    question: 'Will NEO 2024 BX1 pass within 50,000 km of Earth (confirmed by JPL CNEOS)?',
    category: 'NEO',
    riskLevel: 'LOW',
    yesPrice: 12,
    volume24h: 14_900,
    totalVolume: 31_200,
    closeTime: now + 3.2 * 24 * 3600_000,
    status: 'LIVE',
    details:
      'NEO 2024 BX1 (diameter ~2.4 m) is on a close Earth approach trajectory. Current JPL CNEOS nominal miss distance: 72,000 km (±15,000 km 1-σ). Market resolves YES if the confirmed miss distance, as published by JPL CNEOS within 24h of closest approach, is ≤50,000 km.',
    priceHistory: makeHistory(24, 15, [
      [6, 14], [12, 13], [16, 12], [20, 12], [24, 12],
    ]),
  },
]
