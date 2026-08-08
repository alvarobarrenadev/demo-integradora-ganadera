import type { LogisticsMovement } from '../../types/logistics'

/** Brief movements plus the complementary records needed for complete ceba timelines. */
export const logisticsMovements: LogisticsMovement[] = [
  {
    id: 'LOG-E112', type: 'entrada', date: '2025-11-04', integratedId: 26, cebaId: 'V-112',
    animals: 1110, kg: 21400, origin: 'Cría Segovia SL', feedType: 'Valdeón 30 Extra', albaran: 'ALB-E-112', archiveStatus: 'archivado',
  },
  {
    id: 'LOG-E115', type: 'entrada', date: '2025-12-02', integratedId: 9, cebaId: 'V-115',
    animals: 980, kg: 19100, origin: 'importación NL', feedType: 'Precebo Plus', albaran: 'ALB-E-115', archiveStatus: 'archivado',
  },
  {
    id: 'LOG-EV118', type: 'entrada', date: '2026-03-02', integratedId: 14, cebaId: 'V-118',
    animals: 1180, kg: 23000, origin: 'Cría Segovia SL', feedType: 'Cebo N-80', albaran: 'ALB-E-118-14', archiveStatus: 'archivado',
  },
  {
    id: 'LOG-E119', type: 'entrada', date: '2026-04-18', integratedId: 18, cebaId: 'V-119',
    animals: 1020, kg: 20100, origin: 'importación NL', feedType: 'Engorde V-60', albaran: 'ALB-E-119', archiveStatus: 'archivado',
  },
  {
    id: 'LOG-E121', type: 'entrada', date: '2026-06-02', integratedId: 22, cebaId: 'V-121',
    animals: 1020, kg: 19900, origin: 'Cría Palentina', feedType: 'Cebo N-80', albaran: 'ALB-E-121', archiveStatus: 'archivado',
  },
  {
    // Integrated #26's only ceba is V-112 (closed 24/04/2026); this salida
    // falls inside its active window, so it belongs to V-112 — the brief
    // doesn't enumerate every movement for an already-closed ceba, only this
    // representative one.
    id: 'LOG-2603',
    type: 'salida',
    date: '2026-03-03',
    integratedId: 26,
    cebaId: 'V-112',
    animals: 180,
    kg: 25200,
    matadero: 'Cárnicas del Norte SA',
    welfare: true,
    transportType: 'interno',
    driver: 'A. Sierra',
    albaran: 'ALB-2603',
    archiveStatus: 'archivado',
  },
  {
    id: 'LOG-2604', type: 'salida', date: '2026-04-24', integratedId: 26, cebaId: 'V-112',
    animals: 916, kg: 102700, matadero: 'Cárnicas del Norte SA', welfare: true,
    transportType: 'interno', driver: 'R. Campos', albaran: 'ALB-2604', archiveStatus: 'archivado',
  },
  {
    id: 'LOG-2711',
    type: 'salida',
    date: '2026-06-12',
    integratedId: 9,
    cebaId: 'V-115',
    animals: 310,
    kg: 36890,
    matadero: 'Matadero Río Frío SL',
    welfare: true,
    transportType: 'externo',
    driver: 'Transportes Cueto SL',
    albaran: 'ALB-2711',
    archiveStatus: 'pendiente',
  },
  {
    id: 'LOG-2712', type: 'salida', date: '2026-06-12', integratedId: 9, cebaId: 'V-115',
    animals: 653, kg: 75510, matadero: 'Matadero Río Frío SL', welfare: true,
    transportType: 'externo', driver: 'Transportes Cueto SL', albaran: 'ALB-2712', archiveStatus: 'archivado',
  },
  {
    id: 'LOG-E118',
    type: 'entrada',
    date: '2026-06-22',
    integratedId: 5,
    cebaId: 'V-122',
    animals: 860,
    kg: 16800,
    origin: 'importación NL',
    feedType: 'Cebo AF-Max',
    albaran: 'ALB-E-118',
    archiveStatus: 'archivado',
  },
  {
    id: 'LOG-2740',
    type: 'salida',
    date: '2026-07-08',
    integratedId: 14,
    cebaId: 'V-118',
    animals: 330,
    kg: 38100,
    matadero: 'Cárnicas del Norte SA',
    welfare: true,
    transportType: 'interno',
    driver: 'R. Campos',
    albaran: 'ALB-2740',
    archiveStatus: 'archivado',
  },
  {
    // Completes the brief's partial V-118 exit so the required close flow is executable.
    id: 'LOG-2748',
    type: 'salida',
    date: '2026-07-15',
    integratedId: 14,
    cebaId: 'V-118',
    animals: 829,
    kg: 80000,
    matadero: 'Matadero Río Frío SL',
    welfare: true,
    transportType: 'externo',
    driver: 'Transportes Cueto SL',
    albaran: 'ALB-2748',
    archiveStatus: 'archivado',
  },
]
