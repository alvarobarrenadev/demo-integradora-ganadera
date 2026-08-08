import { describe, expect, it } from 'vitest'
import { calculateWeeklyNet } from './treasury'
import type { Payment } from '../types/treasury'
import type { Receivable } from '../types/treasury'

describe('calculateWeeklyNet', () => {
  it('equals receivables due minus payments due in the same window', () => {
    const window = { start: '2026-07-15', end: '2026-07-21' }
    const payments: Payment[] = [
      { id: 'p1', sourceType: 'invoice', sourceId: 'x', beneficiary: 'x', amount: 1000, dueDate: '2026-07-18', paymentMethod: 'Transferencia', status: 'pending' },
      { id: 'p2', sourceType: 'invoice', sourceId: 'x', beneficiary: 'x', amount: 500, dueDate: '2026-08-01', paymentMethod: 'Transferencia', status: 'pending' }, // outside window
    ]
    const receivables: Receivable[] = [
      { id: 'r1', clientId: 'c1', date: '2026-07-01', dueDate: '2026-07-20', amount: 2400, paymentMethod: 'Transferencia' },
    ]
    expect(calculateWeeklyNet(payments, receivables, window)).toBe(2400 - 1000)
  })

  it('excludes already-paid payments and receivables', () => {
    const window = { start: '2026-07-15', end: '2026-07-21' }
    const payments: Payment[] = [
      { id: 'p1', sourceType: 'invoice', sourceId: 'x', beneficiary: 'x', amount: 1000, dueDate: '2026-07-18', paymentMethod: 'Transferencia', status: 'paid', paidAt: '2026-07-16' },
    ]
    const receivables: Receivable[] = [
      { id: 'r1', clientId: 'c1', date: '2026-07-01', dueDate: '2026-07-20', amount: 2400, paymentMethod: 'Transferencia', paidAt: '2026-07-19' },
    ]
    expect(calculateWeeklyNet(payments, receivables, window)).toBe(0)
  })
})
