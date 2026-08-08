import { describe, expect, it } from 'vitest'
import { buildAugustTariffs, buildHistoricalTariffs } from './tariffs'
import { tariffs as seedTariffs } from '../data/seeds/tariffs'

describe('buildAugustTariffs', () => {
  const august = buildAugustTariffs(seedTariffs)

  it('adds rows for P1-P4 only', () => {
    expect(august.some((t) => t.providerId === 'P5')).toBe(false)
    expect(august.every((t) => ['P1', 'P2', 'P3', 'P4'].includes(t.providerId))).toBe(true)
  })

  it('never touches P5 — Medicado M-2 has no August row from this function', () => {
    expect(august.find((t) => t.feedType === 'Medicado M-2')).toBeUndefined()
  })
})

describe('P5/VetSalud tariff stability across the historical dataset', () => {
  it('stays at exactly 0,512 €/kg in every seeded month, including 2025', () => {
    const p5Rows = seedTariffs.filter((t) => t.providerId === 'P5')
    expect(p5Rows.length).toBeGreaterThan(0)
    for (const row of p5Rows) {
      expect(row.pricePerKg).toBe(0.512)
    }
  })

  it('P1-P4 series do have month-over-month drift (not flat like P5)', () => {
    const p1Rows = seedTariffs.filter((t) => t.providerId === 'P1' && t.feedType === 'Valdeón 30 Extra')
    const distinctPrices = new Set(p1Rows.map((r) => r.pricePerKg))
    expect(distinctPrices.size).toBeGreaterThan(1)
  })
})

describe('buildHistoricalTariffs', () => {
  it('produces Jan-May 2026 and a full 2025 series', () => {
    const juneJuly = seedTariffs.filter((t) => t.month === '2026-06' || t.month === '2026-07')
    const historical = buildHistoricalTariffs(juneJuly)
    expect(historical.some((t) => t.month === '2026-01')).toBe(true)
    expect(historical.some((t) => t.month === '2025-07')).toBe(true)
  })
})
