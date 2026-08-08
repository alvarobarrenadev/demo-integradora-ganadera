import type { AppState } from './useAppStore'
import { DEMO_REFERENCE_DATE, addDays } from '../utils/dates'
import { calculateConversion } from '../domain/cebas'
import { calculatePriceDiscrepancy, getApplicableTariff } from '../domain/invoices'
import { isDvrExpiringSoon } from '../domain/dvr'
import { calculateWeeklyNet, sumPaymentsDue, sumReceivablesDue } from '../domain/treasury'
import { roundCurrency } from '../utils/currency'

export const selectPendingInvoices = (state: AppState) =>
  state.invoices.filter((i) => i.status === 'pending' || i.status === 'discrepancy')

export const selectInvoicesThisMonth = (state: AppState) => {
  const month = DEMO_REFERENCE_DATE.slice(0, 7)
  return state.invoices.filter((i) => i.date.startsWith(month))
}

export const selectPaymentsNext7Days = (state: AppState) => {
  const end = addDays(DEMO_REFERENCE_DATE, 7)
  return state.payments.filter((p) => p.status !== 'paid' && p.dueDate >= DEMO_REFERENCE_DATE && p.dueDate <= end)
}

export const selectActiveCebas = (state: AppState) => state.cebas.filter((c) => c.status !== 'closed')

export const selectReadyToCloseCebas = (state: AppState) => state.cebas.filter((c) => c.status === 'ready_to_close')

export const selectClosedCebas = (state: AppState) => state.cebas.filter((c) => c.status === 'closed')

export const selectAverageConversion = (state: AppState) => {
  const conversions = state.cebas
    .map((c) => calculateConversion(c))
    .filter((c): c is number => c != null)
  if (conversions.length === 0) return null
  return roundCurrency(conversions.reduce((sum, c) => sum + c, 0) / conversions.length)
}

export interface PriceDiscrepancyEntry {
  invoiceId: string
  amount: number
}

export const selectPriceDiscrepancies = (state: AppState): PriceDiscrepancyEntry[] =>
  state.invoices
    .filter((i) => i.feedType && i.kg != null && i.invoicedPricePerKg != null)
    .map((i) => {
      const tariff = getApplicableTariff(i.providerId, i.feedType!, i.date, state.tariffs)
      const result = calculatePriceDiscrepancy(i, tariff)
      return { invoiceId: i.id, amount: result.amount }
    })
    .filter((entry) => entry.amount !== 0)

export interface DvrAlert {
  integratedId: number
  name: string
  dvrRenewalDate: string
}

function toISO(dmy: string): string {
  const [d, m, y] = dmy.split('/')
  return `${y}-${m}-${d}`
}

export const selectDvrAlerts = (state: AppState): DvrAlert[] =>
  state.integrateds
    .filter((i) => isDvrExpiringSoon(toISO(i.dvrRenewalDate), DEMO_REFERENCE_DATE))
    .map((i) => ({ integratedId: i.id, name: i.name, dvrRenewalDate: i.dvrRenewalDate }))

export interface WeekForecast {
  start: string
  end: string
  receivables: number
  payments: number
  net: number
}

export const selectWeeklyCashForecast = (state: AppState, weeks = 4): WeekForecast[] => {
  const result: WeekForecast[] = []
  for (let i = 0; i < weeks; i += 1) {
    const start = addDays(DEMO_REFERENCE_DATE, i * 7)
    const end = addDays(DEMO_REFERENCE_DATE, i * 7 + 6)
    const window = { start, end }
    result.push({
      start,
      end,
      receivables: sumReceivablesDue(state.receivables, window),
      payments: sumPaymentsDue(state.payments, window),
      net: calculateWeeklyNet(state.payments, state.receivables, window),
    })
  }
  return result
}

export interface DayForecast {
  date: string
  receivables: number
  payments: number
  net: number
}

export const selectDailyCashForecast = (state: AppState, days = 14): DayForecast[] => {
  const result: DayForecast[] = []
  for (let i = 0; i < days; i += 1) {
    const date = addDays(DEMO_REFERENCE_DATE, i)
    const window = { start: date, end: date }
    result.push({
      date,
      receivables: sumReceivablesDue(state.receivables, window),
      payments: sumPaymentsDue(state.payments, window),
      net: calculateWeeklyNet(state.payments, state.receivables, window),
    })
  }
  return result
}

export const selectFeedExpenseByMonth = (state: AppState) => {
  const byMonth = new Map<string, number>()
  for (const invoice of state.invoices) {
    if (invoice.status !== 'validated' || invoice.kg == null || invoice.invoicedPricePerKg == null) continue
    const provider = state.providers.find((p) => p.id === invoice.providerId)
    if (provider?.category !== 'feed') continue
    const month = invoice.date.slice(0, 7)
    const base = roundCurrency(invoice.kg * invoice.invoicedPricePerKg)
    byMonth.set(month, roundCurrency((byMonth.get(month) ?? 0) + base))
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }))
}

/** Per-integrado 2% retention ledger — derived from real Settlement records, never EmittedInvoice copies. */
export const selectRetentionLedger = (state: AppState) => {
  const byIntegrated = new Map<number, number>()
  for (const settlement of state.settlements) {
    byIntegrated.set(
      settlement.integratedId,
      roundCurrency((byIntegrated.get(settlement.integratedId) ?? 0) + settlement.retentionAmount),
    )
  }
  return [...byIntegrated.entries()].map(([integratedId, retentionAmount]) => {
    const integrated = state.integrateds.find((i) => i.id === integratedId)
    return { integratedId, name: integrated?.name ?? `#${integratedId}`, retentionAmount }
  })
}

export const selectSettlementForCeba = (state: AppState, cebaId: string) =>
  state.settlements.find((s) => s.cebaId === cebaId)

export const selectEmittedInvoiceForSettlement = (state: AppState, settlementId: string) =>
  state.emittedInvoices.find((e) => e.settlementId === settlementId)
