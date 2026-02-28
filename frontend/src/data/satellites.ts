export type SatelliteType = 'station' | 'starlink' | 'gps' | 'debris' | 'weather'

export interface Satellite {
  id: string
  name: string
  type: SatelliteType
  altitudeKm: number
  inclinationDeg: number
  raanDeg: number       // Right Ascension of Ascending Node
  color: string
  size?: number         // visual size multiplier
}

export const satellites: Satellite[] = [
  // ISS
  {
    id: 'ISS',
    name: 'ISS (ZARYA)',
    type: 'station',
    altitudeKm: 408,
    inclinationDeg: 51.6,
    raanDeg: 0,
    color: '#38bdf8',
    size: 1.8,
  },

  // Starlink cluster
  {
    id: 'SL-1492',
    name: 'Starlink-1492',
    type: 'starlink',
    altitudeKm: 550,
    inclinationDeg: 53,
    raanDeg: 45,
    color: '#818cf8',
  },
  {
    id: 'SL-1834',
    name: 'Starlink-1834',
    type: 'starlink',
    altitudeKm: 550,
    inclinationDeg: 53,
    raanDeg: 90,
    color: '#818cf8',
  },
  {
    id: 'SL-2102',
    name: 'Starlink-2102',
    type: 'starlink',
    altitudeKm: 550,
    inclinationDeg: 53,
    raanDeg: 135,
    color: '#818cf8',
  },
  {
    id: 'SL-2891',
    name: 'Starlink-2891',
    type: 'starlink',
    altitudeKm: 550,
    inclinationDeg: 53,
    raanDeg: 180,
    color: '#818cf8',
  },
  {
    id: 'SL-3001',
    name: 'Starlink-3001',
    type: 'starlink',
    altitudeKm: 550,
    inclinationDeg: 53,
    raanDeg: 225,
    color: '#818cf8',
  },
  {
    id: 'SL-3247',
    name: 'Starlink-3247',
    type: 'starlink',
    altitudeKm: 550,
    inclinationDeg: 53,
    raanDeg: 270,
    color: '#818cf8',
  },
  {
    id: 'SL-3412',
    name: 'Starlink-3412',
    type: 'starlink',
    altitudeKm: 550,
    inclinationDeg: 53,
    raanDeg: 315,
    color: '#818cf8',
  },
  {
    id: 'SL-0341',
    name: 'Starlink-0341',
    type: 'starlink',
    altitudeKm: 550,
    inclinationDeg: 70,
    raanDeg: 60,
    color: '#818cf8',
  },

  // GPS satellites
  {
    id: 'GPS-IIF-3',
    name: 'GPS IIF-3',
    type: 'gps',
    altitudeKm: 20200,
    inclinationDeg: 55,
    raanDeg: 30,
    color: '#34d399',
  },
  {
    id: 'GPS-IIF-7',
    name: 'GPS IIF-7',
    type: 'gps',
    altitudeKm: 20200,
    inclinationDeg: 55,
    raanDeg: 150,
    color: '#34d399',
  },
  {
    id: 'GPS-IIR-14',
    name: 'GPS IIR-14',
    type: 'gps',
    altitudeKm: 20200,
    inclinationDeg: 55,
    raanDeg: 270,
    color: '#34d399',
  },

  // Debris
  {
    id: 'DEB-2847',
    name: 'Debris-2847',
    type: 'debris',
    altitudeKm: 410,
    inclinationDeg: 49.2,
    raanDeg: 5,
    color: '#f43f5e',
    size: 0.7,
  },
  {
    id: 'DEB-901',
    name: 'Debris-901',
    type: 'debris',
    altitudeKm: 19800,
    inclinationDeg: 56.1,
    raanDeg: 33,
    color: '#f43f5e',
    size: 0.7,
  },
  {
    id: 'COSMOS-2251',
    name: 'COSMOS-2251 DEB',
    type: 'debris',
    altitudeKm: 520,
    inclinationDeg: 74,
    raanDeg: 210,
    color: '#fb923c',
    size: 0.7,
  },
  {
    id: 'SL-0341-DEB',
    name: 'SL-0341 DEB',
    type: 'debris',
    altitudeKm: 540,
    inclinationDeg: 69.5,
    raanDeg: 65,
    color: '#fb923c',
    size: 0.7,
  },

  // Weather satellites
  {
    id: 'NOAA-19',
    name: 'NOAA-19',
    type: 'weather',
    altitudeKm: 870,
    inclinationDeg: 98.7,
    raanDeg: 120,
    color: '#a78bfa',
  },
  {
    id: 'METOP-B',
    name: 'MetOp-B',
    type: 'weather',
    altitudeKm: 817,
    inclinationDeg: 98.7,
    raanDeg: 300,
    color: '#a78bfa',
  },
]
