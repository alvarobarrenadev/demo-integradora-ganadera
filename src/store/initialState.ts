import { seeds } from '../data/seeds'
import type { Provider } from '../types/provider'
import type { FeedTariff } from '../types/tariff'
import type { Integrated } from '../types/integrated'
import type { Invoice } from '../types/invoice'
import type { Ceba } from '../types/ceba'
import type { Payment, Receivable, Client } from '../types/treasury'
import type { LogisticsMovement } from '../types/logistics'
import type { Settlement } from '../types/settlement'
import type { EmittedInvoice } from '../types/emittedInvoice'
import type { Transporter, Truck } from '../types/transporter'

export interface AppData {
  providers: Provider[]
  tariffs: FeedTariff[]
  integrateds: Integrated[]
  invoices: Invoice[]
  cebas: Ceba[]
  payments: Payment[]
  receivables: Receivable[]
  clients: Client[]
  logisticsMovements: LogisticsMovement[]
  settlements: Settlement[]
  emittedInvoices: EmittedInvoice[]
  transporters: Transporter[]
  trucks: Truck[]
}

/** Data-only, deep-cloned — never returns actions, so resetDemo() can safely merge this without wiping the store's actions. */
export function createInitialState(): AppData {
  return structuredClone(seeds)
}
