import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createInitialState, type AppData } from './initialState'
import type { Invoice } from '../types/invoice'
import type { Ceba } from '../types/ceba'
import type { Payment } from '../types/treasury'
import type { LogisticsMovement } from '../types/logistics'
import type { Settlement } from '../types/settlement'
import type { EmittedInvoice } from '../types/emittedInvoice'
import type { ToastMessage } from '../types/common'
import { generateId } from '../utils/ids'
import { DEMO_REFERENCE_DATE } from '../utils/dates'
import { roundCurrency } from '../utils/currency'
import {
  calculateFreight,
  calculatePriceDiscrepancy,
  generateInternalInvoiceNumber,
  getApplicableTariff,
} from '../domain/invoices'
import { applyFeedInvoiceToCeba, applyMedicationInvoiceToCeba } from '../domain/feed'
import { applyExitToCeba } from '../domain/logistics'
import { calculateConversion, isFullyAccountedFor } from '../domain/cebas'
import { calculateSettlement, getNextBillingDate } from '../domain/settlements'
import { generateEmittedInvoiceNumber } from '../domain/emittedInvoices'
import { buildAugustTariffs } from '../domain/tariffs'

export interface NewCebaEntryInput {
  integratedId: number
  date: string
  origin: string
  feedType: string
  animals: number
  kg: number
  albaran?: string
  archiveStatus?: LogisticsMovement['archiveStatus']
}

export interface NewCebaExitInput {
  cebaId: string
  date: string
  animals: number
  kg: number
  matadero?: string
  welfare?: boolean
  transportType?: 'interno' | 'externo'
  driver?: string
  albaran?: string
  archiveStatus?: LogisticsMovement['archiveStatus']
}

interface AppActions {
  resetDemo: () => void
  simulateIncomingInvoice: () => void
  validateInvoice: (invoiceId: string) => void
  applyAugustTariffs: () => void
  addCebaEntry: (input: NewCebaEntryInput) => void
  addCebaExit: (input: NewCebaExitInput) => void
  closeCeba: (cebaId: string) => void
  generateSettlement: (cebaId: string) => Settlement | undefined
  generateEmittedInvoice: (settlementId: string) => EmittedInvoice | undefined
  addLogisticsMovement: (movement: LogisticsMovement) => void
  dismissToast: () => void
}

export type AppState = AppData & {
  toast: ToastMessage | null
  lastSimulatedInvoiceId: string | null
} & AppActions

