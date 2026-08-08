/**
 * Fixed demo "today" — never `new Date()`. Everything that means "today" in
 * the demo (DVR alerts, overdue status, próximos-7-días windows, forecast
 * boundaries) derives from this single constant, so the demo behaves
 * identically regardless of the real calendar date it's run on.
 */
export const DEMO_REFERENCE_DATE = '2026-07-15'

export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Whole days from `a` to `b` (positive if `b` is after `a`). */
export function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / msPerDay)
}

export function addDays(value: string, days: number): string {
  const d = parseDate(value)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** dd/mm/yyyy, per CLAUDE.md §18. */
export function formatDateEs(value: string): string {
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

const numberFormatterEs = new Intl.NumberFormat('es-ES')

export function fmtNumber(value: number): string {
  return numberFormatterEs.format(value)
}
