export type LogisticsMovementType = 'salida' | 'entrada'
export type LogisticsArchiveStatus = 'archivado' | 'pendiente'

export interface LogisticsMovement {
  id: string
  type: LogisticsMovementType
  date: string
  integratedId: number
  cebaId: string
  animals: number
  kg: number

  // salida-only
  matadero?: string
  welfare?: boolean
  transportType?: 'interno' | 'externo'
  driver?: string
  albaran?: string
  archiveStatus?: LogisticsArchiveStatus

  // entrada-only
  origin?: string
}
