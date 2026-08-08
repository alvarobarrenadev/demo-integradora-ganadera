import type { Invoice } from '../types/invoice'
import type { Provider } from '../types/provider'
import type { FeedTariff } from '../types/tariff'
import { roundCurrency } from '../utils/currency'

/**
 * {month}{correlativo:03d} — month has no fixed width and there is no year
 * component (7090 = month 7 + 090; 8001 = month 8 + 001; 5211 = month 5 + 211).
 *
 * Invoice.date is the sole source of truth for month/year — the filter
 * operates on that field directly, never on receivedAt and never by
 * re-parsing internalNumber, so a late-arriving invoice (5211 in July) is
 * still numbered against other May invoices with zero special-casing.
 */
export function generateInternalInvoiceNumber(invoiceDate: string, invoices: Invoice[]): string {
  const year = Number(invoiceDate.slice(0, 4))
  const month = Number(invoiceDate.slice(5, 7))

  const sameMonth = invoices.filter((inv) => {
    const invYear = Number(inv.date.slice(0, 4))
    const invMonth = Number(inv.date.slice(5, 7))
    return invYear === year && invMonth === month
  })

  const maxCorrelativo = sameMonth.reduce((max, inv) => {
    const correlativo = Number(inv.internalNumber.slice(-3))
    return Number.isFinite(correlativo) ? Math.max(max, correlativo) : max
  }, 0)

  return `${month}${String(maxCorrelativo + 1).padStart(3, '0')}`
}

/** porte = kg × tarifa_porte_proveedor — providers that don't charge freight simply have freightRatePerKg 0. */
export function calculateFreight(provider: Provider, kg: number): number {
  return roundCurrency(kg * provider.freightRatePerKg)
}

export function getApplicableTariff(
  providerId: string,
  feedType: string,
  invoiceDate: string,
  tariffs: FeedTariff[],
): FeedTariff | undefined {
  const month = invoiceDate.slice(0, 7) // YYYY-MM
  return tariffs.find((t) => t.providerId === providerId && t.feedType === feedType && t.month === month)
}

export interface PriceDiscrepancy {
  hasDiscrepancy: boolean
  /** Signed: kg × (precio facturado − tarifa vigente). Positive means overcharged. */
  amount: number
}

/**
 * Discrepancy is always derived from invoicedPricePerKg vs. the applicable
 * tariff — never from Invoice.status, which only tracks workflow stage and
 * moves to 'validated' regardless of whether a discrepancy existed.
 */
export function calculatePriceDiscrepancy(
  invoice: Pick<Invoice, 'kg' | 'invoicedPricePerKg'>,
  tariff: FeedTariff | undefined,
): PriceDiscrepancy {
  if (!tariff || invoice.kg == null || invoice.invoicedPricePerKg == null) {
    return { hasDiscrepancy: false, amount: 0 }
  }
  const amount = roundCurrency(invoice.kg * (invoice.invoicedPricePerKg - tariff.pricePerKg))
  return { hasDiscrepancy: amount !== 0, amount }
}
