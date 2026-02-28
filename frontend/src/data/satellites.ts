export type SatelliteType = 'station' | 'starlink' | 'gps' | 'debris' | 'weather' | 'oneweb' | 'iridium'

export interface Satellite {
  id: string
  name: string
  type: SatelliteType
  altitudeKm: number
  inclinationDeg: number
  raanDeg: number
  phase0Deg?: number
  color: string
  size?: number
}

export const satellites: Satellite[] = [
  // ── ISS ─────────────────────────────────────────────────────────────────
  { id: 'ISS', name: 'ISS (ZARYA)', type: 'station', altitudeKm: 408, inclinationDeg: 51.6, raanDeg: 0, phase0Deg: 72, color: '#f1f5f9', size: 1.5 },

  // ── Starlink Shell 1 — 53°, 550 km (24 sats, RAAN every 15°) ───────────
  // phase0 evenly spread so sats are distributed across their planes, not all at ascending nodes
  { id: 'SL-G001', name: 'Starlink-G001', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 0,   phase0Deg: 0,   color: '#94a3b8' },
  { id: 'SL-G002', name: 'Starlink-G002', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 15,  phase0Deg: 15,  color: '#94a3b8' },
  { id: 'SL-G003', name: 'Starlink-G003', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 30,  phase0Deg: 30,  color: '#94a3b8' },
  { id: 'SL-1492', name: 'Starlink-1492', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 45,  phase0Deg: 45,  color: '#94a3b8' },
  { id: 'SL-G004', name: 'Starlink-G004', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 60,  phase0Deg: 60,  color: '#94a3b8' },
  { id: 'SL-G005', name: 'Starlink-G005', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 75,  phase0Deg: 75,  color: '#94a3b8' },
  { id: 'SL-1834', name: 'Starlink-1834', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 90,  phase0Deg: 90,  color: '#94a3b8' },
  { id: 'SL-G006', name: 'Starlink-G006', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 105, phase0Deg: 105, color: '#94a3b8' },
  { id: 'SL-G007', name: 'Starlink-G007', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 120, phase0Deg: 120, color: '#94a3b8' },
  { id: 'SL-2102', name: 'Starlink-2102', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 135, phase0Deg: 135, color: '#94a3b8' },
  { id: 'SL-G008', name: 'Starlink-G008', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 150, phase0Deg: 150, color: '#94a3b8' },
  { id: 'SL-G009', name: 'Starlink-G009', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 165, phase0Deg: 165, color: '#94a3b8' },
  { id: 'SL-2891', name: 'Starlink-2891', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 180, phase0Deg: 180, color: '#94a3b8' },
  { id: 'SL-G010', name: 'Starlink-G010', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 195, phase0Deg: 195, color: '#94a3b8' },
  { id: 'SL-G011', name: 'Starlink-G011', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 210, phase0Deg: 210, color: '#94a3b8' },
  { id: 'SL-3001', name: 'Starlink-3001', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 225, phase0Deg: 225, color: '#94a3b8' },
  { id: 'SL-G012', name: 'Starlink-G012', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 240, phase0Deg: 240, color: '#94a3b8' },
  { id: 'SL-G013', name: 'Starlink-G013', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 255, phase0Deg: 255, color: '#94a3b8' },
  { id: 'SL-3247', name: 'Starlink-3247', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 270, phase0Deg: 270, color: '#94a3b8' },
  { id: 'SL-G014', name: 'Starlink-G014', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 285, phase0Deg: 285, color: '#94a3b8' },
  { id: 'SL-G015', name: 'Starlink-G015', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 300, phase0Deg: 300, color: '#94a3b8' },
  { id: 'SL-3412', name: 'Starlink-3412', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 315, phase0Deg: 315, color: '#94a3b8' },
  { id: 'SL-G016', name: 'Starlink-G016', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 330, phase0Deg: 330, color: '#94a3b8' },
  { id: 'SL-G017', name: 'Starlink-G017', type: 'starlink', altitudeKm: 550, inclinationDeg: 53, raanDeg: 345, phase0Deg: 345, color: '#94a3b8' },

  // ── Starlink Shell 2 — 70°, 555 km (8 sats, RAAN every 45°) ───────────
  { id: 'SL-0341',  name: 'Starlink-0341',  type: 'starlink', altitudeKm: 555, inclinationDeg: 70, raanDeg: 0,   phase0Deg: 22,  color: '#94a3b8' },
  { id: 'SL-H002',  name: 'Starlink-H002',  type: 'starlink', altitudeKm: 555, inclinationDeg: 70, raanDeg: 45,  phase0Deg: 67,  color: '#94a3b8' },
  { id: 'SL-H003',  name: 'Starlink-H003',  type: 'starlink', altitudeKm: 555, inclinationDeg: 70, raanDeg: 90,  phase0Deg: 112, color: '#94a3b8' },
  { id: 'SL-H004',  name: 'Starlink-H004',  type: 'starlink', altitudeKm: 555, inclinationDeg: 70, raanDeg: 135, phase0Deg: 157, color: '#94a3b8' },
  { id: 'SL-H005',  name: 'Starlink-H005',  type: 'starlink', altitudeKm: 555, inclinationDeg: 70, raanDeg: 180, phase0Deg: 202, color: '#94a3b8' },
  { id: 'SL-H006',  name: 'Starlink-H006',  type: 'starlink', altitudeKm: 555, inclinationDeg: 70, raanDeg: 225, phase0Deg: 247, color: '#94a3b8' },
  { id: 'SL-H007',  name: 'Starlink-H007',  type: 'starlink', altitudeKm: 555, inclinationDeg: 70, raanDeg: 270, phase0Deg: 292, color: '#94a3b8' },
  { id: 'SL-H008',  name: 'Starlink-H008',  type: 'starlink', altitudeKm: 555, inclinationDeg: 70, raanDeg: 315, phase0Deg: 337, color: '#94a3b8' },

  // ── Starlink Polar Shell — 97.6°, 560 km (8 sats) ──────────────────────
  { id: 'SL-P001', name: 'Starlink-P001', type: 'starlink', altitudeKm: 560, inclinationDeg: 97.6, raanDeg: 0,   phase0Deg: 45,  color: '#94a3b8' },
  { id: 'SL-P002', name: 'Starlink-P002', type: 'starlink', altitudeKm: 560, inclinationDeg: 97.6, raanDeg: 45,  phase0Deg: 90,  color: '#94a3b8' },
  { id: 'SL-P003', name: 'Starlink-P003', type: 'starlink', altitudeKm: 560, inclinationDeg: 97.6, raanDeg: 90,  phase0Deg: 135, color: '#94a3b8' },
  { id: 'SL-P004', name: 'Starlink-P004', type: 'starlink', altitudeKm: 560, inclinationDeg: 97.6, raanDeg: 135, phase0Deg: 180, color: '#94a3b8' },
  { id: 'SL-P005', name: 'Starlink-P005', type: 'starlink', altitudeKm: 560, inclinationDeg: 97.6, raanDeg: 180, phase0Deg: 225, color: '#94a3b8' },
  { id: 'SL-P006', name: 'Starlink-P006', type: 'starlink', altitudeKm: 560, inclinationDeg: 97.6, raanDeg: 225, phase0Deg: 270, color: '#94a3b8' },
  { id: 'SL-P007', name: 'Starlink-P007', type: 'starlink', altitudeKm: 560, inclinationDeg: 97.6, raanDeg: 270, phase0Deg: 315, color: '#94a3b8' },
  { id: 'SL-P008', name: 'Starlink-P008', type: 'starlink', altitudeKm: 560, inclinationDeg: 97.6, raanDeg: 315, phase0Deg: 0,   color: '#94a3b8' },

  // ── OneWeb — 87.9°, 1200 km (12 sats, RAAN every 30°) ─────────────────
  { id: 'OW-001', name: 'OneWeb-001', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 0,   phase0Deg: 15,  color: '#cbd5e1' },
  { id: 'OW-002', name: 'OneWeb-002', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 30,  phase0Deg: 45,  color: '#cbd5e1' },
  { id: 'OW-003', name: 'OneWeb-003', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 60,  phase0Deg: 75,  color: '#cbd5e1' },
  { id: 'OW-004', name: 'OneWeb-004', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 90,  phase0Deg: 105, color: '#cbd5e1' },
  { id: 'OW-005', name: 'OneWeb-005', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 120, phase0Deg: 135, color: '#cbd5e1' },
  { id: 'OW-006', name: 'OneWeb-006', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 150, phase0Deg: 165, color: '#cbd5e1' },
  { id: 'OW-007', name: 'OneWeb-007', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 180, phase0Deg: 195, color: '#cbd5e1' },
  { id: 'OW-008', name: 'OneWeb-008', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 210, phase0Deg: 225, color: '#cbd5e1' },
  { id: 'OW-009', name: 'OneWeb-009', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 240, phase0Deg: 255, color: '#cbd5e1' },
  { id: 'OW-010', name: 'OneWeb-010', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 270, phase0Deg: 285, color: '#cbd5e1' },
  { id: 'OW-011', name: 'OneWeb-011', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 300, phase0Deg: 315, color: '#cbd5e1' },
  { id: 'OW-012', name: 'OneWeb-012', type: 'oneweb', altitudeKm: 1200, inclinationDeg: 87.9, raanDeg: 330, phase0Deg: 345, color: '#cbd5e1' },

  // ── Iridium — 86.4°, 780 km (6 sats, RAAN every 60°) ──────────────────
  { id: 'IR-001', name: 'Iridium-001', type: 'iridium', altitudeKm: 780, inclinationDeg: 86.4, raanDeg: 0,   phase0Deg: 30,  color: '#e2e8f0' },
  { id: 'IR-002', name: 'Iridium-002', type: 'iridium', altitudeKm: 780, inclinationDeg: 86.4, raanDeg: 60,  phase0Deg: 90,  color: '#e2e8f0' },
  { id: 'IR-003', name: 'Iridium-003', type: 'iridium', altitudeKm: 780, inclinationDeg: 86.4, raanDeg: 120, phase0Deg: 150, color: '#e2e8f0' },
  { id: 'IR-004', name: 'Iridium-004', type: 'iridium', altitudeKm: 780, inclinationDeg: 86.4, raanDeg: 180, phase0Deg: 210, color: '#e2e8f0' },
  { id: 'IR-005', name: 'Iridium-005', type: 'iridium', altitudeKm: 780, inclinationDeg: 86.4, raanDeg: 240, phase0Deg: 270, color: '#e2e8f0' },
  { id: 'IR-006', name: 'Iridium-006', type: 'iridium', altitudeKm: 780, inclinationDeg: 86.4, raanDeg: 300, phase0Deg: 330, color: '#e2e8f0' },

  // ── GPS — 55°, 20200 km (existing 3 + 9 new for 6-plane constellation) ─
  { id: 'GPS-IIF-3',  name: 'GPS IIF-3',  type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 30,  phase0Deg: 60,  color: '#cbd5e1' },
  { id: 'GPS-IIF-7',  name: 'GPS IIF-7',  type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 150, phase0Deg: 60,  color: '#cbd5e1' },
  { id: 'GPS-IIR-14', name: 'GPS IIR-14', type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 270, phase0Deg: 60,  color: '#cbd5e1' },
  { id: 'GPS-A1',     name: 'GPS A1',     type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 0,   phase0Deg: 0,   color: '#cbd5e1' },
  { id: 'GPS-A2',     name: 'GPS A2',     type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 0,   phase0Deg: 180, color: '#cbd5e1' },
  { id: 'GPS-B1',     name: 'GPS B1',     type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 60,  phase0Deg: 0,   color: '#cbd5e1' },
  { id: 'GPS-B2',     name: 'GPS B2',     type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 60,  phase0Deg: 180, color: '#cbd5e1' },
  { id: 'GPS-C1',     name: 'GPS C1',     type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 120, phase0Deg: 90,  color: '#cbd5e1' },
  { id: 'GPS-D1',     name: 'GPS D1',     type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 180, phase0Deg: 90,  color: '#cbd5e1' },
  { id: 'GPS-E1',     name: 'GPS E1',     type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 240, phase0Deg: 90,  color: '#cbd5e1' },
  { id: 'GPS-F1',     name: 'GPS F1',     type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 300, phase0Deg: 0,   color: '#cbd5e1' },
  { id: 'GPS-F2',     name: 'GPS F2',     type: 'gps', altitudeKm: 20200, inclinationDeg: 55, raanDeg: 300, phase0Deg: 180, color: '#cbd5e1' },

  // ── Weather / Sun-synchronous — ~98.7°, 820–870 km ─────────────────────
  { id: 'NOAA-19', name: 'NOAA-19',   type: 'weather', altitudeKm: 870, inclinationDeg: 98.7, raanDeg: 120, phase0Deg: 40,  color: '#e2e8f0' },
  { id: 'METOP-B', name: 'MetOp-B',   type: 'weather', altitudeKm: 817, inclinationDeg: 98.7, raanDeg: 300, phase0Deg: 130, color: '#e2e8f0' },
  { id: 'WX-TERRA',  name: 'Terra',   type: 'weather', altitudeKm: 705, inclinationDeg: 98.2, raanDeg: 60,  phase0Deg: 220, color: '#e2e8f0' },
  { id: 'WX-AQUA',   name: 'Aqua',    type: 'weather', altitudeKm: 705, inclinationDeg: 98.2, raanDeg: 140, phase0Deg: 310, color: '#e2e8f0' },
  { id: 'METOP-C',   name: 'MetOp-C', type: 'weather', altitudeKm: 817, inclinationDeg: 98.7, raanDeg: 240, phase0Deg: 55,  color: '#e2e8f0' },
  { id: 'WX-SNPP',   name: 'Suomi NPP',type: 'weather', altitudeKm: 824, inclinationDeg: 98.7, raanDeg: 340, phase0Deg: 175, color: '#e2e8f0' },

  // ── Debris — scattered LEO/MEO ─────────────────────────────────────────
  { id: 'DEB-2847',    name: 'Debris-2847',    type: 'debris', altitudeKm: 410,  inclinationDeg: 49.2, raanDeg: 5,   phase0Deg: 83,  color: '#64748b', size: 0.7 },
  { id: 'DEB-901',     name: 'Debris-901',     type: 'debris', altitudeKm: 19800,inclinationDeg: 56.1, raanDeg: 33,  phase0Deg: 217, color: '#64748b', size: 0.7 },
  { id: 'COSMOS-2251', name: 'COSMOS-2251 DEB',type: 'debris', altitudeKm: 520,  inclinationDeg: 74,   raanDeg: 210, phase0Deg: 148, color: '#64748b', size: 0.7 },
  { id: 'SL-0341-DEB', name: 'SL-0341 DEB',   type: 'debris', altitudeKm: 540,  inclinationDeg: 69.5, raanDeg: 65,  phase0Deg: 305, color: '#64748b', size: 0.7 },
  { id: 'DEB-LEO1',    name: 'Debris-LEO1',    type: 'debris', altitudeKm: 380,  inclinationDeg: 51,   raanDeg: 90,  phase0Deg: 37,  color: '#64748b', size: 0.7 },
  { id: 'DEB-LEO2',    name: 'Debris-LEO2',    type: 'debris', altitudeKm: 420,  inclinationDeg: 65,   raanDeg: 150, phase0Deg: 262, color: '#64748b', size: 0.7 },
  { id: 'DEB-LEO3',    name: 'Debris-LEO3',    type: 'debris', altitudeKm: 470,  inclinationDeg: 98,   raanDeg: 200, phase0Deg: 190, color: '#64748b', size: 0.7 },
  { id: 'DEB-LEO4',    name: 'Debris-LEO4',    type: 'debris', altitudeKm: 600,  inclinationDeg: 45,   raanDeg: 250, phase0Deg: 112, color: '#64748b', size: 0.7 },
  { id: 'DEB-LEO5',    name: 'Debris-LEO5',    type: 'debris', altitudeKm: 700,  inclinationDeg: 78,   raanDeg: 310, phase0Deg: 333, color: '#64748b', size: 0.7 },
  { id: 'DEB-MEO1',    name: 'Debris-MEO1',    type: 'debris', altitudeKm: 1000, inclinationDeg: 63,   raanDeg: 40,  phase0Deg: 167, color: '#64748b', size: 0.7 },
]
