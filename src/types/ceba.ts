export type CebaStatus = 'active' | 'ready_to_close' | 'closed'

export interface Ceba {
  id: string
  integratedId: number

  origin: string

  entryDate: string

  animalsEntered: number
  entryKg: number

  /** Running aggregate — sum of animals across every salida LogisticsMovement for this ceba. */
  animalsExited: number
  /** Running aggregate — sum of kg across every salida LogisticsMovement for this ceba. */
  exitKg: number

  feedKg: number
  feedCost: number

  medicationCost: number

  deaths: number

  status: CebaStatus

  closeDate?: string
}
