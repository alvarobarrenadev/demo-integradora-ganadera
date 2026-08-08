export interface Integrated {
  id: number
  name: string
  location: string
  cea: string
  capacity: number

  feedProviderId: string

  dvrRenewalDate: string
  welfareCertified: boolean

  controller: string
  veterinaryUnit: string

  dni: string
  email: string
  phone: string

  pricePerPig: number
  /** Day of month (1-28) invoices/settlements for this integrated are billed on. */
  billingDay: number

  activeCebaId?: string
}
