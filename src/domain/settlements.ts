import type { Ceba } from '../types/ceba'
import type { Integrated } from '../types/integrated'
import type { Settlement } from '../types/settlement'
import { roundCurrency } from '../utils/currency'
import { parseDate, toISODate } from '../utils/dates'
import { calculateConversion } from './cebas'

const RETENTION_RATE = 0.02

function bonusPerPigFor(conversion: number): number {
  if (conversion <= 2.35) return 1.2
  if (conversion <= 2.45) return 0.9
  return 0
}

export type NewSettlement = Omit<Settlement, 'id' | 'generatedAt'>

/**
 * Uses Integrated.pricePerPig — never a hardcoded 13.50, even though every
 * seeded integrated currently uses exactly that value. Caller must ensure
 * the ceba is closed and has a valid conversion before calling this.
 */
export function calculateSettlement(ceba: Ceba, integrated: Integrated): NewSettlement {
  const conversion = calculateConversion(ceba)
  if (conversion == null) {
    throw new Error('calculateSettlement: ceba has no valid conversion (missing exit weight or non-positive gain)')
  }

  const pigs = ceba.animalsExited
  const baseAmount = roundCurrency(pigs * integrated.pricePerPig)
  const bonusPerPig = bonusPerPigFor(conversion)
  const bonusAmount = roundCurrency(pigs * bonusPerPig)
  const grossAmount = roundCurrency(baseAmount + bonusAmount)
  const retentionAmount = roundCurrency(grossAmount * RETENTION_RATE)
  const netAmount = roundCurrency(grossAmount - retentionAmount)

  return {
    cebaId: ceba.id,
    integratedId: ceba.integratedId,
    pigs,
    conversion,
    baseAmount,
    bonusPerPig,
    bonusAmount,
    grossAmount,
    retentionRate: RETENTION_RATE,
    retentionAmount,
    netAmount,
  }
}

/** Next occurrence of billingDay on/after fromDate. */
export function getNextBillingDate(billingDay: number, fromDate: string): string {
  const from = parseDate(fromDate)
  const targetMonth = from.getDate() <= billingDay ? from.getMonth() : from.getMonth() + 1
  return toISODate(new Date(from.getFullYear(), targetMonth, billingDay))
}
