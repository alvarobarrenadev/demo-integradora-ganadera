import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './useAppStore'
import { createInitialState } from './initialState'
import { calculatePriceDiscrepancy, getApplicableTariff } from '../domain/invoices'
import { selectRetentionLedger } from './selectors'

beforeEach(() => {
  useAppStore.setState({ ...createInitialState(), toast: null, lastSimulatedInvoiceId: null })
})

describe('validateInvoice', () => {
  it('propagates a feed invoice: status, Payment, and ceba feedKg/feedCost (base only, no freight)', () => {
    const before = useAppStore.getState()
    const invoice = before.invoices.find((i) => i.id === '7091')! // #5 -> V-122, AgroFeed
    const ceba = before.cebas.find((c) => c.id === 'V-122')!

    useAppStore.getState().validateInvoice('7091')
    const after = useAppStore.getState()

    const patched = after.invoices.find((i) => i.id === '7091')!
    expect(patched.status).toBe('validated')
    expect(patched.sentToAccounting).toBe(true)
    expect(patched.archived).toBe(true)

    const payment = after.payments.find((p) => p.sourceId === '7091')!
    expect(payment.amount).toBe(invoice.total) // includes freight
    expect(payment.sourceType).toBe('invoice')

    const patchedCeba = after.cebas.find((c) => c.id === 'V-122')!
    expect(patchedCeba.feedKg).toBe(ceba.feedKg + invoice.kg!)
    expect(patchedCeba.feedCost).toBeCloseTo(ceba.feedCost + invoice.kg! * invoice.invoicedPricePerKg!, 2)
  })

  it('routes a medication invoice to medicationCost only, via provider.category', () => {
    const before = useAppStore.getState()
    const ceba = before.cebas.find((c) => c.id === 'V-121')!
    useAppStore.getState().validateInvoice('7092') // #22 -> V-121, VetSalud/P5
    const after = useAppStore.getState()
    const patchedCeba = after.cebas.find((c) => c.id === 'V-121')!
    expect(patchedCeba.medicationCost).toBeCloseTo(ceba.medicationCost + 742.4, 2)
    expect(patchedCeba.feedKg).toBe(ceba.feedKg) // unchanged
  })

  it('is idempotent — validating twice does not double-add feed or create a second Payment', () => {
    useAppStore.getState().validateInvoice('7091')
    const afterFirst = useAppStore.getState()
    useAppStore.getState().validateInvoice('7091')
    const afterSecond = useAppStore.getState()

    expect(afterSecond.payments.filter((p) => p.sourceId === '7091').length).toBe(1)
    expect(afterSecond.cebas.find((c) => c.id === 'V-122')).toEqual(afterFirst.cebas.find((c) => c.id === 'V-122'))
  })

  it('is atomic: fails entirely (no partial commit) when the target integrated has no active/ready ceba', () => {
    // #26's only ceba (V-112) is closed — 7090 targets #26.
    const before = useAppStore.getState()
    useAppStore.getState().validateInvoice('7090')
    const after = useAppStore.getState()

    expect(after.invoices).toEqual(before.invoices) // status untouched
    expect(after.payments).toEqual(before.payments) // no Payment created
    expect(after.cebas).toEqual(before.cebas)
    expect(after.toast?.variant).toBe('error')
  })

  it('discrepancy remains derivable/displayable after the invoice is validated', () => {
    // Synthetic invoice with a discrepancy, targeting #14 (has a valid active ceba).
    const before = useAppStore.getState()
    const overpriced = {
      ...before.invoices.find((i) => i.id === '7094')!,
      id: 'synthetic-disc',
      invoicedPricePerKg: 0.5, // well above the 0,408 July tariff for Starter N-1
    }
    useAppStore.setState({ invoices: [...before.invoices, overpriced] })

    useAppStore.getState().validateInvoice('synthetic-disc')
    const validated = useAppStore.getState().invoices.find((i) => i.id === 'synthetic-disc')!
    expect(validated.status).toBe('validated') // workflow moved on...

    // ...but the discrepancy is still derivable, independent of status.
    const tariff = getApplicableTariff(validated.providerId, validated.feedType!, validated.date, useAppStore.getState().tariffs)
    const discrepancy = calculatePriceDiscrepancy(validated, tariff)
    expect(discrepancy.hasDiscrepancy).toBe(true)
    expect(discrepancy.amount).toBeGreaterThan(0)
  })

  it('never propagates into a closed ceba', () => {
    const before = useAppStore.getState()
    // Close V-118 first via a fresh valid ceba to test the guard directly.
    useAppStore.setState({
      cebas: before.cebas.map((c) => (c.id === 'V-118' ? { ...c, status: 'closed' as const } : c)),
    })
    useAppStore.getState().validateInvoice('7094') // targets #14 -> V-118, now closed
    const after = useAppStore.getState()
    expect(after.invoices.find((i) => i.id === '7094')!.status).not.toBe('validated')
    expect(after.toast?.variant).toBe('error')
  })
})

