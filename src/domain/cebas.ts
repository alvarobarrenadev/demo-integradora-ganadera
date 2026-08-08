import type { Ceba } from '../types/ceba'
import { roundTo } from '../utils/numbers'
import { daysBetween } from '../utils/dates'

/**
 * conversión = kg pienso / (kg salida − kg entrada), rounded to 2 decimals.
 * The rounded value is what's used for the settlement bonus tier lookup.
 * Returns null on missing exit weight / division by zero / non-positive
 * weight gain, per CLAUDE.md §8.5's edge cases.
 */
export function calculateConversion(ceba: Pick<Ceba, 'feedKg' | 'entryKg' | 'exitKg'>): number | null {
  const gain = ceba.exitKg - ceba.entryKg
  if (ceba.exitKg <= 0 || gain <= 0) return null
  return roundTo(ceba.feedKg / gain, 2)
}

/** entryDate → closeDate (or the demo reference date while still open). */
export function getCebaDaysInCycle(ceba: Pick<Ceba, 'entryDate' | 'closeDate'>, referenceDate: string): number {
  return daysBetween(ceba.entryDate, ceba.closeDate ?? referenceDate)
}

/** True once every entered animal is accounted for (exited or dead) — a precondition for closing. */
export function isFullyAccountedFor(ceba: Pick<Ceba, 'animalsEntered' | 'animalsExited' | 'deaths'>): boolean {
  return ceba.animalsExited + ceba.deaths === ceba.animalsEntered
}
