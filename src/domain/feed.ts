import type { Ceba } from '../types/ceba'
import type { Invoice } from '../types/invoice'
import { roundCurrency } from '../utils/currency'

/** kg × invoicedPricePerKg — the feed cost WITHOUT freight. */
export function feedBaseAmount(invoice: Pick<Invoice, 'kg' | 'invoicedPricePerKg'>): number {
  if (invoice.kg == null || invoice.invoicedPricePerKg == null) return 0
  return roundCurrency(invoice.kg * invoice.invoicedPricePerKg)
}

/**
 * Feed invoices (provider.category === 'feed'): feedCost accumulates the base
 * amount only — freight is tracked separately on the invoice and paid to the
 * supplier via Treasury, but it never contaminates Ceba.feedCost.
 */
export function applyFeedInvoiceToCeba(ceba: Ceba, invoice: Pick<Invoice, 'kg' | 'invoicedPricePerKg'>): Ceba {
  return {
    ...ceba,
    feedKg: ceba.feedKg + (invoice.kg ?? 0),
    feedCost: roundCurrency(ceba.feedCost + feedBaseAmount(invoice)),
  }
}

/**
 * Medication invoices (provider.category === 'medication', i.e. P5/VetSalud):
 * route the full invoice total to medicationCost, never feedKg/feedCost.
 * Medication invoices always have freight 0, so total already equals the base.
 *
 * Classification MUST be by provider.category, never by parsing feedType text
 * — VetSalud's product is literally named "Medicado M-2 (pienso medicado)"
 * and contains the word "pienso," but it still routes here.
 */
export function applyMedicationInvoiceToCeba(ceba: Ceba, invoice: Pick<Invoice, 'total'>): Ceba {
  return {
    ...ceba,
    medicationCost: roundCurrency(ceba.medicationCost + invoice.total),
  }
}
