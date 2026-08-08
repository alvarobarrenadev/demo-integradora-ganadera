export type PaymentStatus = 'pending' | 'paid' | 'overdue'

export interface Payment {
  id: string

  sourceType: 'invoice' | 'settlement'
  sourceId: string

  beneficiary: string

  amount: number
  dueDate: string

  paymentMethod: string
  bankId?: string

  status: PaymentStatus

  /** Only set for payments seeded/marked as already settled — never invented for a pending payment. */
  paidAt?: string
}

/**
 * Receivable has a real contractual dueDate — pending/overdue is always derived
 * live from dueDate vs DEMO_REFERENCE_DATE, never stored (see selectors).
 */
export interface Receivable {
  id: string
  clientId: string
  date: string
  dueDate: string
  amount: number
  paymentMethod: string
  paidAt?: string
}

export interface Client {
  id: string
  name: string
  paymentMethod: string
  bankId?: string
  /** Historical CRM metric only — never used as a contractual due date. */
  avgCollectionDays: number
}
