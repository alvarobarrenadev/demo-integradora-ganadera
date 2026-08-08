export interface Settlement {
  id: string

  cebaId: string
  integratedId: number

  pigs: number
  conversion: number

  baseAmount: number

  bonusPerPig: number
  bonusAmount: number

  grossAmount: number

  retentionRate: number
  retentionAmount: number

  netAmount: number

  generatedAt: string
}
