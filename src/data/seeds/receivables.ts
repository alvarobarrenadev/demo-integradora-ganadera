import type { Receivable } from '../../types/treasury'

/** Literal brief examples first, followed by coherent forecast fixtures. */
export const receivables: Receivable[] = [
  { id: 'REC-1', clientId: 'CLI-1', date: '2026-07-08', dueDate: '2026-08-09', amount: 43300, paymentMethod: 'Transferencia' },
  { id: 'REC-2', clientId: 'CLI-2', date: '2026-05-12', dueDate: '2026-07-06', amount: 22400, paymentMethod: 'Confirming' },
  { id: 'REC-3', clientId: 'CLI-2', date: '2026-06-03', dueDate: '2026-07-18', amount: 24100, paymentMethod: 'Confirming' },
  { id: 'REC-4', clientId: 'CLI-3', date: '2026-05-25', dueDate: '2026-07-24', amount: 15600, paymentMethod: 'Pagaré' },
  { id: 'REC-5', clientId: 'CLI-4', date: '2026-07-03', dueDate: '2026-08-01', amount: 21200, paymentMethod: 'Transferencia' },
  { id: 'REC-6', clientId: 'CLI-1', date: '2026-07-08', dueDate: '2026-08-08', amount: 19800, paymentMethod: 'Transferencia' },
]