describe('closeCeba', () => {
  it('closes V-118, sets closeDate, and clears Integrated.activeCebaId', () => {
    useAppStore.getState().closeCeba('V-118')
    const state = useAppStore.getState()
    const ceba = state.cebas.find((c) => c.id === 'V-118')!
    expect(ceba.status).toBe('closed')
    expect(ceba.closeDate).toBe('2026-07-15')
    const integrated = state.integrateds.find((i) => i.id === 14)!
    expect(integrated.activeCebaId).toBeUndefined()
  })

  it('is idempotent — closing twice leaves closeDate unchanged', () => {
    useAppStore.getState().closeCeba('V-118')
    const first = useAppStore.getState().cebas.find((c) => c.id === 'V-118')!
    useAppStore.getState().closeCeba('V-118')
    const second = useAppStore.getState().cebas.find((c) => c.id === 'V-118')!
    expect(second).toEqual(first)
  })

  it('refuses a normal active ceba (not ready_to_close)', () => {
    const before = useAppStore.getState()
    useAppStore.getState().closeCeba('V-119') // active, not ready
    const after = useAppStore.getState()
    expect(after.cebas.find((c) => c.id === 'V-119')!.status).toBe('active')
    expect(after.toast?.variant).toBe('error')
    void before
  })

  it('refuses when animals are not fully accounted for, even if flagged ready_to_close', () => {
    const before = useAppStore.getState()
    useAppStore.setState({
      cebas: before.cebas.map((c) =>
        c.id === 'V-118' ? { ...c, status: 'ready_to_close' as const, animalsExited: 1000 } : c, // + 21 deaths != 1180 entered
      ),
    })
    useAppStore.getState().closeCeba('V-118')
    const after = useAppStore.getState()
    expect(after.cebas.find((c) => c.id === 'V-118')!.status).toBe('ready_to_close')
    expect(after.toast?.variant).toBe('error')
  })

  it('refuses when weight gain is not positive', () => {
    const before = useAppStore.getState()
    useAppStore.setState({
      cebas: before.cebas.map((c) => (c.id === 'V-118' ? { ...c, status: 'ready_to_close' as const, exitKg: c.entryKg } : c)),
    })
    useAppStore.getState().closeCeba('V-118')
    const after = useAppStore.getState()
    expect(after.cebas.find((c) => c.id === 'V-118')!.status).toBe('ready_to_close')
    expect(after.toast?.variant).toBe('error')
  })
})

describe('generateSettlement', () => {
  it('rejects a non-closed ceba', () => {
    const result = useAppStore.getState().generateSettlement('V-118') // still ready_to_close, not closed
    expect(result).toBeUndefined()
    expect(useAppStore.getState().settlements).toHaveLength(0)
  })

  it('produces the real V-118 figures and Payment.amount = netAmount', () => {
    useAppStore.getState().closeCeba('V-118')
    const settlement = useAppStore.getState().generateSettlement('V-118')!
    expect(settlement.pigs).toBe(1159)
    expect(settlement.conversion).toBeCloseTo(2.12, 2) // no demo invoice validated yet in this test
    expect(settlement.netAmount).toBeLessThan(settlement.grossAmount)

    const payment = useAppStore.getState().payments.find((p) => p.sourceId === settlement.id)!
    expect(payment.amount).toBe(settlement.netAmount)
    expect(payment.amount).not.toBe(settlement.grossAmount)
  })

  it('is idempotent — a second call returns the same settlement, no duplicate Payment', () => {
    useAppStore.getState().closeCeba('V-118')
    const first = useAppStore.getState().generateSettlement('V-118')!
    const second = useAppStore.getState().generateSettlement('V-118')!
    expect(second.id).toBe(first.id)
    expect(useAppStore.getState().settlements).toHaveLength(1)
    expect(useAppStore.getState().payments.filter((p) => p.sourceId === first.id)).toHaveLength(1)
  })
})

