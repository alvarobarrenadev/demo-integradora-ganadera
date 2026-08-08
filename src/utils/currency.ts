import { roundTo } from './numbers'

export function roundCurrency(value: number): number {
  return roundTo(value, 2)
}

const eurFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

export function fmtEUR(value: number): string {
  return eurFormatter.format(value)
}

const priceFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

/** €/kg prices are displayed with 3 decimals per the brief's seed examples (0,334 €/kg). */
export function fmtPricePerKg(value: number): string {
  return `${priceFormatter.format(value)} €/kg`
}
