import type { Receivable } from '../../types/treasury'

/**
 * Deterministic invented fixture set (not derived from invoices) tied to the
 * 4 brief-given clients — covers an overdue case, a near-term case (within
 * DEMO_REFERENCE_DATE's next 7 days), and further-out cases so the weekly
 * forecast has real receivables to combine with payments.
 */
export const receivables: Receivable[] = [
  { id: 'REC-1', clientId: 'CLI-2', date: '2026-06-15', dueDate: '2026-06-30', amount: 12300, paymentMethod: 'Transferencia' },
  { id: 'REC-2', clientId: 'CLI-1', date: '2026-06-20', dueDate: '2026-07-10', amount: 18500, paymentMethod: 'Transferencia' },
  { id: 'REC-3', clientId: 'CLI-2', date: '2026-06-25', dueDate: '2026-07-18', amount: 24100, paymentMethod: 'Transferencia' },
  { id: 'REC-4', clientId: 'CLI-3', date: '2026-07-01', dueDate: '2026-07-24', amount: 15600, paymentMethod: 'Recibo' },
  { id: 'REC-5', clientId: 'CLI-4', date: '2026-07-03', dueDate: '2026-08-01', amount: 21200, paymentMethod: 'Transferencia' },
  { id: 'REC-6', clientId: 'CLI-1', date: '2026-07-08', dueDate: '2026-08-08', amount: 19800, paymentMethod: 'Transferencia' },
]
