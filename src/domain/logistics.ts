import type { Ceba } from '../types/ceba'
import { isFullyAccountedFor } from './cebas'

/**
 * The single canonical "apply a salida to a ceba" implementation — shared by
 * addCebaExit and addLogisticsMovement's salida branch (the Cebas UI and the
 * Logística UI's manual form both end up calling this same function, never
 * two separate implementations). Auto-flips status to 'ready_to_close' the
 * moment every entered animal is accounted for.
 */
export function applyExitToCeba(ceba: Ceba, movement: { animals: number; kg: number }): Ceba {
  const next: Ceba = {
    ...ceba,
    animalsExited: ceba.animalsExited + movement.animals,
    exitKg: ceba.exitKg + movement.kg,
  }
  if (next.status === 'active' && isFullyAccountedFor(next)) {
    next.status = 'ready_to_close'
  }
  return next
}
