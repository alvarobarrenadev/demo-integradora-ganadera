import type { FeedTariff } from '../types/tariff'
import { roundTo } from '../utils/numbers'

const MEDICATION_PROVIDER_ID = 'P5'

function slug(feedType: string): string {
  return feedType.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function tariffId(providerId: string, feedType: string, month: string): string {
  return `tariff-${providerId}-${slug(feedType)}-${month}`
}

/**
 * Fixed, documented deltas applied to July prices to produce August (P1–P4
 * only — invented to fill a gap the brief leaves unspecified, never random).
 * P5/VetSalud's Medicado M-2 stays flat at 0,512 €/kg — excluded entirely.
 */
const AUGUST_DELTA_BY_PROVIDER: Record<string, number> = {
  P1: 0.006,
  P2: 0.008,
  P3: 0.01,
  P4: 0.012,
}

export function buildAugustTariffs(julyTariffs: FeedTariff[]): FeedTariff[] {
  return julyTariffs
    .filter((t) => t.month === '2026-07' && t.providerId !== MEDICATION_PROVIDER_ID)
    .map((t) => {
      const delta = AUGUST_DELTA_BY_PROVIDER[t.providerId] ?? 0.01
      const pricePerKg = roundTo(t.pricePerKg * (1 + delta), 3)
      return {
        id: tariffId(t.providerId, t.feedType, '2026-08'),
        providerId: t.providerId,
        feedType: t.feedType,
        month: '2026-08',
        pricePerKg,
      }
    })
}

/** Fixed per-provider month-over-month drift walking backward from July — not random. */
const MONTHLY_DRIFT_BY_PROVIDER: Record<string, number> = {
  P1: 0.004,
  P2: 0.005,
  P3: 0.003,
  P4: 0.006,
}

/** 2025 same-month prices are a fixed discount off the corresponding 2026 price — not random. */
const PRIOR_YEAR_MULTIPLIER = 0.94

/**
 * Extends each June/July 2026 series backward through January 2026, plus a
 * full comparable 2025 series (Jan–Jul), so month-over-month and
 * year-over-year tariff analytics have real data to work with. P5 stays flat
 * at its literal price throughout — never drifted.
 */
export function buildHistoricalTariffs(juneJulyTariffs: FeedTariff[]): FeedTariff[] {
  const bySeries = new Map<string, FeedTariff>()
  for (const t of juneJulyTariffs) {
    if (t.month === '2026-06') bySeries.set(`${t.providerId}:${t.feedType}`, t)
  }

  const extended: FeedTariff[] = []

  for (const june of bySeries.values()) {
    const isMedication = june.providerId === MEDICATION_PROVIDER_ID
    const drift = MONTHLY_DRIFT_BY_PROVIDER[june.providerId] ?? 0.004

    // Walk backward from June (2026-06) through January (2026-01).
    let price = june.pricePerKg
    for (let month = 5; month >= 1; month -= 1) {
      price = isMedication ? june.pricePerKg : roundTo(price / (1 + drift), 3)
      const monthStr = `2026-${String(month).padStart(2, '0')}`
      extended.push({
        id: tariffId(june.providerId, june.feedType, monthStr),
        providerId: june.providerId,
        feedType: june.feedType,
        month: monthStr,
        pricePerKg: price,
      })
    }
  }

  // 2025 comparison series, Jan–Jul, derived from the corresponding 2026 month.
  const all2026 = [...juneJulyTariffs.filter((t) => t.month === '2026-06' || t.month === '2026-07'), ...extended]
  for (const t of all2026) {
    const month2026 = t.month.slice(5, 7)
    if (Number(month2026) > 7) continue
    const isMedication = t.providerId === MEDICATION_PROVIDER_ID
    const monthStr = `2025-${month2026}`
    extended.push({
      id: tariffId(t.providerId, t.feedType, monthStr),
      providerId: t.providerId,
      feedType: t.feedType,
      month: monthStr,
      pricePerKg: isMedication ? t.pricePerKg : roundTo(t.pricePerKg * PRIOR_YEAR_MULTIPLIER, 3),
    })
  }

  return extended
}
