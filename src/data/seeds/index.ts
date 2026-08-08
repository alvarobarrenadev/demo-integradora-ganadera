import type { Integrated } from '../../types/integrated'
import type { Settlement } from '../../types/settlement'
import type { EmittedInvoice } from '../../types/emittedInvoice'
import { providers } from './providers'
import { tariffs } from './tariffs'
import { integrateds as baseIntegrateds } from './integrateds'
import { invoices } from './invoices'
import { cebas } from './cebas'
import { payments } from './payments'
import { receivables } from './receivables'
import { clients } from './clients'
import { logisticsMovements } from './logistics'
import { transporters, trucks } from './transporters'
import { feedConsumptionHistory } from './feedConsumptionHistory'

/** Integrateds whose ceba is currently active/ready — activeCebaId patched on here, not hand-duplicated in integrateds.ts. */
const ACTIVE_CEBA_BY_INTEGRATED: Record<number, string> = {
  14: 'V-118',
  18: 'V-119',
  22: 'V-121',
  5: 'V-122',
}

const integrateds: Integrated[] = baseIntegrateds.map((integrated) =>
  ACTIVE_CEBA_BY_INTEGRATED[integrated.id]
    ? { ...integrated, activeCebaId: ACTIVE_CEBA_BY_INTEGRATED[integrated.id] }
    : integrated,
)

export const seeds = {
  providers,
  tariffs,
  integrateds,
  invoices,
  cebas,
  payments,
  receivables,
  clients,
  logisticsMovements,
  settlements: [] as Settlement[],
  emittedInvoices: [] as EmittedInvoice[],
  transporters,
  trucks,
}

export { feedConsumptionHistory }
