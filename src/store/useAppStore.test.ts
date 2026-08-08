import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './useAppStore'
import { createInitialState } from './initialState'
import { calculatePriceDiscrepancy, getApplicableTariff } from '../domain/invoices'
import { selectFeedYearComparison, selectRetentionLedger, selectWeeklyCashForecast } from './selectors'

beforeEach(() => {
  useAppStore.setState({ ...createInitialState(), currentRole: 'admin', toast: null, lastSimulatedInvoiceId: null })
})

describe('role permissions', () => {
  it('blocks mutations for Dirección and allows accounting exports for Contable', () => {
    const invoiceCount = useAppStore.getState().invoices.length
    useAppStore.getState().setCurrentRole('direction')
    useAppStore.getState().simulateIncomingInvoice()
    expect(useAppStore.getState().invoices).toHaveLength(invoiceCount)
    expect(useAppStore.getState().toast?.variant).toBe('error')

    useAppStore.setState({ currentRole: 'accounting', settlements: [{
      id: 'SET-ROLE', cebaId: 'V-118', integratedId: 14, pigs: 1, conversion: 2.3,
      baseAmount: 13.5, bonusPerPig: 1.2, bonusAmount: 1.2, grossAmount: 14.7,
      retentionRate: 0.02, retentionAmount: 0.29,
      netAmount: 14.41, generatedAt: '2026-07-15',
    }] })
    expect(useAppStore.getState().generateEmittedInvoice('SET-ROLE')).toBeDefined()
  })
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
    useAppStore.getState().addCebaEntry({ integratedId: 1, date: '2026-07-01', origin: 'Test', feedType: 'Cebo Final', animals: 500, kg: 9500 })
    const state = useAppStore.getState()
    const integrated = state.integrateds.find((i) => i.id === 1)!
    const ceba = state.cebas.find((c) => c.id === integrated.activeCebaId)!
    expect(ceba.animalsEntered).toBe(500)
    expect(ceba.feedType).toBe('Cebo Final')
    const movement = state.logisticsMovements.find((m) => m.cebaId === ceba.id)!
    expect(movement.type).toBe('entrada')
  })

  it('addCebaEntry refuses when the integrated already has an active ceba', () => {
    const before = useAppStore.getState()
    useAppStore.getState().addCebaEntry({ integratedId: 14, date: '2026-07-01', origin: 'x', feedType: 'Cebo N-80', animals: 100, kg: 2000 })
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

  it('rejects invalid or mismatched logistics data without mutating a ceba', () => {
    const before = useAppStore.getState()
    useAppStore.getState().addLogisticsMovement({
      id: 'invalid-1', type: 'salida', date: '2026-07-15', integratedId: 14, cebaId: 'V-119', animals: 5, kg: 500,
    })
    expect(useAppStore.getState().cebas).toEqual(before.cebas)
    expect(useAppStore.getState().toast?.variant).toBe('error')
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

  it('keeps every ceba entry and exit total aligned with logistics', () => {
    const state = useAppStore.getState()
    for (const ceba of state.cebas) {
      const entry = state.logisticsMovements.find((movement) => movement.type === 'entrada' && movement.cebaId === ceba.id)
      expect(entry?.animals).toBe(ceba.animalsEntered)
      expect(entry?.kg).toBe(ceba.entryKg)
      const exits = state.logisticsMovements.filter((movement) => movement.type === 'salida' && movement.cebaId === ceba.id)
      expect(exits.reduce((sum, movement) => sum + movement.animals, 0)).toBe(ceba.animalsExited)
      expect(exits.reduce((sum, movement) => sum + movement.kg, 0)).toBe(ceba.exitKg)
    }
  })

  it('contains the literal client and receivable examples from the brief', () => {
    const state = useAppStore.getState()
    expect(state.clients.find((client) => client.id === 'CLI-2')).toMatchObject({ paymentMethod: 'Confirming', avgCollectionDays: 45 })
    expect(state.clients.find((client) => client.id === 'CLI-3')).toMatchObject({ paymentMethod: 'Pagaré', bankId: 'Banco Duero', avgCollectionDays: 60 })
    expect(state.receivables.some((receivable) => receivable.clientId === 'CLI-1' && receivable.amount === 43300)).toBe(true)
    expect(state.receivables.some((receivable) => receivable.clientId === 'CLI-2' && receivable.amount === 22400 && receivable.dueDate === '2026-07-06')).toBe(true)
  })

  it('has real consumption history for annual and prior-year reporting', () => {
    const history = useAppStore.getState().feedConsumptionHistory
    expect(history.some((row) => row.month.startsWith('2025-'))).toBe(true)
    expect(history.some((row) => row.month.startsWith('2026-'))).toBe(true)
    expect(history.every((row) => row.integratedId > 0 && row.feedType.length > 0)).toBe(true)
  })

  it('provides a paid example with theoretical and real payment dates', () => {
    expect(useAppStore.getState().payments.find((payment) => payment.id === 'PAY-6001')).toMatchObject({
      status: 'paid', dueDate: '2026-07-05', paidAt: '2026-07-08',
    })
  })

  it('compares feed consumption over the same months and includes newly validated invoices', () => {
    const before = selectFeedYearComparison(useAppStore.getState())
    const currentBefore = before.annual.find((row) => row.year === before.currentYear)!
    expect(before.cutoffMonth).toBe('07')
    expect(before.trend).toHaveLength(7)

    useAppStore.getState().validateInvoice('7091')
    const after = selectFeedYearComparison(useAppStore.getState())
    const currentAfter = after.annual.find((row) => row.year === after.currentYear)!
    expect(currentAfter.kg).toBe(currentBefore.kg + 9400)
  })
})

describe('complete demo flow', () => {
  it('propagates the simulated invoice through V-118 settlement and weekly cash forecast', () => {
    const before = useAppStore.getState().cebas.find((ceba) => ceba.id === 'V-118')!
    useAppStore.getState().simulateIncomingInvoice()
    const invoiceId = useAppStore.getState().lastSimulatedInvoiceId!
    useAppStore.getState().validateInvoice(invoiceId)

    const afterValidation = useAppStore.getState()
    expect(afterValidation.invoices.find((invoice) => invoice.id === invoiceId)?.status).toBe('validated')
    expect(afterValidation.payments.some((payment) => payment.sourceId === invoiceId)).toBe(true)
    expect(afterValidation.cebas.find((ceba) => ceba.id === 'V-118')?.feedKg).toBe(before.feedKg + 18200)

    useAppStore.getState().closeCeba('V-118')
    const settlement = useAppStore.getState().generateSettlement('V-118')!
    const payment = useAppStore.getState().payments.find((item) => item.sourceId === settlement.id)!
    expect(payment.amount).toBe(settlement.netAmount)
    expect(payment.dueDate).toBe('2026-07-25')
    expect(selectWeeklyCashForecast(useAppStore.getState(), 2)[1].payments).toBeGreaterThanOrEqual(payment.amount)
  })
})
