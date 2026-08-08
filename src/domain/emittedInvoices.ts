import type { EmittedInvoice } from '../types/emittedInvoice'

/**
 * FE-{year}-{correlativo:03d} — a deterministic, independent numbering series
 * for emitted invoices, filling a gap the brief leaves unspecified beyond
 * "own numbering". Never mixed with supplier Invoice.internalNumber.
 */
export function generateEmittedInvoiceNumber(emittedInvoices: EmittedInvoice[], year: number): string {
  const prefix = `FE-${year}-`
  const maxCorrelativo = emittedInvoices.reduce((max, e) => {
    if (!e.emittedNumber.startsWith(prefix)) return max
    const correlativo = Number(e.emittedNumber.slice(prefix.length))
    return Number.isFinite(correlativo) ? Math.max(max, correlativo) : max
  }, 0)
  return `${prefix}${String(maxCorrelativo + 1).padStart(3, '0')}`
}
