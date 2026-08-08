import type { LogisticsMovement } from '../../types/logistics'

/**
 * Literal brief seed data (§15.7) plus the one invented movement required to
 * make V-118 genuinely closable (see plan "V-118 seed model"). The invented
 * one is clearly marked below — everything else is given verbatim.
 */
export const logisticsMovements: LogisticsMovement[] = [
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
    id: 'LOG-E118',
    type: 'entrada',
    date: '2026-06-22',
    integratedId: 5,
    cebaId: 'V-122',
    animals: 860,
    kg: 16800,
    origin: 'importación NL',
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
    // Invented mock data filling the brief's gap (V-118 is "lista para cierre" but
    // the brief only gives its first partial exit) — see plan §"V-118 seed model".
    // NOT reverse-engineered to hit a target conversion/bonus: chosen as a lighter
    // per-animal weight than the first saca (heaviest animals shipped first).
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
