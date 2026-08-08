import { describe, expect, it } from 'vitest'
import { calculateSettlement, getNextBillingDate } from './settlements'
import type { Ceba } from '../types/ceba'
import type { Integrated } from '../types/integrated'

function makeCeba(overrides: Partial<Ceba>): Ceba {
  return {
    id: 'C', integratedId: 1, origin: 'x', feedType: 'Pienso', entryDate: '2026-01-01',
    animalsEntered: 100, entryKg: 2000, animalsExited: 100, exitKg: 12000,
    feedKg: 26000, feedCost: 8000, medicationCost: 0, deaths: 0, status: 'closed',
    ...overrides,
  }
}

function makeIntegrated(overrides: Partial<Integrated>): Integrated {
  return {
    id: 1, name: 'x', location: 'x', cea: 'x', capacity: 1000, feedProviderId: 'P1',
    dvrRenewalDate: '2027-01-01', welfareCertified: true, controller: 'L. Vega',
    veterinaryUnit: 'UV-1', dni: 'x', email: 'x', phone: 'x', pricePerPig: 13.5, billingDay: 15,
    ...overrides,
  }
}

describe('calculateSettlement — bonus tiers', () => {
  it('pays 1,20 €/cerdo at exactly the 2.35 boundary', () => {
    // conversion = feedKg / (exitKg - entryKg) = 23500 / 10000 = 2.35
    const ceba = makeCeba({ entryKg: 2000, exitKg: 12000, feedKg: 23500 })
    const settlement = calculateSettlement(ceba, makeIntegrated({}))
    expect(settlement.conversion).toBe(2.35)
    expect(settlement.bonusPerPig).toBe(1.2)
  })

  it('pays 0,90 €/cerdo at exactly the 2.45 boundary', () => {
    const ceba = makeCeba({ entryKg: 2000, exitKg: 12000, feedKg: 24500 })
    const settlement = calculateSettlement(ceba, makeIntegrated({}))
    expect(settlement.conversion).toBe(2.45)
    expect(settlement.bonusPerPig).toBe(0.9)
  })

  it('pays no bonus above 2.45', () => {
    const ceba = makeCeba({ entryKg: 2000, exitKg: 12000, feedKg: 25000 })
    const settlement = calculateSettlement(ceba, makeIntegrated({}))
    expect(settlement.bonusPerPig).toBe(0)
  })

  it('rounds the raw conversion before applying the tier — a value rounding onto 2.35 still gets the top bonus', () => {
    // raw = 23501.3 / 10000 = 2.35013 -> rounds to 2.35, not 2.36
    const ceba = makeCeba({ entryKg: 2000, exitKg: 12000, feedKg: 23501.3 })
    const settlement = calculateSettlement(ceba, makeIntegrated({}))
    expect(settlement.conversion).toBe(2.35)
    expect(settlement.bonusPerPig).toBe(1.2)
  })

  it('applies 2% retention correctly', () => {
    const ceba = makeCeba({ entryKg: 2000, exitKg: 12000, feedKg: 20000, animalsExited: 100 })
    const settlement = calculateSettlement(ceba, makeIntegrated({ pricePerPig: 13.5 }))
    expect(settlement.baseAmount).toBe(1350)
    expect(settlement.retentionAmount).toBeCloseTo(settlement.grossAmount * 0.02, 2)
    expect(settlement.netAmount).toBeCloseTo(settlement.grossAmount - settlement.retentionAmount, 2)
  })

  it('uses Integrated.pricePerPig, never a hardcoded 13.50', () => {
    const ceba = makeCeba({ entryKg: 2000, exitKg: 12000, feedKg: 20000, animalsExited: 100 })
    const settlement = calculateSettlement(ceba, makeIntegrated({ pricePerPig: 20 }))
    expect(settlement.baseAmount).toBe(2000)
  })
})

describe('calculateSettlement — V-118 (import-free literal, matches the plan)', () => {
  it('produces the expected real figures for #14', () => {
    const ceba = makeCeba({
      integratedId: 14, entryKg: 23000, exitKg: 118100, animalsExited: 1159,
      feedKg: 219650, // 201.450 seed + 18.200 from the demo's simulated invoice
    })
    const integrated = makeIntegrated({ id: 14, pricePerPig: 13.5, billingDay: 25 })
    const settlement = calculateSettlement(ceba, integrated)
    expect(settlement.conversion).toBeCloseTo(2.31, 2)
    expect(settlement.pigs).toBe(1159)
    expect(settlement.baseAmount).toBeCloseTo(15646.5, 2)
    expect(settlement.bonusAmount).toBeCloseTo(1390.8, 2)
    expect(settlement.grossAmount).toBeCloseTo(17037.3, 2)
    expect(settlement.retentionAmount).toBeCloseTo(340.75, 2)
    expect(settlement.netAmount).toBeCloseTo(16696.55, 2)
  })
})

describe('getNextBillingDate', () => {
  it('stays in the current month if billingDay has not passed', () => {
    expect(getNextBillingDate(25, '2026-07-15')).toBe('2026-07-25')
  })

  it('rolls to next month if billingDay already passed', () => {
    expect(getNextBillingDate(10, '2026-07-15')).toBe('2026-08-10')
  })

  it('treats billingDay === today as still due this month', () => {
    expect(getNextBillingDate(15, '2026-07-15')).toBe('2026-07-15')
  })
})
