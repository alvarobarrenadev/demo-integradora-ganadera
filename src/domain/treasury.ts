import type { Payment } from '../types/treasury'
import type { Receivable } from '../types/treasury'
import { roundCurrency } from '../utils/currency'

export interface WeekWindow {
  start: string
  end: string
}

function isDue(dueDate: string, window: WeekWindow): boolean {
  return dueDate >= window.start && dueDate <= window.end
}

export function sumPaymentsDue(payments: Payment[], window: WeekWindow): number {
  return roundCurrency(
    payments
      .filter((p) => p.status !== 'paid' && isDue(p.dueDate, window))
      .reduce((sum, p) => sum + p.amount, 0),
  )
}

export function sumReceivablesDue(receivables: Receivable[], window: WeekWindow): number {
  return roundCurrency(
    receivables
      .filter((r) => !r.paidAt && isDue(r.dueDate, window))
      .reduce((sum, r) => sum + r.amount, 0),
  )
}

/** weeklyNet = receivables due in the window − payments due in the window. */
export function calculateWeeklyNet(payments: Payment[], receivables: Receivable[], window: WeekWindow): number {
  return roundCurrency(sumReceivablesDue(receivables, window) - sumPaymentsDue(payments, window))
}