describe('generateEmittedInvoice', () => {
  it('is decoupled from generateSettlement (not auto-created)', () => {
    useAppStore.getState().closeCeba('V-118')
    useAppStore.getState().generateSettlement('V-118')
    expect(useAppStore.getState().emittedInvoices).toHaveLength(0)
  })

  it('creates a well-formed, independently-numbered EmittedInvoice, idempotent per settlement', () => {
    useAppStore.getState().closeCeba('V-118')
    const settlement = useAppStore.getState().generateSettlement('V-118')!
    const first = useAppStore.getState().generateEmittedInvoice(settlement.id)!
    expect(first.emittedNumber).toMatch(/^FE-2026-\d{3}$/)
    const second = useAppStore.getState().generateEmittedInvoice(settlement.id)!
    expect(second.id).toBe(first.id)
    expect(useAppStore.getState().emittedInvoices).toHaveLength(1)
  })
})

describe('selectRetentionLedger', () => {
  it('sums Settlement.retentionAmount per integrado, unaffected by EmittedInvoice generation', () => {
    useAppStore.getState().closeCeba('V-118')
    const settlement = useAppStore.getState().generateSettlement('V-118')!

    const beforeEmission = selectRetentionLedger(useAppStore.getState())
    const entry = beforeEmission.find((r) => r.integratedId === 14)!
    expect(entry.retentionAmount).toBeCloseTo(settlement.retentionAmount, 2)

    useAppStore.getState().generateEmittedInvoice(settlement.id)
    const afterEmission = selectRetentionLedger(useAppStore.getState())
    expect(afterEmission.find((r) => r.integratedId === 14)!.retentionAmount).toBeCloseTo(settlement.retentionAmount, 2)
  })

  it('sums correctly across multiple settlements for the same integrado (synthetic)', () => {
    const before = useAppStore.getState()
    useAppStore.setState({
      settlements: [
        ...before.settlements,
        { id: 's1', cebaId: 'c1', integratedId: 99, pigs: 100, conversion: 2, baseAmount: 1350, bonusPerPig: 1.2, bonusAmount: 120, grossAmount: 1470, retentionRate: 0.02, retentionAmount: 29.4, netAmount: 1440.6, generatedAt: '2026-07-15' },
        { id: 's2', cebaId: 'c2', integratedId: 99, pigs: 80, conversion: 2, baseAmount: 1080, bonusPerPig: 1.2, bonusAmount: 96, grossAmount: 1176, retentionRate: 0.02, retentionAmount: 23.52, netAmount: 1152.48, generatedAt: '2026-07-15' },
      ],
    })
    const ledger = selectRetentionLedger(useAppStore.getState())
    const entry = ledger.find((r) => r.integratedId === 99)!
    expect(entry.retentionAmount).toBeCloseTo(29.4 + 23.52, 2)
  })
})

