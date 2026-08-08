import { useAppStore } from '../store/useAppStore'
import { PageHeader } from '../components/common/PageHeader'
import { selectRetentionLedger } from '../store/selectors'
import { fmtEUR } from '../utils/currency'
import { formatDateEs } from '../utils/dates'

export function EmittedInvoicesPage() {
  const state = useAppStore()
  const generateEmittedInvoice = useAppStore((s) => s.generateEmittedInvoice)

  const settlementsWithoutInvoice = state.settlements.filter(
    (s) => !state.emittedInvoices.some((e) => e.settlementId === s.id),
  )
  const retentionLedger = selectRetentionLedger(state)

  const handleGenerate = async (settlementId: string) => {
    const emitted = generateEmittedInvoice(settlementId)
    if (!emitted) return
    const settlement = state.settlements.find((s) => s.id === settlementId)
    const integrated = state.integrateds.find((i) => i.id === emitted.integratedId)
    if (!settlement || !integrated) return
    const { downloadEmittedInvoicePdf } = await import('../utils/pdf')
    downloadEmittedInvoicePdf({
      emittedNumber: emitted.emittedNumber,
      integratedName: `#${integrated.id} ${integrated.name}`,
      date: emitted.date,
      baseAmount: settlement.baseAmount,
      bonusAmount: settlement.bonusAmount,
      grossAmount: settlement.grossAmount,
      retentionAmount: settlement.retentionAmount,
      netAmount: settlement.netAmount,
    })
  }

  const handleRedownload = async (emittedId: string) => {
    const emitted = state.emittedInvoices.find((e) => e.id === emittedId)
    if (!emitted) return
    const settlement = state.settlements.find((s) => s.id === emitted.settlementId)
    const integrated = state.integrateds.find((i) => i.id === emitted.integratedId)
    if (!settlement || !integrated) return
    const { downloadEmittedInvoicePdf } = await import('../utils/pdf')
    downloadEmittedInvoicePdf({
      emittedNumber: emitted.emittedNumber,
      integratedName: `#${integrated.id} ${integrated.name}`,
      date: emitted.date,
      baseAmount: settlement.baseAmount,
      bonusAmount: settlement.bonusAmount,
      grossAmount: settlement.grossAmount,
      retentionAmount: settlement.retentionAmount,
      netAmount: settlement.netAmount,
    })
  }

  return (
    <div>
      <PageHeader title="Facturas emitidas a integrados" subtitle="Documento formal de cada liquidación, con numeración propia (FE-AAAA-NNN) y PDF descargable." />

      {settlementsWithoutInvoice.length > 0 ? (
        <div className="card mb-4">
          <div className="section-title">Liquidaciones pendientes de emitir factura</div>
          <div className="kv-list">
            {settlementsWithoutInvoice.map((s) => {
              const integrated = state.integrateds.find((i) => i.id === s.integratedId)
              return (
                <div key={s.id} className="kv-row">
                  <span className="kv-row__label">{s.cebaId} — #{s.integratedId} {integrated?.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="kv-row__value">{fmtEUR(s.netAmount)}</span>
                    <button type="button" className="btn btn-primary" onClick={() => handleGenerate(s.id)}>Generar factura emitida</button>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="data-table-wrap mb-4">
        <table className="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Integrado</th>
              <th>Fecha</th>
              <th className="cell-num">Retención 2%</th>
              <th className="cell-num">Importe</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {state.emittedInvoices.map((e) => (
              <tr key={e.id}>
                <td className="cell-strong">{e.emittedNumber}</td>
                <td>#{e.integratedId} {state.integrateds.find((i) => i.id === e.integratedId)?.name}</td>
                <td>{formatDateEs(e.date)}</td>
                <td className="cell-num">{fmtEUR(e.retentionAmount)}</td>
                <td className="cell-num cell-strong">{fmtEUR(e.amount)}</td>
                <td><button type="button" className="btn btn-ghost" onClick={() => handleRedownload(e.id)}>Descargar PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {state.emittedInvoices.length === 0 ? <div className="table-empty">Aún no se ha generado ninguna factura emitida.</div> : null}
      </div>

      <div className="card">
        <div className="section-title">Ledger de retenciones (2%) por integrado</div>
        {retentionLedger.length === 0 ? (
          <p className="page-subtitle">Sin liquidaciones generadas todavía.</p>
        ) : (
          <div className="kv-list">
            {retentionLedger.map((r) => (
              <div key={r.integratedId} className="kv-row">
                <span className="kv-row__label">#{r.integratedId} {r.name}</span>
                <span className="kv-row__value">{fmtEUR(r.retentionAmount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
