import type { FeedTariff } from '../../types/tariff'
import { buildHistoricalTariffs } from '../../domain/tariffs'

/** Literal brief seed data — June/July 2026, exactly as given (§15.2). Never modify these values. */
const juneJulyTariffs: FeedTariff[] = [
  // Piensos Norteña (P1)
  { id: 'tariff-P1-valdeon-30-extra-2026-06', providerId: 'P1', feedType: 'Valdeón 30 Extra', month: '2026-06', pricePerKg: 0.331 },
  { id: 'tariff-P1-valdeon-30-extra-2026-07', providerId: 'P1', feedType: 'Valdeón 30 Extra', month: '2026-07', pricePerKg: 0.334 },
  { id: 'tariff-P1-precebo-plus-2026-06', providerId: 'P1', feedType: 'Precebo Plus', month: '2026-06', pricePerKg: 0.405 },
  { id: 'tariff-P1-precebo-plus-2026-07', providerId: 'P1', feedType: 'Precebo Plus', month: '2026-07', pricePerKg: 0.4 },
  { id: 'tariff-P1-cebo-final-2026-06', providerId: 'P1', feedType: 'Cebo Final', month: '2026-06', pricePerKg: 0.318 },
  { id: 'tariff-P1-cebo-final-2026-07', providerId: 'P1', feedType: 'Cebo Final', month: '2026-07', pricePerKg: 0.32 },

  // NutriCampo (P2)
  { id: 'tariff-P2-starter-n-1-2026-06', providerId: 'P2', feedType: 'Starter N-1', month: '2026-06', pricePerKg: 0.412 },
  { id: 'tariff-P2-starter-n-1-2026-07', providerId: 'P2', feedType: 'Starter N-1', month: '2026-07', pricePerKg: 0.408 },
  { id: 'tariff-P2-cebo-n-80-2026-06', providerId: 'P2', feedType: 'Cebo N-80', month: '2026-06', pricePerKg: 0.336 },
  { id: 'tariff-P2-cebo-n-80-2026-07', providerId: 'P2', feedType: 'Cebo N-80', month: '2026-07', pricePerKg: 0.334 },

  // Piensos del Valle (P3)
  { id: 'tariff-P3-engorde-v-60-2026-06', providerId: 'P3', feedType: 'Engorde V-60', month: '2026-06', pricePerKg: 0.329 },
  { id: 'tariff-P3-engorde-v-60-2026-07', providerId: 'P3', feedType: 'Engorde V-60', month: '2026-07', pricePerKg: 0.331 },

  // AgroFeed (P4)
  { id: 'tariff-P4-precebo-af-2026-06', providerId: 'P4', feedType: 'Precebo AF', month: '2026-06', pricePerKg: 0.398 },
  { id: 'tariff-P4-precebo-af-2026-07', providerId: 'P4', feedType: 'Precebo AF', month: '2026-07', pricePerKg: 0.398 },
  { id: 'tariff-P4-cebo-af-max-2026-06', providerId: 'P4', feedType: 'Cebo AF-Max', month: '2026-06', pricePerKg: 0.325 },
  { id: 'tariff-P4-cebo-af-max-2026-07', providerId: 'P4', feedType: 'Cebo AF-Max', month: '2026-07', pricePerKg: 0.327 },

  // VetSalud (P5) — medication, stays flat at 0,512 across the whole historical dataset and August.
  { id: 'tariff-P5-medicado-m-2-2026-06', providerId: 'P5', feedType: 'Medicado M-2', month: '2026-06', pricePerKg: 0.512 },
  { id: 'tariff-P5-medicado-m-2-2026-07', providerId: 'P5', feedType: 'Medicado M-2', month: '2026-07', pricePerKg: 0.512 },
]

/**
 * Compact deterministic historical extension (Jan–May 2026 + Jan–Jul 2025),
 * required for month-over-month and year-over-year tariff analytics.
 * August tariffs are NOT included here — they're the live result of
 * applyAugustTariffs(), not a pre-seeded value.
 */
export const tariffs: FeedTariff[] = [...juneJulyTariffs, ...buildHistoricalTariffs(juneJulyTariffs)]