describe('addCebaEntry / addCebaExit / addLogisticsMovement', () => {
  it('addCebaEntry atomically creates the Ceba, its LogisticsMovement, and sets activeCebaId', () => {
    useAppStore.getState().addCebaEntry({ integratedId: 1, date: '2026-07-01', origin: 'Test', animals: 500, kg: 9500 })
    const state = useAppStore.getState()
    const integrated = state.integrateds.find((i) => i.id === 1)!
    const ceba = state.cebas.find((c) => c.id === integrated.activeCebaId)!
    expect(ceba.animalsEntered).toBe(500)
    const movement = state.logisticsMovements.find((m) => m.cebaId === ceba.id)!
    expect(movement.type).toBe('entrada')
  })

  it('addCebaEntry refuses when the integrated already has an active ceba', () => {
    const before = useAppStore.getState()
    useAppStore.getState().addCebaEntry({ integratedId: 14, date: '2026-07-01', origin: 'x', animals: 100, kg: 2000 })
    const after = useAppStore.getState()
    expect(after.cebas).toEqual(before.cebas)
    expect(after.toast?.variant).toBe('error')
  })

  it('addCebaExit and addLogisticsMovement salida share the same aggregate result for equivalent input', () => {
    useAppStore.getState().addCebaExit({ cebaId: 'V-119', date: '2026-07-01', animals: 100, kg: 11500 })
    const viaAddCebaExit = useAppStore.getState().cebas.find((c) => c.id === 'V-119')!

    useAppStore.setState({ ...createInitialState(), toast: null, lastSimulatedInvoiceId: null })
    useAppStore.getState().addLogisticsMovement({
      id: 'manual-1', type: 'salida', date: '2026-07-01', integratedId: 18, cebaId: 'V-119', animals: 100, kg: 11500,
    })
    const viaAddLogisticsMovement = useAppStore.getState().cebas.find((c) => c.id === 'V-119')!

    expect(viaAddCebaExit.animalsExited).toBe(viaAddLogisticsMovement.animalsExited)
    expect(viaAddCebaExit.exitKg).toBe(viaAddLogisticsMovement.exitKg)
    expect(viaAddCebaExit.status).toBe(viaAddLogisticsMovement.status)
  })

  it('flips to ready_to_close once every animal is accounted for', () => {
    // V-119: 1020 entered, 9 dead -> needs 1011 exited to be fully accounted for.
    useAppStore.getState().addCebaExit({ cebaId: 'V-119', date: '2026-07-01', animals: 1011, kg: 115000 })
    expect(useAppStore.getState().cebas.find((c) => c.id === 'V-119')!.status).toBe('ready_to_close')
  })

  it('refuses to mutate a closed ceba', () => {
    useAppStore.getState().closeCeba('V-118')
    const before = useAppStore.getState()
    useAppStore.getState().addLogisticsMovement({
      id: 'manual-2', type: 'salida', date: '2026-07-16', integratedId: 14, cebaId: 'V-118', animals: 5, kg: 500,
    })
    const after = useAppStore.getState()
    expect(after.cebas).toEqual(before.cebas)
    expect(after.toast?.variant).toBe('error')
  })

  it('guards duplicate movement ids', () => {
    const movement = {
      id: 'dup-1' as const, type: 'salida' as const, date: '2026-07-01', integratedId: 18, cebaId: 'V-119', animals: 50, kg: 5500,
    }
    useAppStore.getState().addLogisticsMovement(movement)
    const after1 = useAppStore.getState().cebas.find((c) => c.id === 'V-119')!
    useAppStore.getState().addLogisticsMovement(movement) // same id again
    const after2 = useAppStore.getState().cebas.find((c) => c.id === 'V-119')!
    expect(after2).toEqual(after1)
    expect(useAppStore.getState().logisticsMovements.filter((m) => m.id === 'dup-1')).toHaveLength(1)
  })
})

describe('applyAugustTariffs', () => {
  it('adds P1-P4 rows and excludes P5, idempotently', () => {
    useAppStore.getState().applyAugustTariffs()
    const state = useAppStore.getState()
    const august = state.tariffs.filter((t) => t.month === '2026-08')
    expect(august.length).toBeGreaterThan(0)
    expect(august.some((t) => t.providerId === 'P5')).toBe(false)

    const countAfterFirst = state.tariffs.length
    useAppStore.getState().applyAugustTariffs()
    expect(useAppStore.getState().tariffs.length).toBe(countAfterFirst) // no duplicates
  })
})

describe('resetDemo', () => {
  it('restores every persisted field to seed values and keeps actions callable', () => {
    useAppStore.getState().validateInvoice('7091')
    useAppStore.getState().closeCeba('V-118')
    expect(useAppStore.getState().cebas.find((c) => c.id === 'V-118')!.status).toBe('closed')

    useAppStore.getState().resetDemo()
    const state = useAppStore.getState()

    expect(state.cebas.find((c) => c.id === 'V-118')!.status).toBe('ready_to_close')
    expect(state.invoices.find((i) => i.id === '7091')!.status).toBe('pending')
    expect(typeof state.validateInvoice).toBe('function')
    expect(typeof state.closeCeba).toBe('function')
    expect(typeof state.generateSettlement).toBe('function')

    // Actions still work after reset.
    state.validateInvoice('7091')
    expect(useAppStore.getState().invoices.find((i) => i.id === '7091')!.status).toBe('validated')
  })
})

describe('seed consistency', () => {
  it('every validated seed invoice has a matching Payment and coherent workflow flags', () => {
    const state = useAppStore.getState()
    for (const invoice of state.invoices) {
      if (invoice.status !== 'validated') continue
      expect(invoice.sentToAccounting).toBe(true)
      expect(invoice.archived).toBe(true)
      const payment = state.payments.find((p) => p.sourceType === 'invoice' && p.sourceId === invoice.id)
      expect(payment).toBeDefined()
    }
  })
})
