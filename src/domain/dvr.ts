import { daysBetween } from '../utils/dates'

/** Warn when renewal is less than 30 days away (including already-expired). */
export function isDvrExpiringSoon(renewalDate: string, referenceDate: string): boolean {
  return daysBetween(referenceDate, renewalDate) < 30
}
