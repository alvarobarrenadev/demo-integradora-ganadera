import type { Transporter, Truck } from '../../types/transporter'

/** Literal brief transporters (§15.7): two own drivers, one regular external carrier. */
export const transporters: Transporter[] = [
  { id: 'TRP-1', name: 'Flota propia', kind: 'propio' },
  { id: 'TRP-2', name: 'Transportes Cueto SL', kind: 'externo' },
]

/** Two fictional plates for the own trucks, per the brief's instruction. */
export const trucks: Truck[] = [
  { id: 'TRK-1', plate: '4127-LBX', transporterId: 'TRP-1', driver: 'A. Sierra' },
  { id: 'TRK-2', plate: '7853-MDK', transporterId: 'TRP-1', driver: 'R. Campos' },
]
