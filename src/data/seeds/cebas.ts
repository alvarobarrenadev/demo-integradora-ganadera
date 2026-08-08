import type { Ceba } from '../../types/ceba'
import { logisticsMovements } from './logistics'

/** Sum of animals/kg across every seeded salida movement for a ceba — never hand-typed alongside the movements, so the two can't drift apart. */
function sumExits(cebaId: string): { animals: number; kg: number } {
  return logisticsMovements
    .filter((m) => m.type === 'salida' && m.cebaId === cebaId)
    .reduce(
      (acc, m) => ({ animals: acc.animals + m.animals, kg: acc.kg + m.kg }),
      { animals: 0, kg: 0 },
    )
}

const v112Exits = sumExits('V-112')
const v115Exits = sumExits('V-115')
const v118Exits = sumExits('V-118')

export const cebas: Ceba[] = [
  {
    // §15.5 — closed. animalsExited isn't given explicitly by the brief (only
    // kg salida is); inferred as animalsEntered − deaths (all survivors
    // exited), the natural reading for an already-fully-closed batch.
    id: 'V-112',
    integratedId: 26,
    origin: 'Cría Segovia SL',
    feedType: 'Valdeón 30 Extra',
    entryDate: '2025-11-04',
    animalsEntered: 1110,
    entryKg: 21400,
    animalsExited: v112Exits.animals,
    exitKg: v112Exits.kg,
    feedKg: 248100,
    feedCost: 82900,
    medicationCost: 1850,
    deaths: 14,
    status: 'closed',
    closeDate: '2026-04-24',
  },
  {
    id: 'V-115',
    integratedId: 9,
    origin: 'importación NL',
    feedType: 'Precebo Plus',
    entryDate: '2025-12-02',
    animalsEntered: 980,
    entryKg: 19100,
    animalsExited: v115Exits.animals,
    exitKg: v115Exits.kg,
    feedKg: 228700,
    feedCost: 76400,
    medicationCost: 2310,
    deaths: 17,
    status: 'closed',
    closeDate: '2026-06-12',
  },
  {
    // The main demo ceba — see plan "V-118 seed model". animalsExited/exitKg
    // are DERIVED from the two seeded salida movements above (1.159 / 118.100),
    // never hardcoded, so they can never drift out of sync with the movements.
    id: 'V-118',
    integratedId: 14,
    origin: 'Cría Segovia SL',
    feedType: 'Cebo N-80',
    entryDate: '2026-03-02',
    animalsEntered: 1180,
    entryKg: 23000,
    animalsExited: v118Exits.animals,
    exitKg: v118Exits.kg,
    feedKg: 201450,
    feedCost: 67300,
    medicationCost: 1240,
    deaths: 21,
    status: 'ready_to_close',
  },
  {
    id: 'V-119',
    integratedId: 18,
    origin: 'importación NL',
    feedType: 'Engorde V-60',
    entryDate: '2026-04-18',
    animalsEntered: 1020,
    entryKg: 20100,
    animalsExited: 0,
    exitKg: 0,
    feedKg: 142800,
    feedCost: 47300,
    medicationCost: 890,
    deaths: 9,
    status: 'active',
  },
  {
    id: 'V-121',
    integratedId: 22,
    origin: 'Cría Palentina',
    feedType: 'Cebo N-80',
    entryDate: '2026-06-02',
    animalsEntered: 1020,
    entryKg: 19900,
    animalsExited: 0,
    exitKg: 0,
    feedKg: 64200,
    feedCost: 21400,
    medicationCost: 1980,
    deaths: 31, // elevated bajas — dashboard alert case
    status: 'active',
  },
  {
    id: 'V-122',
    integratedId: 5,
    origin: 'importación NL',
    feedType: 'Cebo AF-Max',
    entryDate: '2026-06-22',
    animalsEntered: 860,
    entryKg: 16800,
    animalsExited: 0,
    exitKg: 0,
    feedKg: 31100,
    feedCost: 10200,
    medicationCost: 310,
    deaths: 6,
    status: 'active',
  },
]

// Sanity checks (fail fast at module load if the derivation is ever wrong).
if (v112Exits.animals !== 1096 || v112Exits.kg !== 127900) throw new Error('V-112 logistics aggregate drifted from its ceba')
if (v115Exits.animals !== 963 || v115Exits.kg !== 112400) throw new Error('V-115 logistics aggregate drifted from its ceba')
if (v118Exits.animals !== 1159 || v118Exits.kg !== 118100) {
  throw new Error('V-118 logistics aggregate drifted from its seeded movements')
}
