import { describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { buildAccountingCsv } from './accounting'

describe('buildAccountingCsv', () => {
  it('exports only validated invoices from the selected month with summary and detail', () => {
    const state = createInitialState()
    const expected = state.invoices.filter(
      (invoice) => invoice.status === 'validated' && invoice.date.startsWith('2026-07'),
    )
    const csv = buildAccountingCsv('2026-07', state.invoices, state.providers, state.integrateds)

    expect(csv).toContain('"Mes";"2026-07"')
    expect(csv).toContain(`"Nº facturas";"${expected.length}"`)
    expect(csv).toContain('"Nº interno";"Nº proveedor";"Fecha"')
    for (const invoice of expected) expect(csv).toContain(`"${invoice.internalNumber}"`)
    expect(csv).not.toContain('"7090"')
  })
})
