export interface FeedTariff {
  id: string
  providerId: string
  feedType: string
  /** YYYY-MM */
  month: string
  pricePerKg: number
}
