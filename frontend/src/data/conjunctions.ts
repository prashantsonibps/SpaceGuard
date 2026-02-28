export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface ConjunctionEvent {
  id: string
  satA: string              // satellite id
  satB: string              // satellite id
  satAName: string
  satBName: string
  riskLevel: RiskLevel
  distanceKm: number
  probabilityPct: number
  tcaHours: number          // time to closest approach (hours)
  relativeVelocityKms: number
  portfolioExposureM: number // millions USD
  hedgeStrategy: string
}

export const conjunctionEvents: ConjunctionEvent[] = [
  {
    id: 'EVT-001',
    satA: 'ISS',
    satB: 'DEB-2847',
    satAName: 'ISS (ZARYA)',
    satBName: 'Debris-2847',
    riskLevel: 'CRITICAL',
    distanceKm: 1.2,
    probabilityPct: 98.7,
    tcaHours: 4.38,
    relativeVelocityKms: 11.2,
    portfolioExposureM: 850,
    hedgeStrategy: 'SpaceCraft liability put · $45M @ 2.1x leverage',
  },
  {
    id: 'EVT-002',
    satA: 'SL-1492',
    satB: 'COSMOS-2251',
    satAName: 'Starlink-1492',
    satBName: 'COSMOS-2251 DEB',
    riskLevel: 'HIGH',
    distanceKm: 4.8,
    probabilityPct: 67.2,
    tcaHours: 8.85,
    relativeVelocityKms: 9.7,
    portfolioExposureM: 320,
    hedgeStrategy: 'Satellite insurance call · $18M @ 1.5x leverage',
  },
  {
    id: 'EVT-003',
    satA: 'GPS-IIF-3',
    satB: 'DEB-901',
    satAName: 'GPS IIF-3',
    satBName: 'Debris-901',
    riskLevel: 'MEDIUM',
    distanceKm: 12.1,
    probabilityPct: 31.4,
    tcaHours: 14.1,
    relativeVelocityKms: 3.4,
    portfolioExposureM: 180,
    hedgeStrategy: 'Navigation disruption hedge · $9M notional',
  },
  {
    id: 'EVT-004',
    satA: 'SL-2891',
    satB: 'SL-0341-DEB',
    satAName: 'Starlink-2891',
    satBName: 'SL-0341 DEB',
    riskLevel: 'LOW',
    distanceKm: 28.3,
    probabilityPct: 8.9,
    tcaHours: 22.28,
    relativeVelocityKms: 0.8,
    portfolioExposureM: 45,
    hedgeStrategy: 'Constellation disruption put · $2M @ 1.2x',
  },
  {
    id: 'EVT-005',
    satA: 'NOAA-19',
    satB: 'DEB-2847',
    satAName: 'WeatherSat (NOAA-19)',
    satBName: 'Debris-2847',
    riskLevel: 'LOW',
    distanceKm: 45.6,
    probabilityPct: 2.1,
    tcaHours: 31.7,
    relativeVelocityKms: 0.3,
    portfolioExposureM: 12,
    hedgeStrategy: 'Monitor only · no hedge warranted',
  },
]
