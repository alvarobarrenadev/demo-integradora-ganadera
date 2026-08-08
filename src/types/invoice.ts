export type InvoiceStatus = 'pending' | 'validated' | 'discrepancy'

export interface Invoice {
  id: string

  internalNumber: string
  supplierInvoiceNumber: string

  providerId: string
  integratedId?: number

  /** Invoice's own date (governs numbering) — YYYY-MM-DD */
  date: string
  /** Date it was actually received (never used for numbering) — YYYY-MM-DD */
  receivedAt: string

  feedType?: string
  kg?: number

  invoicedPricePerKg?: number
  expectedPricePerKg?: number

  freight: number
  total: number

  dueDate: string

  paymentMethod: string
  bankId?: string

  status: InvoiceStatus

  sentToAccounting: boolean
  archived: boolean
}
