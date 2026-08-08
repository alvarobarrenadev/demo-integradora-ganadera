export interface Provider {
  id: string
  name: string
  category: 'feed' | 'medication'
  freightRatePerKg: number
}