function toast(variant: ToastMessage['variant'], title: string, description?: string): ToastMessage {
  return { id: generateId('toast'), variant, title, description }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      toast: null,
      lastSimulatedInvoiceId: null,

      resetDemo: () => {
        useAppStore.persist.clearStorage()
        set({ ...createInitialState(), toast: null, lastSimulatedInvoiceId: null })
      },

      dismissToast: () => set({ toast: null }),

      simulateIncomingInvoice: () => {
        const state = get()
        const date = '2026-07-15'
        const kg = 18200
        const invoicedPricePerKg = 0.334
        const provider = state.providers.find((p) => p.id === 'P2')
        if (!provider) return

        const freight = calculateFreight(provider, kg)
        const total = roundCurrency(kg * invoicedPricePerKg + freight)
        const internalNumber = generateInternalInvoiceNumber(date, state.invoices)
        const tariff = getApplicableTariff('P2', 'Cebo N-80', date, state.tariffs)
        const discrepancy = calculatePriceDiscrepancy({ kg, invoicedPricePerKg }, tariff)

        const invoice: Invoice = {
          id: generateId('inv'),
          internalNumber,
          supplierInvoiceNumber: `F-26/${1000 + state.invoices.length}`,
          providerId: 'P2',
          integratedId: 14,
          date,
          receivedAt: date,
          feedType: 'Cebo N-80',
          kg,
          invoicedPricePerKg,
          expectedPricePerKg: tariff?.pricePerKg,
          freight,
          total,
          dueDate: '2026-08-14',
          paymentMethod: 'Transferencia',
          bankId: 'Caja Rural del Páramo',
          status: discrepancy.hasDiscrepancy ? 'discrepancy' : 'pending',
          sentToAccounting: false,
          archived: false,
        }

        set({
          invoices: [...state.invoices, invoice],
          lastSimulatedInvoiceId: invoice.id,
        })
      },

      validateInvoice: (invoiceId) => {
        const state = get()
        const invoice = state.invoices.find((i) => i.id === invoiceId)
        if (!invoice) return
        if (invoice.status === 'validated') return // idempotent

        const provider = state.providers.find((p) => p.id === invoice.providerId)
        const needsCeba = provider != null

        let ceba: Ceba | undefined
        if (needsCeba && invoice.integratedId != null) {
          const integrated = state.integrateds.find((i) => i.id === invoice.integratedId)
          const candidate = integrated?.activeCebaId
            ? state.cebas.find((c) => c.id === integrated.activeCebaId)
            : undefined
          if (candidate && candidate.status !== 'closed') ceba = candidate
        }

        // Atomic: if propagation is required and no valid ceba exists, fail as a unit.
        if (needsCeba && !ceba) {
          set({
            toast: toast(
              'error',
              'No se puede validar',
              'No hay una ceba activa para el integrado de esta factura.',
            ),
          })
          return
        }

        const patchedInvoice: Invoice = {
          ...invoice,
          status: 'validated',
          sentToAccounting: true,
          archived: true,
        }
        const payment: Payment = {
          id: generateId('pay'),
          sourceType: 'invoice',
          sourceId: invoice.id,
          beneficiary: provider?.name ?? invoice.providerId,
          amount: invoice.total,
          dueDate: invoice.dueDate,
          paymentMethod: invoice.paymentMethod,
          bankId: invoice.bankId,
          status: 'pending',
        }

        let nextCebas = state.cebas
        if (ceba && provider) {
          const patched =
            provider.category === 'feed'
              ? applyFeedInvoiceToCeba(ceba, invoice)
              : applyMedicationInvoiceToCeba(ceba, invoice)
          nextCebas = state.cebas.map((c) => (c.id === ceba!.id ? patched : c))
        }

        set({
          invoices: state.invoices.map((i) => (i.id === invoiceId ? patchedInvoice : i)),
          payments: [...state.payments, payment],
          cebas: nextCebas,
          toast: toast(
            'success',
            'Factura validada',
            ceba
              ? 'Se ha registrado automáticamente en Tesorería, Pienso y Ceba.'
              : 'Se ha registrado automáticamente en Tesorería y Contabilidad.',
          ),
        })
      },

      applyAugustTariffs: () => {
        const state = get()
        if (state.tariffs.some((t) => t.month === '2026-08')) return // idempotent
        const august = buildAugustTariffs(state.tariffs)
        set({
          tariffs: [...state.tariffs, ...august],
          toast: toast('success', 'Tarifas de agosto aplicadas', 'Las nuevas tarifas ya están vigentes.'),
        })
      },

      addLogisticsMovement: (movement) => {
        const state = get()
        if (state.logisticsMovements.some((m) => m.id === movement.id)) return // idempotent duplicate guard
        if (!movement.date || movement.animals <= 0 || movement.kg <= 0) {
          set({ toast: toast('error', 'Datos no válidos', 'La fecha, los animales y los kilos deben ser válidos.') })
          return
        }

        if (movement.type === 'entrada') {
          if (!movement.origin?.trim() || !movement.feedType?.trim()) {
            set({ toast: toast('error', 'Datos incompletos', 'Indica el origen y el tipo de pienso.') })
            return
          }
          const integrated = state.integrateds.find((i) => i.id === movement.integratedId)
          if (!integrated) return
          const current = integrated.activeCebaId
            ? state.cebas.find((c) => c.id === integrated.activeCebaId)
            : undefined
          if (current && current.status !== 'closed') {
            set({ toast: toast('error', 'No se puede registrar', 'Este integrado ya tiene una ceba activa.') })
            return
          }
          const ceba: Ceba = {
            id: movement.cebaId,
            integratedId: movement.integratedId,
            origin: movement.origin ?? '',
            feedType: movement.feedType ?? '',
            entryDate: movement.date,
            animalsEntered: movement.animals,
            entryKg: movement.kg,
            animalsExited: 0,
            exitKg: 0,
            feedKg: 0,
            feedCost: 0,
            medicationCost: 0,
            deaths: 0,
            status: 'active',
          }
          set({
            cebas: [...state.cebas, ceba],
            logisticsMovements: [...state.logisticsMovements, movement],
            integrateds: state.integrateds.map((i) =>
              i.id === movement.integratedId ? { ...i, activeCebaId: ceba.id } : i,
            ),
            toast: toast('success', 'Entrada registrada', 'Nueva ceba creada.'),
          })
          return
        }

        // salida — the single canonical "apply exit" helper, shared with addCebaExit.
        const ceba = state.cebas.find((c) => c.id === movement.cebaId)
        if (!ceba || ceba.integratedId !== movement.integratedId) {
          set({ toast: toast('error', 'Ceba no válida', 'La salida no corresponde con el integrado seleccionado.') })
          return
        }
        if (ceba.status === 'closed') {
          set({ toast: toast('error', 'No se puede registrar', 'Esta ceba ya está cerrada.') })
          return
        }
        const patched = applyExitToCeba(ceba, { animals: movement.animals, kg: movement.kg })
        set({
          cebas: state.cebas.map((c) => (c.id === ceba.id ? patched : c)),
          logisticsMovements: [...state.logisticsMovements, movement],
          toast: toast('success', 'Salida registrada', 'La ceba se ha actualizado.'),
        })
      },

      addCebaEntry: (input) => {
        get().addLogisticsMovement({
          id: generateId('log'),
          type: 'entrada',
          date: input.date,
          integratedId: input.integratedId,
          cebaId: generateId('ceba'),
          animals: input.animals,
          kg: input.kg,
          origin: input.origin,
          feedType: input.feedType,
          albaran: input.albaran,
          archiveStatus: input.archiveStatus ?? 'pendiente',
        })
      },

      addCebaExit: (input) => {
        const ceba = get().cebas.find((c) => c.id === input.cebaId)
        if (!ceba) return
        get().addLogisticsMovement({
          id: generateId('log'),
          type: 'salida',
          date: input.date,
          integratedId: ceba.integratedId,
          cebaId: input.cebaId,
          animals: input.animals,
          kg: input.kg,
          matadero: input.matadero,
          welfare: input.welfare,
          transportType: input.transportType,
          driver: input.driver,
          albaran: input.albaran,
          archiveStatus: input.archiveStatus ?? 'pendiente',
        })
      },

      closeCeba: (cebaId) => {
        const state = get()
        const ceba = state.cebas.find((c) => c.id === cebaId)
        if (!ceba) return
        if (ceba.status === 'closed') return // idempotent

        if (ceba.status !== 'ready_to_close') {
          set({ toast: toast('error', 'No se puede cerrar', 'Esta ceba todavía no está lista para cierre.') })
          return
        }
        if (!isFullyAccountedFor(ceba)) {
          set({ toast: toast('error', 'No se puede cerrar', 'Quedan animales sin justificar (salidas + bajas).') })
          return
        }
        if (calculateConversion(ceba) == null) {
          set({ toast: toast('error', 'No se puede cerrar', 'El peso de salida no es válido.') })
          return
        }

        const patchedCeba: Ceba = { ...ceba, status: 'closed', closeDate: DEMO_REFERENCE_DATE }
        set({
          cebas: state.cebas.map((c) => (c.id === cebaId ? patchedCeba : c)),
          integrateds: state.integrateds.map((i) =>
            i.activeCebaId === cebaId ? { ...i, activeCebaId: undefined } : i,
          ),
          toast: toast('success', 'Ceba cerrada correctamente', 'Se ha preparado la liquidación.'),
        })
      },

      generateSettlement: (cebaId) => {
        const state = get()
        const existing = state.settlements.find((s) => s.cebaId === cebaId)
        if (existing) return existing // idempotent

        const ceba = state.cebas.find((c) => c.id === cebaId)
        if (!ceba || ceba.status !== 'closed') {
          set({ toast: toast('error', 'No se puede liquidar', 'Solo una ceba cerrada puede liquidarse.') })
          return undefined
        }
        const integrated = state.integrateds.find((i) => i.id === ceba.integratedId)
        if (!integrated) return undefined

        const computed = calculateSettlement(ceba, integrated)
        const settlement: Settlement = { ...computed, id: generateId('set'), generatedAt: DEMO_REFERENCE_DATE }
        const dueDate = getNextBillingDate(integrated.billingDay, ceba.closeDate ?? DEMO_REFERENCE_DATE)
        const payment: Payment = {
          id: generateId('pay'),
          sourceType: 'settlement',
          sourceId: settlement.id,
          beneficiary: integrated.name,
          amount: settlement.netAmount, // never grossAmount — retention already withheld
          dueDate,
          paymentMethod: 'Transferencia',
          status: 'pending',
        }

        set({
          settlements: [...state.settlements, settlement],
          payments: [...state.payments, payment],
          toast: toast('success', 'Liquidación generada', 'El pago se ha añadido a la previsión de Tesorería.'),
        })
        return settlement
      },

      generateEmittedInvoice: (settlementId) => {
        const state = get()
        const existing = state.emittedInvoices.find((e) => e.settlementId === settlementId)
        if (existing) return existing // idempotent

        const settlement = state.settlements.find((s) => s.id === settlementId)
        if (!settlement) return undefined

        const year = Number(DEMO_REFERENCE_DATE.slice(0, 4))
        const emittedNumber = generateEmittedInvoiceNumber(state.emittedInvoices, year)
        const emitted: EmittedInvoice = {
          id: generateId('fe'),
          emittedNumber,
          integratedId: settlement.integratedId,
          settlementId: settlement.id,
          date: DEMO_REFERENCE_DATE,
          amount: settlement.netAmount,
          retentionAmount: settlement.retentionAmount,
        }
        set({ emittedInvoices: [...state.emittedInvoices, emitted] })
        return emitted
      },
    }),
    {
      name: 'valdeon-gestion-demo',
      version: 2,
      // zustand's default storage option references `window.localStorage`
      // literally, which throws (and silently disables the whole `.persist`
      // API) outside a browser-like global `window` — reference the global
      // directly so it works in both the browser and the Vitest/Node run.
      storage: createJSONStorage(() => localStorage),
      migrate: () => createInitialState(),
      partialize: (state) => ({
        providers: state.providers,
        tariffs: state.tariffs,
        integrateds: state.integrateds,
        invoices: state.invoices,
        cebas: state.cebas,
        payments: state.payments,
        receivables: state.receivables,
        clients: state.clients,
        logisticsMovements: state.logisticsMovements,
        settlements: state.settlements,
        emittedInvoices: state.emittedInvoices,
        transporters: state.transporters,
        trucks: state.trucks,
        feedConsumptionHistory: state.feedConsumptionHistory,
      }),
    },
  ),
)
