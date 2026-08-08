import { describe, expect, it } from 'vitest'
import { calculateFreight, calculatePriceDiscrepancy, generateInternalInvoiceNumber, getApplicableTariff } from './invoices'
import { invoices as seedInvoices } from '../data/seeds/invoices'
import { providers } from '../data/seeds/providers'
import { tariffs } from '../data/seeds/tariffs'
import type { Invoice } from '../types/invoice'

describe('generateInternalInvoiceNumber', () => {
  it('gives the next correlativo for an existing month', () => {
    expect(generateInternalInvoiceNumber('2026-07-20', seedInvoices)).toBe('7102')
  })

  it('keeps a late-arriving invoice numbered against its own month, ignoring receivedAt', () => {
    // 5211 is dated 2026-05-28 but received 2026-07-02; a new May invoice must
    // still number against other May invoices, not July's.
    expect(generateInternalInvoiceNumber('2026-05-15', seedInvoices)).toBe('5212')
  })

  it('starts August at 8001 when no August invoice exists', () => {
    expect(generateInternalInvoiceNumber('2026-08-01', seedInvoices)).toBe('8001')
  })

  it('does not misparse two-digit months against single-digit ones', () => {
    const elevenMonthInvoices: Invoice[] = [
      { ...seedInvoices[0], id: 'x', internalNumber: '11005', date: '2026-11-03' },
    ]
    // A November invoice (month 11) must not be confused with January (month 1).
    expect(generateInternalInvoiceNumber('2026-11-20', elevenMonthInvoices)).toBe('11006')
    expect(generateInternalInvoiceNumber('2026-01-20', elevenMonthInvoices)).toBe('1001')
  })
})

describe('calculateFreight', () => {
  it('charges freight for P1-P3', () => {
    const p1 = providers.find((p) => p.id === 'P1')!
    const p2 = providers.find((p) => p.id === 'P2')!
    const p3 = providers.find((p) => p.id === 'P3')!
    expect(calculateFreight(p1, 10000)).toBeCloseTo(870, 2)
    expect(calculateFreight(p2, 10000)).toBeCloseTo(800, 2)
    expect(calculateFreight(p3, 10000)).toBeCloseTo(750, 2)
  })

  it('charges no freight for P4/P5', () => {
    const p4 = providers.find((p) => p.id === 'P4')!
    const p5 = providers.find((p) => p.id === 'P5')!
    expect(calculateFreight(p4, 10000)).toBe(0)
    expect(calculateFreight(p5, 10000)).toBe(0)
  })
})

describe('getApplicableTariff', () => {
  it('resolves provider + feedType + invoice month', () => {
    const tariff = getApplicableTariff('P1', 'Valdeón 30 Extra', '2026-07-13', tariffs)
    expect(tariff?.pricePerKg).toBe(0.334)
  })
})

describe('calculatePriceDiscrepancy', () => {
  it('finds the required +196,80 € discrepancy on invoice 7090', () => {
    const invoice = seedInvoices.find((i) => i.id === '7090')!
    const tariff = getApplicableTariff(invoice.providerId, invoice.feedType!, invoice.date, tariffs)
    const result = calculatePriceDiscrepancy(invoice, tariff)
    expect(result.hasDiscrepancy).toBe(true)
    expect(result.amount).toBeCloseTo(196.8, 2)
  })

  it('finds no discrepancy when invoiced price matches the tariff', () => {
    const invoice = seedInvoices.find((i) => i.id === '7091')!
    const tariff = getApplicableTariff(invoice.providerId, invoice.feedType!, invoice.date, tariffs)
    const result = calculatePriceDiscrepancy(invoice, tariff)
    expect(result.hasDiscrepancy).toBe(false)
    expect(result.amount).toBe(0)
  })
})
