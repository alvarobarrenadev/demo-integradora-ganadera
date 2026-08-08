import type { FeedConsumptionRecord } from '../../types/feedConsumption'
import { tariffs } from './tariffs'
import { providers } from './providers'
import { roundCurrency } from '../../utils/currency'

const feedProviderIds = providers.filter((p) => p.category === 'feed').map((p) => p.id)
const integratedIdsByProvider: Record<string, number[]> = {
  P1: [1, 9, 26, 40],
  P2: [12, 14, 22],
  P3: [18, 32],
  P4: [5, 29, 33],
}

function averagePriceForProviderMonth(providerId: string, month: string): number {
  const rows = tariffs.filter((t) => t.providerId === providerId && t.month === month)
  if (rows.length === 0) return 0.33
  return rows.reduce((sum, t) => sum + t.pricePerKg, 0) / rows.length
}

function monthsJan2025ToJul2026(): string[] {
  const months: string[] = []
  for (let year = 2025; year <= 2026; year += 1) {
    const lastMonth = year === 2026 ? 7 : 12
    for (let month = 1; month <= lastMonth; month += 1) {
      months.push(`${year}-${String(month).padStart(2, '0')}`)
    }
  }
  return months
}

/**
 * Compact deterministic monthly consumption aggregate per feed provider,
 * spanning Jan 2025–Jul 2026 — enough for real annual/year-over-year
 * consumption reports without hundreds of synthetic invoices. kg volumes are
 * a fixed formula (not random); base/freight/total are computed from the
 * real historical tariff data.
 */
export const feedConsumptionHistory: FeedConsumptionRecord[] = monthsJan2025ToJul2026().flatMap((month, monthIndex) =>
  feedProviderIds.map((providerId, providerIndex) => {
    const provider = providers.find((p) => p.id === providerId)!
    const kg = 8000 + ((monthIndex * 137 + providerIndex * 911) % 4000)
    const price = averagePriceForProviderMonth(providerId, month)
    const providerTariffs = tariffs.filter((t) => t.providerId === providerId && t.month === month)
    const integratedIds = integratedIdsByProvider[providerId]
    const feedBaseAmount = roundCurrency(kg * price)
    const freight = roundCurrency(kg * provider.freightRatePerKg)
    return {
      id: `feedhist-${providerId}-${month}`,
      month,
      providerId,
      integratedId: integratedIds[monthIndex % integratedIds.length],
      feedType: providerTariffs[monthIndex % providerTariffs.length]?.feedType ?? 'Pienso',
      kg,
      feedBaseAmount,
      freight,
      total: roundCurrency(feedBaseAmount + freight),
    }
  }),
)
