/**
 * "Factura emitida" — the document Valdeón issues to an integrado for a settlement.
 * Own numbering series (FE-YYYY-NNN), independent of supplier Invoice.internalNumber.
 * Decoupled from Settlement generation — created by its own explicit action.
 */
export interface EmittedInvoice {
  id: string
  emittedNumber: string
  integratedId: number
  settlementId: string
  date: string
  amount: number
  retentionAmount: number
}
