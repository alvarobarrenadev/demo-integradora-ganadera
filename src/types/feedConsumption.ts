/**
 * Compact monthly aggregate — separate from FeedTariff (price history): this
 * is consumption history (kg/€ actually moved), needed for annual and
 * year-over-year reports that individual invoices alone can't support.
 */
export interface FeedConsumptionRecord {
  id: string
  /** YYYY-MM */
  month: string
  providerId: string
  kg: number
  feedBaseAmount: number
  freight: number
  total: number
}
